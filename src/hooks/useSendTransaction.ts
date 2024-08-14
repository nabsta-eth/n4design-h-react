import { isAxiosError } from "axios";
import { BigNumber, ContractTransaction, ethers, providers } from "ethers";
import { getNetworkName } from "handle-sdk";
import * as React from "react";
import { useTermsAndConditions } from "../context/TermsAndCondtions";
import { sendAnalyticsError } from "../utils/analytics/error";
import { getMappedError } from "../utils/errorMapping";
import { getExplorerMetadata } from "../utils/general";
import {
  closeAllNotifications,
  showNotification,
  TransactionNotification,
} from "@handle-fi/react-components/dist/utils/notifications";
import useGasPriceToUse from "./useGasPriceToUse";
import { useIsMountedRef } from "./useIsMountedRef";
import { useUserWalletStore } from "@handle-fi/react-components/dist/context/UserWallet";
import { shouldShowApprovalAndPendingNotification } from "../utils/wallet";
import {
  REJECTED_ACTION_CODE,
  REJECTED_ACTION_CODE_TEXT,
} from "handle-sdk/dist/utils/web3";

export type SendTransaction = (
  toSend: (
    gasPrice: ethers.BigNumber | undefined,
  ) => Promise<ethers.ContractTransaction>,
  notificationMessages: Partial<TransactionNotification>,
  options?: SendTransactionOptions,
) => Promise<void>;

export type UseSendTransaction = {
  sendTransaction: SendTransaction;
  sendingTransaction: boolean;
};

export type SendTransactionOptions = {
  callback?: (tx: ContractTransaction) => Promise<void | void[]>;
  handleError?: (error: unknown) => void;
  shouldSkipWaitForConfirmation?: boolean;
  overwriteSuccessMessage?: (receipt: providers.TransactionReceipt) => string;
  waitBlockCount?: number;
};

type GetTransaction = (
  gasPrice: BigNumber | undefined,
) => Promise<ethers.ContractTransaction>;

const useSendTransaction = (): UseSendTransaction => {
  const { connection, walletChoice } = useUserWalletStore();
  const [pendingTransaction, setPendingTransaction] = React.useState(false);
  const [pendingCallback, setPendingCallback] = React.useState(false);
  const { ensureTermsSigned } = useTermsAndConditions();
  const gasPrice = useGasPriceToUse();
  const isMounted = useIsMountedRef();

  const getWaitingApprovalNotification = (
    awaitingApproval: string | undefined,
  ) => {
    if (!awaitingApproval) {
      return;
    }
    if (shouldShowApprovalAndPendingNotification(walletChoice)) {
      return showNotification({
        message: awaitingApproval,
        status: "info",
      });
    }
  };

  const sendTransaction = React.useCallback(
    async (
      toSend: GetTransaction,
      messages: Partial<TransactionNotification>,
      options?: SendTransactionOptions,
    ) => {
      if (!connection.user.isConnected) {
        console.error("no signer connected");
        return;
      }
      if (
        !connection.chain.isConnected ||
        !connection.chain.isSupportedNetwork
      ) {
        console.error("connected network is not supported");
        return;
      }
      const provider = connection.chain.provider;
      const connectedAccount = connection.user.address;
      setPendingTransaction(true);
      // Opens terms modal and waits for user to sign & agree to terms.
      await ensureTermsSigned();
      const network = getNetworkName(await provider.getNetwork());
      const waitingApprovalNotification = getWaitingApprovalNotification(
        messages.awaitingApproval,
      );

      let tx: ContractTransaction;
      try {
        tx = await toSend(gasPrice);
        waitingApprovalNotification?.close();
      } catch (err) {
        handleSendTransactionError(
          err,
          options?.handleError,
          network,
          connectedAccount,
          setPendingTransaction,
        );
        waitingApprovalNotification?.close();
        return;
      }

      const explorerMetadata = getExplorerMetadata(tx.hash, "tx", network);
      const link = `... view on <a class="hfi-notification-link" href="${explorerMetadata.url}" target="_blank">${explorerMetadata.name}</a>`;

      let receipt: providers.TransactionReceipt | undefined;
      if (
        !options?.shouldSkipWaitForConfirmation &&
        shouldShowApprovalAndPendingNotification(walletChoice)
      ) {
        const transactionPendingNotification = showNotification({
          message: `${messages.pending}${link}`,
          status: "pending",
        });
        receipt = await tx.wait(options?.waitBlockCount ?? 1);
        transactionPendingNotification.close();
      }

      if (receipt && options?.overwriteSuccessMessage) {
        showNotification({
          message: options.overwriteSuccessMessage(receipt),
          status: "success",
        });
      } else {
        showNotification({
          message: `${messages.success}${link}`,
          status: "success",
        });
      }

      setPendingTransaction(false);

      if (options?.callback) {
        setPendingCallback(true);
        await options?.callback(tx);
        if (isMounted.current) {
          setPendingCallback(false);
        }
      }
    },
    [connection.user, gasPrice],
  );

  return {
    sendTransaction,
    sendingTransaction: pendingTransaction || pendingCallback,
  };
};

