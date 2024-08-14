import { ethers } from "ethers";
import React from "react";
import { transformDecimals } from "../utils/general";
import { Sorting } from "../utils/sort";
import { TokenWithBalanceAndPrice } from "../types/tokenInfo";

export type UseWalletTokensSortedReturnValue = {
  sortedTokens: TokenWithBalanceAndPrice[];
  sort: Sorting;
  setSort: (newSort: Sorting) => void;
};

export const useWalletTokensSorted = (
  tokens: TokenWithBalanceAndPrice[],
): UseWalletTokensSortedReturnValue => {
  const one = ethers.utils.parseEther("1");
  const tokensWithValue = tokens.map(token => ({
    ...token,
    value:
      token?.balance && token?.price && token.balance.mul(token.price).div(one),
  }));

  const [sort, setSort] = React.useState<Sorting>({
    by: "value",
    direction: "asc",
  });

  const tokensWithValueSorted = React.useMemo(
    () =>
      [...tokensWithValue].sort((a: any, b: any) => {
        if (typeof a[sort.by] !== typeof b[sort.by]) return 0;

        const desc = sort.direction === "desc";
        const isBigNumber = ethers.BigNumber.isBigNumber(a[sort.by]);

        const aValue =
          typeof a[sort.by] === "string"
            ? a[sort.by].toLowerCase()
            : a[sort.by];

        const bValue =
          typeof b[sort.by] === "string"
            ? b[sort.by].toLowerCase()
            : b[sort.by];

        const isGreaterThan = isBigNumber
          ? transformDecimals(aValue, a.decimals, 18).gt(
              transformDecimals(bValue, b.decimals, 18),
            )
          : aValue > bValue;

        const isLessThan = isBigNumber
          ? transformDecimals(aValue, a.decimals, 18).lt(
              transformDecimals(bValue, b.decimals, 18),
            )
          : aValue < bValue;

        if ((desc && isGreaterThan) || (!desc && isLessThan)) return 1;
        else if ((desc && isLessThan) || (!desc && isGreaterThan)) return -1;
        else return 0;
      }),
    [sort.by, sort.direction, tokensWithValue],
  );

  return {
    sortedTokens: tokensWithValueSorted,
    sort,
    setSort,
  };
};
