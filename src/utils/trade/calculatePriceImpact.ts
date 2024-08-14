import { BigNumber, constants } from "ethers";
import { PRICE_UNIT } from "handle-sdk/dist/components/trade/reader";

export const calculatePriceImpactPercentage = (
  entryPrice: BigNumber,
  marketPrice: BigNumber,
) => {
  return marketPrice.isZero()
    ? constants.Zero
    : entryPrice.mul(PRICE_UNIT).div(marketPrice).sub(PRICE_UNIT).mul(100);
};
