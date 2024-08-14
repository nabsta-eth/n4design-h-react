import { BigNumber } from "ethers";
import { formatPrice } from "./index";

export const getDeltaString = (
  delta: BigNumber,
  hasProfit: boolean,
  decimals = 2,
) => {
  let deltaStr = "";

  if (delta.gt(0)) deltaStr = hasProfit ? "+" : "-";

  deltaStr += `${formatPrice(delta, decimals)}`;
  return deltaStr;
};

export const getDeltaPercentageString = (
  delta: BigNumber,
  hasProfit: boolean,
  collateral: BigNumber,
) => {
  if (collateral.isZero()) return "0.00%";
  // 4 decimals is enough precision to display a percentage
  const deltaPercentage = delta.mul(10_000).div(collateral);
  let deltaStr = "";
  if (delta.gt(0)) deltaStr = hasProfit ? "+" : "-";

  deltaStr += `${(+deltaPercentage / 100).toFixed(2)}%`;

  return deltaStr;
};

/// The net position "collateral", aka "net value".
export const getPositionEquity = (
  initialCollateral: BigNumber,
  hasProfit: boolean,
  pnlBeforeFees: BigNumber,
  fundingFee: BigNumber,
  closeFees: BigNumber,
): BigNumber => {
  const pnlSigned = hasProfit ? pnlBeforeFees : pnlBeforeFees.mul(-1);
  return initialCollateral.add(pnlSigned).sub(fundingFee).sub(closeFees);
};
