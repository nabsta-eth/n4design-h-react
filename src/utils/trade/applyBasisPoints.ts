import { BigNumber } from "ethers";
import { BASIS_POINTS_DIVISOR } from "handle-sdk/dist/constants";

export const applyBasisPoints = (value: BigNumber, basisPoints: number) => {
  return value.mul(basisPoints).div(BASIS_POINTS_DIVISOR);
};
