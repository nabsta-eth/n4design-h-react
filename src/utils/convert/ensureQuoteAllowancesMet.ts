import { Signer } from "ethers";
import { ConvertUtils } from "handle-sdk";
import { SendTransaction } from "../../hooks/useSendTransaction";
import { ensureHasAllowance } from "../ensureHasAllowance";

export const ensureQuoteAllowancesMet = async (
  account: string,
  signer: Signer,
  allowanceTarget: ConvertUtils.AllowanceTarget,
  sendTransaction: SendTransaction,
) => {
  for (const target of allowanceTarget) {
    await ensureHasAllowance(
      account,
      target.token,
      target.target,
      signer,
      target.amount,
      sendTransaction,
    );
  }
};
