import { BigNumber, ethers } from "ethers";
import { TokenInfo } from "handle-sdk";
import React from "react";
import { expandDecimals } from "../utils/trade";
import { hlp } from "handle-sdk/dist/components/trade/platforms";
import { isSameAddress } from "handle-sdk/dist/utils/general";
import {
  AumToken,
  fetchAumTokens,
} from "handle-sdk/dist/components/trade/platforms/hlp/internals/getAum";
import usePromise from "@handle-fi/react-components/dist/hooks/usePromise";
import { useHlpTokens } from "./TokenManager";
import { getFxTokenPriceUsdH2so } from "../utils/oracle";

export type HlpVaultBalance = {
  token: TokenInfo;
  balance: BigNumber;
  balanceUsd: BigNumber;
};

export const catchPriceError = (fn: () => BigNumber): BigNumber => {
  try {
    return fn();
  } catch (e: any) {
    if (typeof e?.message === "string") {
      if (e.message === "price error" || e.message.includes("no price")) {
        return ethers.constants.Zero;
      }
    }
    throw e;
  }
};

const getHlpVaultBalancesFromAumTokens = (
  aumTokens: AumToken[],
  hlpTokens: TokenInfo[],
): HlpVaultBalance[] =>
  aumTokens.map(token => {
    const hlpToken = hlpTokens.find(t =>
      isSameAddress(t.address, token.address),
    );
    if (!hlpToken)
      throw new Error(
        `getHlpVaultBalancesFromAumTokens: no hLP Token for ${token.address}`,
      );
    const price = catchPriceError(() =>
      getFxTokenPriceUsdH2so(hlpToken.symbol),
    );
    return {
      token: hlpToken,
      balance: token.poolAmount,
      balanceUsd: token.poolAmount
        .mul(price)
        .div(expandDecimals(1, hlpToken.decimals)),
    };
  });

type HlpVaultBalanceContextValue = {
  balances: HlpVaultBalance[];
  tvl: BigNumber;
  isLoading: boolean;
};

const HlpVaultBalanceContext = React.createContext<
  HlpVaultBalanceContextValue | undefined
>(undefined);

export const HlpVaultBalanceProvider: React.FC = props => {
  const hlpTokens = useHlpTokens(hlp.config.DEFAULT_HLP_NETWORK);
  const [aumTokens, , isLoading] = usePromise(() => fetchAumTokens());
  const [balances, setBalances] = React.useState<HlpVaultBalance[]>([]);

  const updateBalances = React.useCallback(() => {
    if (!aumTokens) return;
    setBalances(getHlpVaultBalancesFromAumTokens(aumTokens.maximum, hlpTokens));
  }, [aumTokens, hlpTokens]);

  React.useEffect(() => {
    updateBalances();
  }, [updateBalances]);

  const tvl = React.useMemo(
    () =>
      balances.reduce((sum, { balance, token }) => {
        const price = catchPriceError(() =>
          getFxTokenPriceUsdH2so(token.symbol),
        );
        const value = balance.mul(price).div(expandDecimals(1, token.decimals));
        return sum.add(value);
      }, ethers.constants.Zero),
    [balances],
  );

  return (
    <HlpVaultBalanceContext.Provider
      value={{
        balances,
        tvl,
        isLoading,
      }}
    >
      {props.children}
    </HlpVaultBalanceContext.Provider>
  );
};

export const useHlpVaultBalance = () => {
  const context = React.useContext(HlpVaultBalanceContext);
  if (!context) {
    throw new Error(
      "useHlpVaultBalance must be used in a HlpVaultBalanceProvider",
    );
  }
  return context;
};
