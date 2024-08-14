import { TokenWithBalance } from "../types/tokenInfo";
import { TokenSymbolToBalance } from "./erc20";

export const balancesToSymbolMap = (
  balances: TokenWithBalance[],
): TokenSymbolToBalance =>
  balances.reduce(
    (acc, curr) => ({
      ...acc,
      [curr.symbol]: curr.balance,
    }),
    {} as TokenSymbolToBalance,
  );
