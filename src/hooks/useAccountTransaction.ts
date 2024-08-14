import { useConnectedNetwork } from "@handle-fi/react-components/dist/context/UserWallet";
import { getExplorerMetadata } from "../utils/general";
import { useMediaQueries } from "./useMediaQueries";
import {
  AMOUNT_DECIMALS,
  DepositOrWithdrawal,
  PeriodicFee,
} from "handle-sdk/dist/components/trade";
import { bnToDisplayString } from "../utils/format";
import { USD_DISPLAY_DECIMALS } from "../utils/trade";
import { useLanguageStore } from "../context/Translation";

export const useAccountTransaction = (
  transaction: DepositOrWithdrawal | PeriodicFee,
) => {
  const network = useConnectedNetwork();
  const { t } = useLanguageStore();
  const maxTablet = useMediaQueries().maxTablet;

  const isWithdrawal = transaction.amount.lt(0);
  const transactionType =
    (transaction as PeriodicFee).type ||
    (isWithdrawal ? "withdrawal" : t.deposit);
  const { timestamp } = transaction;
  const amountToDisplay = bnToDisplayString(
    transaction.amount.abs(),
    AMOUNT_DECIMALS,
    USD_DISPLAY_DECIMALS,
  );

  const isFeeTransaction = !(transaction as DepositOrWithdrawal).txHash;
  const transactionTxHash = isFeeTransaction
    ? undefined
    : (transaction as DepositOrWithdrawal).txHash;
  const explorerMetadata = transactionTxHash
    ? network && getExplorerMetadata(transactionTxHash, "tx", network)
    : undefined;

  return {
    network,
    timestamp,
    maxTablet,
    amountToDisplay,
    isWithdrawal,
    transactionType,
    explorerMetadata,
  };
};
