import {
  TradeLeaderboard as TradeLeaderboardComponent,
  TradeLeaderboardProps,
} from "../components/TradeLeaderboard/TradeLeaderboard";
import { queryStringToObject } from "../utils/url";
import { useMemo } from "react";
import { TradeNetwork, tradeNetworks } from "handle-sdk/dist/types/network";

type QueryString = {
  // Trade account IDs split by commas.
  accounts: string;
  network: string;
};

const DEFAULT_NETWORK: TradeNetwork = "arbitrum";

export const TradeLeaderboard = () => {
  const props = useMemo(() => getPropsFromQueryString(), []);
  if (!props) {
    return <div>invalid querystring parameters</div>;
  }
  return <TradeLeaderboardComponent {...props} />;
};

const getPropsFromQueryString = (): TradeLeaderboardProps | null => {
  const qs = getParsedQueryString();
  if (!qs) {
    return null;
  }
  const accountIds = qs.accounts.split(",").map(v => +v);
  if (accountIds.some(isNaN)) {
    return null;
  }
  const network = tradeNetworks.includes(qs.network as TradeNetwork)
    ? (qs.network as TradeNetwork)
    : DEFAULT_NETWORK;
  return {
    accountIds,
    network,
  };
};

const getParsedQueryString = (): QueryString | null => {
  const qs = queryStringToObject<QueryString>();
  // The network parameter is optional.
  const isComplete = !!qs.accounts;
  return isComplete ? (qs as QueryString) : null;
};
