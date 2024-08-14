import { Network, TokenInfo } from "handle-sdk";
import React from "react";
import { useNativeToken, useTokenManager } from "../context/TokenManager";
import { getTokenBalances } from "../utils/erc20";
import { getProvider } from "@handle-fi/react-components/dist/utils/web3";
import { TokenWithBalance } from "../types/tokenInfo";
import { TOKEN_BALANCE_EXCLUSION_THRESHOLD } from "../config/constants";
import { ethers } from "ethers";

export const useWalletBalances = (
  network: Network,
  account: string | undefined,
): [boolean, TokenWithBalance[], () => Promise<void>] => {
  const TokenManager = useTokenManager();
  const [isLoading, setIsLoading] = React.useState(true);
  const [tokenBalances, setTokenBalances] = React.useState<TokenWithBalance[]>(
    [],
  );
  const nativeToken = useNativeToken(network);

  const fetchTokenBalances = React.useCallback(async () => {
    if (!account) {
      setTokenBalances([]);
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const tokenBalances = await getTokenBalances(account, network);

      const find = (t: TokenInfo): boolean => !t.extensions?.isViewOnly;
      const balanceArray: Array<TokenWithBalance | undefined> = Object.entries(
        tokenBalances,
      ).map(([address, balance]) => {
        const tokenInfo = TokenManager.tryGetTokenByAddress(
          address,
          network,
          find,
        );
        if (!tokenInfo) {
          console.warn(
            `Could not find token with address ${address} on ${network}`,
          );
          return undefined;
        }
        // Filter out "dust" balances.
        if (
          !balance ||
          +ethers.utils.formatUnits(balance, tokenInfo.decimals) <
            TOKEN_BALANCE_EXCLUSION_THRESHOLD
        )
          return undefined;
        return {
          ...tokenInfo,
          balance,
        };
      });

      if (nativeToken) {
        balanceArray.push({
          ...nativeToken,
          balance: await getProvider(network).getBalance(account),
        });
      }

      setTokenBalances(balanceArray.filter(t => !!t) as TokenWithBalance[]);
    } catch (error) {
      console.error("Error fetching balances:", error);
    } finally {
      setIsLoading(false);
    }
  }, [TokenManager, account, nativeToken, network]);

  React.useEffect(() => {
    fetchTokenBalances();
  }, [fetchTokenBalances]);

  return [isLoading, tokenBalances, fetchTokenBalances];
};
