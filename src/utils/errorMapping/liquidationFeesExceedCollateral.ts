import { RevertErrorMap } from ".";

export const liquidationFeesExceedCollateral: RevertErrorMap = {
  identifier: "liquidation fees exceed collateral",
  replacement: "not enough collateral to trade",
};
