import { BigNumber } from "ethers";
import { getProvider } from "@handle-fi/react-components/dist/utils/web3";
import { Erc20__factory } from "../../../contracts";
import { Network } from "handle-sdk";

export type BalanceFetcher = (
  address: string,
  network: Network,
  tokenAddress?: string,
) => Promise<BigNumber>;

const fetchEthBalance: BalanceFetcher = (address, network) =>
  getProvider(network).getBalance(address);

const fetchErc20Balance: BalanceFetcher = (address, network, tokenAddress) => {
  const provider = getProvider(network);
  if (!tokenAddress) throw new Error("fetchErc20Balance: no token address");
  return Erc20__factory.connect(tokenAddress, provider).balanceOf(address);
};

export const fetchBalance = async (
  address: string,
  network: Network,
  tokenAddress?: string,
): Promise<BigNumber> =>
  tokenAddress
    ? fetchErc20Balance(address, network, tokenAddress)
    : fetchEthBalance(address, network);
