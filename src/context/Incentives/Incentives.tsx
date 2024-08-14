import { BigNumber, constants } from "ethers";
import {
  createContext,
  MutableRefObject,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  useConnectedAccount,
  useUserWalletStore,
} from "@handle-fi/react-components/dist/context/UserWallet";
import { CHAIN_ID_TO_NETWORK_NAME } from "handle-sdk/dist/constants";
import {
  TiprBonusEligibilityCriteria,
  IncentiveTransactionOutput,
  setupIncentivesWs,
  TiprPublication,
  INCENTIVES_WS_URL,
  IncentivesNetwork,
  incentivesNetworks,
  fetchTiprBonusEligibilityCriteria,
} from "./api";
import { Pair } from "handle-sdk/dist/types/trade";
import {
  TIPR_EXPLOSION_DURATION_IN_MS,
  TIPR_EXPLOSION_INTERVAL_DELAY_IN_MS,
  TIPR_NOTIFICATION_POSITION,
  TIPR_NOTIFICATION_TIMEOUT_IN_SECONDS,
  TIPR_WIN_ICON,
  TRADE_LP_DEFAULT_CURRENCY_SYMBOL,
} from "../../config/trade";
import { useTrade } from "../Trade";
import { TranslationMap } from "../../types/translation";
import { showNotification } from "@handle-fi/react-components/dist/utils/notifications";
import { bnToDisplayString } from "../../utils/format";
import { AMOUNT_DECIMALS } from "handle-sdk/dist/components/trade";
import { formatAmount } from "handle-sdk/dist/components/trade/reader";
import UIkit from "uikit";
import { useLanguageStore } from "../Translation";

export type Incentives = {
  // The state loads after there is an initial subscription to TIPR.
  tiprState?: TiprState;
  subscribeTipr: (cb: TimeWindowIncentiveCallback) => TiprSubscriptionId;
  unsubscribeTipr: (subscriptionId: TiprSubscriptionId) => void;
  isExploding: boolean;
  setIsExploding: React.Dispatch<React.SetStateAction<boolean>>;
};

export type TiprState = {
  balance: BigNumber;
  eligiblePairs: Pair[];
  // Only defined if user is connected.
  eligibility?: TiprBonusEligibilityCriteria;
};

export type TimeWindowIncentiveCallback = (
  output: IncentiveTransactionOutput,
) => void;

export type TiprSubscriptions = {
  [key: number]: TimeWindowIncentiveCallback | undefined;
};

export type TiprSubscriptionId = number;

export type TiprPublicationRouter = (publication: TiprPublication) => void;

const IncentivesContext = createContext<Incentives | null>(null);

export const IncentivesProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { connection } = useUserWalletStore();
  const { account } = useTrade();
  const { t } = useLanguageStore();
  const address = useConnectedAccount();
  const [tiprState, setTiprState] = useState<TiprState>();
  const tiprSubscriptionsRef = useRef<TiprSubscriptions>({});
  const wsRef = useRef<WebSocket>();
  const chainIdRef = useRef<number>();
  const routePublication = useCallback((publication: TiprPublication) => {
    routeTiprPublication(publication, setTiprState, tiprSubscriptionsRef);
  }, []);
  const trySetupWs = useCallback(() => {
    if (!chainIdRef.current) {
      return;
    }
    const network = CHAIN_ID_TO_NETWORK_NAME[chainIdRef.current];
    const url = INCENTIVES_WS_URL[network as IncentivesNetwork];
    if (!url) {
      console.warn(
        `network ${chainIdRef.current} not supported for incentives`,
      );
      return;
    }
    setupIncentivesWs(url, wsRef, routePublication);
  }, []);
  const subscribeTipr = useCallback((cb: TimeWindowIncentiveCallback) => {
    const nextId =
      Object.keys(tiprSubscriptionsRef.current).reduce(
        (a, b) => Math.max(a, +b),
        0,
      ) + 1;
    tiprSubscriptionsRef.current[nextId] = cb;
    const isFirstSubscription =
      Object.values(tiprSubscriptionsRef.current).length === 1;
    if (isFirstSubscription) {
      trySetupWs();
    }
    return nextId;
  }, []);
  const unsubscribeTipr = useCallback((id: TiprSubscriptionId) => {
    delete tiprSubscriptionsRef.current[id];
    const wasLastSubscription =
      Object.values(tiprSubscriptionsRef.current).length === 0;
    if (wasLastSubscription && wsRef.current && wsRef.current.readyState == 1) {
      wsRef.current.onclose = () => {};
      wsRef.current.close();
    }
  }, []);
  useEffect(() => {
    if (!connection.chain.isConnected) {
      return;
    }
    if (connection.chain.chainId === chainIdRef.current) {
      return;
    }
    chainIdRef.current = connection.chain.chainId;
    trySetupWs();
  }, [connection.chain]);
  useEffect(() => {
    if (!chainIdRef.current) {
      return;
    }
    const network = CHAIN_ID_TO_NETWORK_NAME[chainIdRef.current];
    if (!incentivesNetworks.includes(network as IncentivesNetwork)) {
      return;
    }
    fetchTiprBonusEligibilityCriteriaForAddress(
      address,
      network as IncentivesNetwork,
      setTiprState,
    ).catch(console.error);
  }, [address, connection.chain]);
  const [isExploding, setIsExploding] = useState(false);
  const explode = () => {
    setIsExploding(true);
    setTimeout(() => setIsExploding(false), TIPR_EXPLOSION_DURATION_IN_MS);
  };
  useEffect(() => {
    const subscriptionId = subscribeTipr(output => {
      handleTiprTransaction(output, account?.id, explode, t);
    });
    return () => unsubscribeTipr(subscriptionId);
  }, [account?.id]);
  const value = useMemo<Incentives>(
    () => ({
      tiprState,
      subscribeTipr,
      unsubscribeTipr,
      isExploding,
      setIsExploding,
    }),
    [tiprState, isExploding],
  );
  return (
    <IncentivesContext.Provider value={value}>
      {children}
    </IncentivesContext.Provider>
  );
};

