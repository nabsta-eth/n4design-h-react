import { BigNumber, ethers } from "ethers";

export const selectFundingRate = (
  isLong: boolean,
  indexTokenFundingRate: BigNumber | undefined,
  collateralTokenFundingRate: BigNumber | undefined,
) =>
  (isLong ? indexTokenFundingRate : collateralTokenFundingRate) ||
  ethers.constants.Zero;
