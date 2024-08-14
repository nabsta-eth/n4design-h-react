import z from "zod";
import { MutableRefObject } from "react";
import { sleep } from "../../utils/general";
import { parseAmount } from "handle-sdk/dist/components/trade/reader";
import { TiprPublicationRouter } from "./Incentives";
import { pairFromString } from "handle-sdk/dist/utils/general";
import axios from "axios";

const INITIAL_BACKOFF_MS = 100;
const MAX_BACKOFF_MS = 5000;

const BigNumberFromBigDecimal = z.string().transform(v => parseAmount(v));

export const incentivesNetworks = ["arbitrum-sepolia", "arbitrum"] as const;

export type IncentivesNetwork = (typeof incentivesNetworks)[number];

export const INCENTIVES_WS_URL: Record<IncentivesNetwork, string> = {
  "arbitrum-sepolia": "wss://staging.incentives.api.handle.fi",
  arbitrum: "wss://incentives.api.handle.fi",
};

export const INCENTIVES_HTTP_URL: Record<IncentivesNetwork, string> = {
  "arbitrum-sepolia": "https://staging.incentives.api.handle.fi",
  arbitrum: "https://incentives.api.handle.fi",
};

const SecondsFromRustDuration = z
  .object({
    secs: z.number(),
    nanos: z.number(),
  })
  .transform(v => v.secs);

const IncentiveTransactionInputTradeAccountUser = z.object({
  type: z.literal("tradeAccount"),
  id: z.number(),
});

const IncentiveTransactionInput = z.object({
  value: BigNumberFromBigDecimal,
  currentUnixTimestamp: z.number(),
  transactionTimestamp: z.number(),
  criteriaEligibilityFraction: BigNumberFromBigDecimal,
  user: IncentiveTransactionInputTradeAccountUser,
});

const IncentiveTransactionOutcomeEligibility = z.object({
  fraction: BigNumberFromBigDecimal,
  amount: BigNumberFromBigDecimal,
});

const IncentiveTransactionOutcomeEligible = z.object({
  outcome: z.literal("eligible"),
  content: IncentiveTransactionOutcomeEligibility,
});

const IncentiveTransactionOutcome = z
  .object({
    outcome: z
      .literal("ineligibleCriteria")
      .or(z.literal("ineligibleTimeWindow"))
      .or(z.literal("balanceBelowThreshold")),
  })
  .or(IncentiveTransactionOutcomeEligible);

const IncentiveTransactionOutput = z.object({
  input: IncentiveTransactionInput,
  outcome: IncentiveTransactionOutcome,
  newBalance: BigNumberFromBigDecimal,
});

const TimeWindowIncentiveConfig = z.object({
  balanceThreshold: BigNumberFromBigDecimal,
  period: SecondsFromRustDuration,
  timeWindow: SecondsFromRustDuration,
});

const TimeWindowIncentiveState = z.object({
  currentBalance: BigNumberFromBigDecimal,
});

const TimeWindowIncentive = z.object({
  config: TimeWindowIncentiveConfig,
  state: TimeWindowIncentiveState,
});

const TiprSetup = z.object({
  instance: TimeWindowIncentive,
  eligiblePairs: z.array(z.string().transform(s => pairFromString(s))),
});

const TiprPublicationTransaction = z.object({
  type: z.literal("transaction"),
  content: IncentiveTransactionOutput,
});

const TiprPublicationSetup = z.object({
  type: z.literal("setup"),
  content: TiprSetup,
});

const TiprPublication = z.object({
  topic: z.literal("tipr"),
  content: TiprPublicationTransaction.or(TiprPublicationSetup),
});

const Publication = z.object({
  type: z.literal("publication"),
  content: TiprPublication,
});

const Response = z.object({
  result: Publication.optional(),
  error: z.unknown().optional(),
});

const TiprEligibilityCriterion = z.object({
  has: z.number(),
  required: z.number(),
  isMet: z.boolean(),
});

const TiprBonusEligibilityCriteria = z.object({
  veForex: TiprEligibilityCriterion,
  t0Trooper: TiprEligibilityCriterion,
});

export type IncentiveTransactionOutput = z.infer<
  typeof IncentiveTransactionOutput
>;

export type TiprPublication = z.infer<typeof TiprPublication>;

export type Response = z.infer<typeof Response>;

export type TiprBonusEligibilityCriteria = z.infer<
  typeof TiprBonusEligibilityCriteria
>;

let isSettingUpWs = false;

export const setupIncentivesWs = (
  url: string,
  wsRef: MutableRefObject<WebSocket | undefined>,
  router: TiprPublicationRouter,
  retryCount = 0,
  retryTimestamp = Date.now(),
) => {
  if (wsRef.current?.readyState === 0 || wsRef.current?.readyState === 1) {
    console.warn("would duplicate incentives ws connection; aborting");
    return;
  }
  if (isSettingUpWs) {
    console.warn("would set up multiple incentives ws; aborting");
    return;
  }
  isSettingUpWs = true;
  try {
    trySetupIncentivesWs(url, wsRef, router, retryCount, retryTimestamp);
  } finally {
    isSettingUpWs = false;
  }
};

const trySetupIncentivesWs = (
  url: string,
  wsRef: MutableRefObject<WebSocket | undefined>,
  router: TiprPublicationRouter,
  retryCount = 0,
  retryTimestamp = Date.now(),
) => {
  wsRef.current = new WebSocket(url);
  wsRef.current.onerror = async e => {
    console.error(e);
    await sleep(getBackoffMs(retryCount));
    wsRef.current = undefined;
    setupIncentivesWs(
      url,
      wsRef,
      router,
      getNextRetry(retryCount, retryTimestamp),
    );
  };
  wsRef.current.onclose = async e => {
    console.debug("incentives ws closed", e);
    if (wsRef.current) {
      wsRef.current.close = () => {};
    }
    await sleep(getBackoffMs(retryCount));
    wsRef.current = undefined;
    setupIncentivesWs(
      url,
      wsRef,
      router,
      getNextRetry(retryCount, retryTimestamp),
    );
  };
  subscribeWs(wsRef.current, router);
};

const getNextRetry = (retryCount: number, lastTimestamp: number) =>
  Date.now() - lastTimestamp <= MAX_BACKOFF_MS ? retryCount + 1 : 0;

const subscribeWs = (ws: WebSocket, router: TiprPublicationRouter) => {
  ws.onopen = () => {
    console.debug("incentives ws opened");
    ws.send(JSON.stringify({ method: "subscribe", params: { topic: "tipr" } }));
  };
  ws.onmessage = m => {
    const response = Response.parse(JSON.parse(m.data));
    if (response.error) {
      console.error("ws message error: ", response.error);
      return;
    }
    if (!response.result) {
      console.error("no ws message error, but result is undefined");
      return;
    }
    router(response.result.content);
  };
};

const getBackoffMs = (count: number) =>
  Math.min(INITIAL_BACKOFF_MS * count ** 2, MAX_BACKOFF_MS);

export const fetchTiprBonusEligibilityCriteria = async (
  address: string | undefined,
  network: IncentivesNetwork,
): Promise<TiprBonusEligibilityCriteria | undefined> => {
  if (!address) {
    return undefined;
  }
  const url = `${INCENTIVES_HTTP_URL[network]}/tipr/eligibility/${address}`;
  const result = await axios.get(url);
  return TiprBonusEligibilityCriteria.parse(result.data);
};
