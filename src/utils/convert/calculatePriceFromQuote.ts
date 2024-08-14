import { BigNumber, ethers } from "ethers";
import { Quote } from "handle-sdk";
import { applyBasisPoints } from "../trade/applyBasisPoints";
import { BASIS_POINTS_DIVISOR } from "handle-sdk/dist/constants";

export const calculatePriceFromQuote = (
  quote: Quote,
  fromTokenDecimals: number,
  toTokenDecimals: number,
  reverse?: boolean,
): BigNumber => {
  const sellAmountWithFees = quote.feeChargedBeforeConvert
    ? applyBasisPoints(
        BigNumber.from(quote.sellAmount),
        BASIS_POINTS_DIVISOR - quote.feeBasisPoints,
      )
    : BigNumber.from(quote.sellAmount);

  const fromAmount = reverse
    ? BigNumber.from(quote.buyAmount)
    : sellAmountWithFees;
  const toAmount = reverse
    ? sellAmountWithFees
    : BigNumber.from(quote.buyAmount);
  const fromDecimals = reverse ? toTokenDecimals : fromTokenDecimals;
  const toDecimals = reverse ? fromTokenDecimals : toTokenDecimals;

  // standardise both tokens to 18 decimal places
  const fromTokenDecimalOffset = 18 - fromDecimals;
  const fromTokenDecimalExponent = ethers.utils.parseUnits(
    "1",
    fromTokenDecimalOffset,
  );

  const sellTokenFactor =
    fromTokenDecimalOffset >= 0
      ? fromAmount.mul(fromTokenDecimalExponent)
      : fromAmount.div(fromTokenDecimalExponent);

  const toTokenDecimalOffset = 18 - toDecimals;
  const toTokenDecimalExponent = ethers.utils.parseUnits(
    "1",
    toTokenDecimalOffset,
  );
  const buyTokenFactor =
    toTokenDecimalOffset >= 0
      ? toAmount.mul(toTokenDecimalExponent)
      : toAmount.div(toTokenDecimalExponent);

  // returns the ratio with 18 decimals
  if (sellTokenFactor.isZero()) return ethers.constants.Zero;
  return ethers.constants.WeiPerEther.mul(buyTokenFactor).div(sellTokenFactor);
};
