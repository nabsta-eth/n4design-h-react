import { Network } from "handle-sdk";
import { PriceChartTile } from "../local-storage";
import { DEFAULT_TOKENS } from "../../navigation/Convert";
import { useNetworkOrDefault } from "../../hooks/useNetworkOrDefault";

const defaultPriceChart = (network: Network): PriceChartTile => {
  return {
    fromToken: DEFAULT_TOKENS[useNetworkOrDefault(network)].from,
    toToken: DEFAULT_TOKENS[useNetworkOrDefault(network)].to,
  };
};

export default defaultPriceChart;
