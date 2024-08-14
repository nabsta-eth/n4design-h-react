import { BigNumber, ethers } from "ethers";
import { Network, TokenInfo } from "handle-sdk";
import { TokenSymbolToBalance } from "../erc20";
import { hlp } from "handle-sdk/dist/components/trade/platforms";
import { HlpConfig } from "handle-sdk/dist/components/trade/platforms/hlp/config";
import { BASIS_POINTS_DIVISOR } from "handle-sdk/dist/constants";
import { HandleTokenManagerInstance } from "handle-sdk/dist/components/token-manager/HandleTokenManager";
import { isSameAddress } from "handle-sdk/dist/utils/general";
import { HlpToken } from "handle-sdk/dist/components/trade/platforms/hlp/internals/tokens";
import { HlpVaultBalance } from "../../context/HlpVaultBalance";
import { getFxTokenPriceUsdH2so } from "../oracle";
import { PRICE_DECIMALS } from "handle-sdk/dist/components/trade";
import { PRICE_UNIT } from "../trade";
import { AMOUNT_DECIMALS } from "handle-sdk/dist/components/trade/reader";

type HlpDetails = {
  symbol: string;
  price: BigNumber;
  value: number;
  maxValue: number;
  targetWeightPercent: number;
  maxUsdHlpAmount: BigNumber;
  balance: number;
  walletValue: number;
  fee: number;
}[];

const PRECISION = 8;

export const getHlpDetails = (
  network: Network,
  balances: TokenSymbolToBalance,
  isBuy: boolean,
  usdHlpDelta: BigNumber,
  vaultBalances: HlpVaultBalance[],
  tokenUsdHlpAmounts: Record<string, BigNumber>,
  tokenTargetUsdHlpAmounts: Record<string, BigNumber>,
  config: HlpConfig,
  tokens: HlpToken[],
  nativeToken: TokenInfo | undefined,
): HlpDetails => {
  const hlpDetails: HlpDetails = [];
  const totalWeight = tokens.reduce(
    (sum, { tokenWeight }) => sum + tokenWeight,
    0,
  );
  for (const token of tokens) {
    const usdHlpAmount = tokenUsdHlpAmounts[token.address];
    if (usdHlpAmount.eq(0)) continue;
    const targetUsdHlpAmount = tokenTargetUsdHlpAmounts[token.address];
    const parseFactor = token.tokenDecimals - PRECISION;
    const tokenInfo = HandleTokenManagerInstance.getTokenByAddress(
      token.address,
      network,
    );
    const value = vaultBalances.find(({ token: t }) =>
      isSameAddress(t.address, token.address),
    )?.balanceUsd;
    const maxUsdHlpAmount = token.maxUsdHlpAmount;
    const maxUsdHlpAmountNumber =
      +maxUsdHlpAmount.div(ethers.utils.parseUnits("1", token.tokenDecimals)) /
      1e8;
    const balance = balances[tokenInfo.symbol] || ethers.constants.Zero;
    const balanceNumber =
      +balance.div(ethers.utils.parseUnits("1", parseFactor)) / 10 ** PRECISION;
    const price =
      getFxTokenPriceUsdH2so(tokenInfo.symbol) ?? ethers.constants.Zero;
    const walletValue =
      +balance.mul(price).div(PRICE_UNIT) / 10 ** AMOUNT_DECIMALS;
    const fee =
      token && config
        ? hlp.internals.getHlpFeeBasisPoints({
            token: token.address,
            config,
            isBuy,
            targetUsdHlpAmount: targetUsdHlpAmount,
            totalTokenWeights: BigNumber.from(totalWeight),
            usdHlpDelta,
            usdHlpSupply: usdHlpAmount,
          })
        : ethers.constants.Zero;
    const feePercent = (+fee / BASIS_POINTS_DIVISOR) * 100;
    const targetWeightPercent = token.tokenWeight / BASIS_POINTS_DIVISOR;

    hlpDetails.push({
      maxUsdHlpAmount: maxUsdHlpAmount,
      symbol: tokenInfo.symbol,
      price,
      value: +ethers.utils.formatUnits(value || 0, PRICE_DECIMALS),
      maxValue: maxUsdHlpAmountNumber,
      targetWeightPercent: targetWeightPercent,
      balance: balanceNumber,
      walletValue,
      fee: feePercent,
    });

    if (tokenInfo.extensions?.isWrappedNative && nativeToken) {
      const nativeBalance =
        balances[nativeToken.symbol] ?? ethers.constants.Zero;
      const nativeBalanceNumber =
        +nativeBalance.div(ethers.utils.parseUnits("1", parseFactor)) /
        10 ** PRECISION;
      const nativeWalletValue =
        +nativeBalance.mul(price).div(PRICE_UNIT) / 10 ** AMOUNT_DECIMALS;
      const nativeValue = vaultBalances.find(({ token: t }) =>
        isSameAddress(t.address, nativeToken.address),
      )?.balanceUsd;

      hlpDetails.push({
        maxUsdHlpAmount: maxUsdHlpAmount,
        symbol: nativeToken.symbol,
        price,
        value: +ethers.utils.formatUnits(nativeValue || 0, PRICE_DECIMALS),
        maxValue: maxUsdHlpAmountNumber,
        targetWeightPercent: targetWeightPercent,
        balance: nativeBalanceNumber,
        walletValue: nativeWalletValue,
        fee: feePercent,
      });
    }
  }

  return hlpDetails;
};
