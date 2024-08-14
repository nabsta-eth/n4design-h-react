import { PositionActionType } from "../../components/Positions/Positions";
import { TranslationKey } from "../../types/translation";
import { PositionInputType } from "../../hooks/trade/useTradeFormInput";
import { TRADE_LP_DEFAULT_CURRENCY_SYMBOL } from "../trade";
import { BigNumber, constants } from "ethers";
import {
  bnToDisplayString,
  getPositionFundingFeeDisplay,
} from "../../utils/format";
import {
  AMOUNT_DECIMALS,
  OpenInterest,
} from "handle-sdk/dist/components/trade";
import { PairState } from "handle-sdk/dist/components/trade/pairState";
import { AMOUNT_UNIT } from "handle-sdk/dist/components/trade/reader";

export const tooltips = (
  t: Record<TranslationKey, string>,
  entryPrice: string,
  liquidationPrice: string,
  borrowFees: string,
  marginFee: string,
  swapFee?: {
    amount: string;
    fromSymbol: string;
    toSymbol: string;
  },
) => {
  return {
    long: getToolTips(
      true,
      entryPrice,
      liquidationPrice,
      borrowFees,
      marginFee,
      t,
      swapFee,
    ),
    short: getToolTips(
      false,
      entryPrice,
      liquidationPrice,
      borrowFees,
      marginFee,
      t,
      swapFee,
    ),
  };
};

const getToolTips = (
  isLong: boolean,
  entryPrice: string,
  liquidationPrice: string,
  borrowFees: string,
  marginFee: string,
  t: Record<TranslationKey, string>,
  swapFee?: {
    amount: string;
    fromSymbol: string;
    toSymbol: string;
  },
) => ({
  entryPrice: [`the position will be opened at ${entryPrice}`],
  availableLiquidity: [t.liquidityTooltip],
  liquidationPrice: isLong
    ? [
        t.tradeFormLiquidationPriceDisplayLongTooltip.replace(
          "#price#",
          liquidationPrice,
        ),
      ]
    : [
        t.tradeFormLiquidationPriceDisplayShortTooltip.replace(
          "#price#",
          liquidationPrice,
        ),
      ],
  borrowFees: [`a fee of ${borrowFees} will be taken.`],
  borrowRate: [t.tradeFormBorrowRateDisplayTooltip],
  openFees: [
    `trade fee: ${marginFee}${
      swapFee
        ? `<br/>swap ${swapFee.fromSymbol} to ${swapFee.toSymbol}: ${swapFee.amount}`
        : ""
    }`,
  ],
});

export const getPositionButtonTooltipText = (
  t: Record<TranslationKey, string>,
  action: PositionActionType,
  marketClosed: boolean,
) => {
  if (!t || !action) {
    return undefined;
  }
  if (marketClosed) {
    return t.marketClosed;
  }
  if (action === "editTrigger") {
    return t.addTriggerOrder;
  }
  return t[`${action === "close" ? "reduceOrClose" : action}Position`];
};

export const getSwitchInputTypeTooltipText = (
  inputType: PositionInputType,
): string =>
  inputType === "Lot"
    ? `switch to ${TRADE_LP_DEFAULT_CURRENCY_SYMBOL}`
    : `switch to lots`;

export const ANNUALISED_RATE_DISPLAY_DECIMALS = 1;

export const getRateTooltip = (
  rateType: "funding" | "borrow",
  rateDirection: "long" | "short",
  rateAmount: BigNumber,
) =>
  `title: ${rateDirection} ${rateType} rate. user ${
    rateAmount.gt(0) || rateType === "borrow" ? "pays" : "receives"
  } ${bnToDisplayString(
    rateAmount.abs().mul(365 * 24 * 100),
    AMOUNT_DECIMALS,
    ANNUALISED_RATE_DISPLAY_DECIMALS,
  )}% pa.; pos: bottom;`;

export const getFundingBreakdownTooltip = (
  accruedFunding?: BigNumber,
  accruedBorrow?: BigNumber,
  pairState?: PairState,
  indexPrice?: BigNumber,
) => {
  const lpRateNotional = pairState?.getLpFundingRate(
    indexPrice ?? constants.Zero,
  );
  const openInterest: OpenInterest =
    pairState?.openInterest ?? OpenInterest.zero();
  const openInterestImbalance = openInterest.long.sub(openInterest.short).abs();
  const lpHourlyRate = lpRateNotional
    ?.mul(openInterestImbalance)
    .div(AMOUNT_UNIT);
  return `title: funding: ${
    accruedFunding ? getPositionFundingFeeDisplay(accruedFunding) : "?"
  }<br/>borrow: ${
    accruedBorrow ? getPositionFundingFeeDisplay(accruedBorrow) : "?"
  }<br/>lp rate: ${
    lpHourlyRate ? getPositionFundingFeeDisplay(lpHourlyRate) : "?"
  }/h; pos: bottom;`;
};