export const useIncentives = () => {
  const context = useContext(IncentivesContext);
  if (!context) {
    throw new Error("Incentives context must be used in IncentivesProvider");
  }
  return context;
};

const routeTiprPublication = (
  publication: TiprPublication,
  setTiprState: React.Dispatch<React.SetStateAction<TiprState | undefined>>,
  tiprSubscriptionsRef: MutableRefObject<TiprSubscriptions>,
) => {
  switch (publication.content.type) {
    case "setup":
      const balance = publication.content.content.instance.state.currentBalance;
      const eligiblePairs = publication.content.content.eligiblePairs;
      setTiprState(s => ({
        balance,
        eligiblePairs,
        eligibility: s?.eligibility,
      }));
      break;
    case "transaction":
      // Update the state accordingly.
      const transaction = publication.content.content;
      setTiprState(s => ({
        balance: transaction.newBalance,
        eligiblePairs: s?.eligiblePairs ?? [],
        eligibility: s?.eligibility,
      }));
      // Notify subscribers.
      for (const id in tiprSubscriptionsRef.current) {
        const cb = tiprSubscriptionsRef.current[id];
        cb?.(publication.content.content);
      }
      break;
  }
};

const fetchTiprBonusEligibilityCriteriaForAddress = async (
  address: string | undefined,
  network: IncentivesNetwork,
  setTiprState: React.Dispatch<React.SetStateAction<TiprState | undefined>>,
) => {
  const eligibility = await fetchTiprBonusEligibilityCriteria(address, network);
  setTiprState(s => ({
    balance: s?.balance ?? constants.Zero,
    eligiblePairs: s?.eligiblePairs ?? [],
    eligibility,
  }));
};

const handleTiprTransaction = (
  output: IncentiveTransactionOutput,
  connectedAccountId: number | undefined,
  explode: () => void,
  t: TranslationMap,
) => {
  console.log("[handleTiprTransaction]", output);
  const wasEligibleTrade = output.input.criteriaEligibilityFraction.gt(0);
  if (!wasEligibleTrade) {
    return;
  }
  const isFromLocalUser =
    !!connectedAccountId && output.input.user.id === connectedAccountId;
  const winner =
    output.outcome.outcome === "eligible" ? output.outcome.content : undefined;
  if (winner && !isFromLocalUser) {
    showNotification({
      status: "success",
      message: getWinningMessageRemote(
        winner.fraction,
        winner.amount,
        output.input.user.id,
      ),
      icon: TIPR_WIN_ICON,
      timeoutInSeconds: TIPR_NOTIFICATION_TIMEOUT_IN_SECONDS,
      position: TIPR_NOTIFICATION_POSITION,
    });
    return;
  }
  if (!isFromLocalUser) {
    return;
  }
  if (!winner) {
    showNotification({
      status: "pending",
      icon: {
        name: "circle-x",
        prefix: "fas",
      },
      message: t.tiprTradeUnsuccessfulMessage,
      timeoutInSeconds: TIPR_NOTIFICATION_TIMEOUT_IN_SECONDS,
      position: TIPR_NOTIFICATION_POSITION,
    });
    return;
  }
  console.log(`%c🦍 TIPR WINNER!`, "font-weight: bold; font-size: 26px;");

  explode();
  // The explosion animation needs a small delay before being refired.
  const exploding = setInterval(() => {
    explode();
  }, TIPR_EXPLOSION_DURATION_IN_MS + TIPR_EXPLOSION_INTERVAL_DELAY_IN_MS);

  showNotification({
    status: "success",
    message: getWinningMessageLocal(winner.fraction, winner.amount),
    icon: TIPR_WIN_ICON,
    timeoutInSeconds: 0,
    position: TIPR_NOTIFICATION_POSITION,
  });

  showNotification({
    status: "success",
    message: t.tiprDepositPendingMessage,
    icon: TIPR_WIN_ICON,
    timeoutInSeconds: 0,
    position: TIPR_NOTIFICATION_POSITION,
  });

  UIkit.util.on(".uk-notification-message-success", "close", (e: any) => {
    // Check if the notification closure that triggered this callback
    // was a TIPR one, if so, clear the interval to stop the explosions.
    if (e.detail[0].message.includes(TIPR_WIN_ICON.name)) {
      clearInterval(exploding);
    }
  });
};

const getWinningMessageLocal = (winFraction: BigNumber, winAmount: BigNumber) =>
  "congratulations trooper! you've been awarded " +
  `${bnToDisplayString(
    winAmount,
    AMOUNT_DECIMALS,
    2,
  )} ${TRADE_LP_DEFAULT_CURRENCY_SYMBOL} - ` +
  `${(+formatAmount(winFraction) * 100).toFixed(0)}% ` +
  "of the available handle TIPR!";

const getWinningMessageRemote = (
  winFraction: BigNumber,
  winAmount: BigNumber,
  accountId: number,
) =>
  `the lucky trooper with account #${accountId} has just been awarded ` +
  `${bnToDisplayString(
    winAmount,
    AMOUNT_DECIMALS,
    2,
  )} ${TRADE_LP_DEFAULT_CURRENCY_SYMBOL} - ` +
  `${(+formatAmount(winFraction) * 100).toFixed(0)}% of the TIPR ` +
  "reward pool! keep trading, it could be you next time...";
