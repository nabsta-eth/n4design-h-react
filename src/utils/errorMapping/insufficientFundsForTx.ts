import { RevertErrorMap } from "./index";

export const insufficientFundsForTx: RevertErrorMap = {
  identifier: "insufficient funds for intrinsic transaction cost",
  replacement: "insufficient funds for transaction",
};
