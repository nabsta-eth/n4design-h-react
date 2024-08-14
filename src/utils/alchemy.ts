import { Network } from "handle-sdk";
import { Network as AlchemyNetwork } from "alchemy-sdk";

export const getAlchemyNetwork = (network: Network): AlchemyNetwork => {
  const networkMap = {
    polygon: AlchemyNetwork.MATIC_MAINNET,
    ethereum: AlchemyNetwork.ETH_MAINNET,
    arbitrum: AlchemyNetwork.ARB_MAINNET,
    "arbitrum-sepolia": AlchemyNetwork.ARB_SEPOLIA,
  };
  if (!networkMap[network]) throw new Error("Invalid network");
  return networkMap[network];
};