export const handleSendTransactionError = (
  e: unknown,
  handleError?: (e: unknown) => void,
  network?: string,
  connectedAccount?: string,
  setPendingTransaction?: (pending: boolean) => void,
) => {
  if (handleError) {
    handleError(e);
  } else {
    console.error(e);
  }

  closeAllNotifications();
  const revertError = tryExtractJsonFromRevertMessage(e);
  const revertString = revertError?.data?.message || revertError?.message;

  let message = "error submitting transaction";
  if (isAxiosError(e)) {
    message =
      getMappedError(e) ||
      `${message}: error code ${e.status || "no response"}`;
  } else if (revertString) {
    message =
      getMappedError(revertString) ||
      `${message}: ${revertString.replace("execution reverted: ", "")}`;
  }

  const isCancelled = isTransactionCancelled(e);
  if (isCancelled) message = "transaction cancelled";

  const status = isCancelled ? "info" : "error";

  if (!isCancelled) {
    sendAnalyticsError(e, {
      network: network || "none",
      connectedAccount: connectedAccount || "none",
      source: "sending_transaction",
    });
  }

  showNotification({
    message,
    status,
  });

  if (setPendingTransaction) setPendingTransaction(false);
};

type SerializedRevert = {
  code?: number | string;
  message?: string;
  data?: {
    code?: number;
    message?: string;
  };
};

export const tryExtractJsonFromRevertMessage = (
  error: unknown,
): SerializedRevert | undefined => {
  try {
    const message = String(error);
    try {
      // If the input was already a parsed JSON, return the message.
      const parsed = JSON.parse(message);
      if (parsed?.data?.message) {
        return parsed.data.message;
      }
    } catch {}
    // The message being parsed has, at the time of implementation,
    // two JSON objects in it.
    // The start messagePrefix identifies the prefix of the second JSON
    // object, which is the one that contains the revert message information.
    const startMessagePrefix = "error=";
    const startMessage = `${startMessagePrefix}{"code"`;
    const endMessage = "}";
    const startIndex = message.indexOf(startMessage);
    const lastIndex = message.lastIndexOf(endMessage);
    return JSON.parse(
      message.substring(startIndex + startMessagePrefix.length, lastIndex + 1),
    );
  } catch {
    return undefined;
  }
};

export const isTransactionCancelled = (e: unknown) => {
  const actionError = tryExtractActionError(e);
  return (
    actionError &&
    (actionError.code === REJECTED_ACTION_CODE_TEXT ||
      actionError.code === REJECTED_ACTION_CODE)
  );
};

type SerializedActionError = {
  action: string;
  code: string | number;
  reason: string;
};

const tryExtractActionError = (
  error: unknown,
): SerializedActionError | undefined => {
  if (typeof error !== "object" || error === null) {
    return undefined;
  }
  if (
    "action" in error &&
    "code" in error &&
    "reason" in error &&
    typeof error.action === "string" &&
    (typeof error.code === "string" || typeof error.code === "number") &&
    typeof error.reason === "string"
  ) {
    return error as SerializedActionError;
  }
};

export default useSendTransaction;
