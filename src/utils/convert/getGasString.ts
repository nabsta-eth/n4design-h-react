import { BigNumber, BigNumberish, ethers } from "ethers";
import { bnToDisplayString } from "../format";

export const getGasString = (
  gas: BigNumberish,
  gasCost: BigNumberish,
  nativePrice: number,
  nativeSymbol: string,
  nativeDecimals: number,
) => {
  const gasInWei = BigNumber.from(gas).mul(gasCost);
  if (gasInWei.eq(0)) return "";
  const gasInUSD = gasInWei.mul(
    ethers.utils.parseUnits(nativePrice.toFixed(2), 2),
  );
  return `${bnToDisplayString(
    gasInWei,
    nativeDecimals,
    4,
  )} ${nativeSymbol} (${bnToDisplayString(gasInUSD, 20, 2)} USD)`;
};
