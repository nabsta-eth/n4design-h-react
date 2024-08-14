import { BigNumber, constants } from "ethers";
import { SingleCollateralVault, TokenInfo, Vault } from "handle-sdk";
import { TokenWithBalanceAndPrice } from "../../types/tokenInfo";

// TODO: move to the SDK, or make a token extensions
export const isProtocolToken = (t: TokenInfo) =>
  t.extensions?.isHlpToken ||
  t.extensions?.isNativeToken ||
  t.extensions?.isLiquidityToken ||
  t.symbol === "FOREX";

export const getMultiVaultCollateral = (
  vaults: Vault[],
  priceGetter: (symbol: string) => BigNumber,
) => {
  return Object.values(
    vaults?.reduce((acc, curr) => {
      curr.collateral.forEach(t => {
        if (!acc[t.symbol]) {
          acc[t.symbol] = t;
          acc[t.symbol].balance = constants.Zero;
          acc[t.symbol].price = priceGetter(t.symbol);
        }
        acc[t.symbol].balance = acc[t.symbol].balance!.add(t.amount);
      });
      return acc;
    }, {} as Record<string, TokenWithBalanceAndPrice>),
  );
};

export const getSingleVaultCollateral = (
  vaults: SingleCollateralVault[],
  priceGetter: (symbol: string) => BigNumber,
) => {
  return Object.values(
    vaults?.reduce((acc, curr) => {
      if (!acc[curr.collateral.symbol]) {
        acc[curr.collateral.symbol] = { ...curr.fxToken };
        acc[curr.collateral.symbol].balance = constants.Zero;
        acc[curr.collateral.symbol].price = priceGetter(curr.collateral.symbol);
      }
      acc[curr.collateral.symbol].balance = acc[
        curr.collateral.symbol
      ].balance!.add(curr.collateral.amount);
      return acc;
    }, {} as Record<string, TokenWithBalanceAndPrice>),
  );
};
