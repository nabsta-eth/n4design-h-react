import { BigNumber } from "ethers";
import { TranslationKey } from "../../../types/translation";

export const getErrorMessage = (
  t: Record<TranslationKey, string>,
  isDeposit: boolean,
  newLeverage: number,
  minLeverage: number,
  maxLeverage: number,
  collateralDelta: BigNumber,
  nextCollateralSize: BigNumber,
  liquidationFee: BigNumber,
  balance?: BigNumber,
): string | undefined => {
  // Leverage Errors
  if (newLeverage < minLeverage) {
    return t.leverageTooLow;
  } else if (newLeverage > maxLeverage) {
    return t.leverageTooHigh;
  }

  // Collateral Errors
  if (isDeposit && balance?.lt(collateralDelta)) {
    return t.insufficientBalance;
  }

  if (nextCollateralSize.lte(liquidationFee)) {
    // Not all translations have collateralWithdrawnBelowMinimnum
    return t.collateralWithdrawnBelowMinimnum || t.collateralWithdrawnToZero;
  }

  return undefined;
};
