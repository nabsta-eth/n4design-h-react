import { useMemo } from "react";
import { HANDLE_TRADE_GRAPH_API_URL } from "../utils/gql";
import { useGraph } from "./useGraph";

const query = `{
  hlpStats(
    first: 1,
    orderBy: timestamp,
    orderDirection: desc,
  ) {
    id
    hlpSupply
    timestamp
  }
}`;

type HlpSupplyData = {
  hlpStats: {
    id: string;
    timestamp: number;
    hlpSupply: string;
  }[];
};

type HlpSupplyValue = {
  timestamp: number;
  totalSupply: number;
} | null;

export const useHlpSupply = (): [HlpSupplyValue, boolean, any] => {
  const [graphData, loading, error] = useGraph<HlpSupplyData>(
    query,
    HANDLE_TRADE_GRAPH_API_URL,
  );

  const data = useMemo(() => {
    if (loading || !graphData) {
      return null;
    }

    return {
      timestamp: graphData.hlpStats[0].timestamp,
      totalSupply: parseInt(graphData.hlpStats[0].hlpSupply) / 1e18,
    };
  }, [graphData, loading]);

  return [data, loading, error];
};
