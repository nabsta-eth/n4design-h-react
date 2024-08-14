import React from "react";
import { useUiStore } from "../context/UserInterface";
import { ACCOUNT_TRANSACTIONS_THRESHOLD_FOR_STACKED_TABLE } from "../config/trade";
import accountTransactionsHeader from "../components/AccountTransactions/AccountTransactions.module.scss";
import accountTransaction from "../components/AccountTransactionElement/AccountTransactionElement.module.scss";

export const useAccountTransactionsFrameDimensions = () => {
  const transactionsRef = React.createRef<HTMLDivElement>();
  const { isTradePopout } = useUiStore();
  const [frameWidth, setWidth] = React.useState(
    ACCOUNT_TRANSACTIONS_THRESHOLD_FOR_STACKED_TABLE,
  );

  const allowanceForAccountTransactionsHeader = `- ${accountTransactionsHeader.accountTransactionsHeaderHeight}px`;
  const frameWidthAdjustment =
    frameWidth >= ACCOUNT_TRANSACTIONS_THRESHOLD_FOR_STACKED_TABLE
      ? allowanceForAccountTransactionsHeader
      : "";
  const frameScrollHeight = isTradePopout
    ? `calc(100vh ${allowanceForAccountTransactionsHeader})`
    : `calc(100% ${frameWidthAdjustment})`;

  React.useEffect(() => {
    setWidth(transactionsRef.current?.offsetWidth ?? 0);
  }, [transactionsRef]);

  return {
    transactionsRef,
    frameScrollHeight,
    frameWidth,
    accountTransactionsHeaderHeight:
      accountTransactionsHeader.accountTransactionsHeaderHeight,
    accountTransactionHeight: accountTransaction.accountTransactionHeight,
  };
};
