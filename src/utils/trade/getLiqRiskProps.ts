import { BigNumber, ethers } from "ethers";
import {
  AMOUNT_DECIMALS,
  AMOUNT_UNIT,
} from "handle-sdk/dist/components/trade/reader";
import { bnToDisplayString } from "../format";
import { clamp } from "@handle-fi/react-components/dist/utils/general";
import {
  MINIMUM_LIQ_RISK_FOR_DANGER,
  MINIMUM_LIQ_RISK_FOR_WARNING,
} from "../../config/trade";
import { digits } from "../general";

export const getLiqRiskValue = (
  accountValue: BigNumber,
  maintenanceEquity: BigNumber,
): number => {
  const fundsUntilLiquidation = accountValue.gt(maintenanceEquity)
    ? accountValue.sub(maintenanceEquity)
    : ethers.constants.Zero;
  const liqHealthValue = !accountValue?.abs().isZero()
    ? fundsUntilLiquidation.mul(AMOUNT_UNIT).div(accountValue)
    : AMOUNT_UNIT;
  const liqRiskBarValue = +bnToDisplayString(
    AMOUNT_UNIT.sub(liqHealthValue),
    AMOUNT_DECIMALS,
    4,
  );
  return clamp(liqRiskBarValue, 0, 1);
};

type LiqRiskBarValues = {
  liqRiskBarValue: number;
  liqRiskTooltip: string;
  liqRiskBarTooltip: string;
  liqRiskClass?: string;
};
export const getLiqRiskProps = (
  accountValue: BigNumber | undefined,
  maintenanceEquity: BigNumber | undefined,
): LiqRiskBarValues => {
  const liqRiskBarValue = getLiqRiskBarValue(accountValue, maintenanceEquity);
  const liqRiskTooltip = getLiqRiskTooltip(liqRiskBarValue);
  const liqRiskBarTooltip = getLiqRiskBarTooltip(liqRiskBarValue);
  const liqRiskClass = getLiqRiskClass(liqRiskBarValue);
  return { liqRiskBarValue, liqRiskTooltip, liqRiskClass, liqRiskBarTooltip };
};

const getLiqRiskBarValue = (
  nextAccountValue: BigNumber | undefined,
  nextMaintenanceEquity: BigNumber | undefined,
): number => {
  return nextAccountValue && nextMaintenanceEquity
    ? getLiqRiskValue(nextAccountValue, nextMaintenanceEquity)
    : 0;
};

export const getLiqRiskClass = (value: number) => {
  if (value <= MINIMUM_LIQ_RISK_FOR_WARNING) {
    return;
  }
  if (value <= MINIMUM_LIQ_RISK_FOR_DANGER) {
    return "hfi-warning";
  }
  return "hfi-error";
};

const getLiqRiskTooltip = (liqRiskBarValue: number) =>
  `title: funds required to maintain open positions\
    as a percentage of account value.\
    reaching 100% will trigger liquidation of positions.;\
    pos: bottom-left; cls: uk-active ${getLiqRiskClass(liqRiskBarValue)};`;

const getLiqRiskBarTooltip = (liqRiskBarValue: number) =>
  `title: liquidation risk ${(liqRiskBarValue * 100).toLocaleString(
    undefined,
    digits(2),
  )}%;\
    pos: bottom-left; cls: uk-active ${getLiqRiskClass(liqRiskBarValue)};`;
