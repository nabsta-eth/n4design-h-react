import { NETWORK_NAMES, Network } from "handle-sdk";
import { DEFAULT_HLP_NETWORK } from "handle-sdk/dist/components/trade/platforms/hlp/config";

export const useNetworkOrDefault = (network: Network | undefined): Network =>
  network && NETWORK_NAMES.includes(network) ? network : DEFAULT_HLP_NETWORK;
