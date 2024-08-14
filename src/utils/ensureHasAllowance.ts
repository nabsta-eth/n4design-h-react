import { BigNumber, ContractTransaction, Signer } from "ethers";
import { TokenInfo } from "handle-sdk";
import { getAllowanceNotifications } from "../config/notifications";
import { SendTransaction } from "../hooks/useSendTransaction";
import { ensureHasAllowance as ensureHasAllowanceSdk } from "handle-sdk/dist/utils/allowance";

/**
 * Checks if the account has enough allowance for the given ERC20 token.
 * If not, it will request the allowance.
 * This will try to use permits if the contract supports ERC2612.
 * @param account The account to ensure allowance for.
 * @param tokenInfo The ERC20 to approve.
 * @param allowanceTarget The spender (EOA or contract) address for the allowance.
 * @param signer The signer of the account.
 * @param minimumAllowance The minimum amount that must be approved.
 * @param sendTransaction Reference to the SendTransaction hook.
 * @param currentAllowance If provided, it will skip the allowance check and use this value instead.
  @returns whether the account already had enough allowance, i.e. nil action.
 */
export const ensureHasAllowance = async (
  account: string,
  tokenInfo: TokenInfo,
  allowanceTarget: string,
  signer: Signer,
  minimumAllowance: BigNumber,
  sendTransaction: SendTransaction,
  currentAllowance?: BigNumber,
): Promise<boolean> => {
  const result = await ensureHasAllowanceSdk(
    account,
    tokenInfo,
    allowanceTarget,
    signer,
    minimumAllowance,
    currentAllowance,
  );
  const approvalTxToExecute = result.getApprovalTxToExecute;
  if (approvalTxToExecute) {
    await requestApproval(approvalTxToExecute, sendTransaction, tokenInfo);
  }
  return result.didAlreadyHaveEnough;
};

const requestApproval = (
  approvalTxToExecute: () => Promise<ContractTransaction>,
  sendTransaction: SendTransaction,
  tokenInfo: TokenInfo,
) =>
  new Promise((resolve, reject) =>
    sendTransaction(approvalTxToExecute, getAllowanceNotifications(tokenInfo), {
      waitBlockCount: 2,
      callback: async tx => {
        resolve(tx);
      },
      handleError: error => {
        reject(error);
      },
    }),
  );
