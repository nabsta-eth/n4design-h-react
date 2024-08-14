import { RevertErrorMap } from "./index";

export const poolAmountExceeded: RevertErrorMap = {
  identifier: "Vault: poolAmount exceeded",
  replacement: "Insufficient hLP liquidity",
};
