import { BigNumber } from "ethers";
import { Alchemy, TokenBalance } from "alchemy-sdk";
import { ALCHEMY_API_KEY } from "../config";
import { getAlchemyNetwork } from "./alchemy";
import { Network } from "handle-sdk";
import { isValidBigNumber } from "./general";

export type FetchTokenBalancePayload = {
  symbol: string;
  address: string;
};

export type TokenAddressToBalance = Record<string, BigNumber | undefined>;
export type TokenSymbolToBalance = Record<string, BigNumber | undefined>;

export const getTokenBalances = async (
  address: string,
  network: Network,
  tokens?: string[],
): Promise<TokenAddressToBalance> => {
  const settings = {
    apiKey: ALCHEMY_API_KEY,
    network: getAlchemyNetwork(network),
  };

  const alchemy = new Alchemy(settings);
  const MAX_ALCHEMY_ADDRESSES = 1500;
  const tokenBalances: TokenBalance[] = [];
  if (tokens) {
    for (let i = 0; i < tokens?.length; i += MAX_ALCHEMY_ADDRESSES) {
      const chunk = tokens.slice(i, i + MAX_ALCHEMY_ADDRESSES);
      const response = await alchemy.core.getTokenBalances(address, chunk);
      tokenBalances.push(...response.tokenBalances);
    }
  } else {
    // if tokens array is undefined, no need to chunk it
    const response = await alchemy.core.getTokenBalances(address);
    tokenBalances.push(...response.tokenBalances);
  }
  const balances = tokenBalances.map(balance => {
    const value =
      balance.tokenBalance && isValidBigNumber(balance.tokenBalance)
        ? balance.tokenBalance
        : 0;

    return {
      address: balance.contractAddress,
      balance: BigNumber.from(value),
    };
  });

  return balances.reduce((acc, curr) => {
    acc[curr.address.toLowerCase()] = curr.balance;
    return acc;
  }, {} as Record<string, BigNumber>);
};
