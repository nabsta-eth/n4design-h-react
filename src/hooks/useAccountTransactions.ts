import { DepositOrWithdrawal } from "handle-sdk/dist/components/trade";
import {
  DEFAULT_TRANSACTIONS_SORT,
  TRANSACTIONS_DISPLAY_QUANTITY_INCREMENT,
} from "../config/trade";
import { useEffect, useMemo, useState } from "react";
import usePromise from "@handle-fi/react-components/dist/hooks/usePromise";
import { useTrade } from "../context/Trade";
import { useConnectedAccount } from "@handle-fi/react-components/dist/context/UserWallet";
import { sortAccountTransactionHistory } from "../utils/trade/sortAccountTransactionHistory";
import onChangeSort, { Sorting } from "../utils/sort";
import { useLanguageStore } from "../context/Translation";

export const useAccountTransactions = () => {
  const { account } = useTrade();
  const { t } = useLanguageStore();
  const connectedAccount = useConnectedAccount();
  const [displayQuantity, setDisplayQuantity] = useState(
    TRANSACTIONS_DISPLAY_QUANTITY_INCREMENT,
  );
  const [sort, onSetSort] = useState<Sorting>({
    by: "timestamp",
    direction: "asc",
  });

  const [accountTransactionsChunk] = usePromise(
    async () =>
      account?.getDepositWithdrawHistory({
        limit: TRANSACTIONS_DISPLAY_QUANTITY_INCREMENT,
        skip: displayQuantity - TRANSACTIONS_DISPLAY_QUANTITY_INCREMENT,
      }),
    [account, displayQuantity],
  );
  const [sortedAccountTransactions, setSortedAccountTransactions] = useState<
    DepositOrWithdrawal[]
  >([]);

  const isLoading =
    (account && !accountTransactionsChunk) ||
    (sortedAccountTransactions.length < displayQuantity &&
      accountTransactionsChunk?.length ===
        TRANSACTIONS_DISPLAY_QUANTITY_INCREMENT);

  const showLoadMoreButton =
    accountTransactionsChunk &&
    accountTransactionsChunk.length > 0 &&
    accountTransactionsChunk.length === TRANSACTIONS_DISPLAY_QUANTITY_INCREMENT;

  const showTransactionsPlaceholder =
    !connectedAccount || sortedAccountTransactions?.length === 0;

  const accountTransactionHistory = useMemo(
    () =>
      sortAccountTransactionHistory(
        [...sortedAccountTransactions, ...(accountTransactionsChunk ?? [])],
        DEFAULT_TRANSACTIONS_SORT,
        DEFAULT_TRANSACTIONS_SORT.by,
      ),
    [accountTransactionsChunk],
  );

  useEffect(
    () =>
      setSortedAccountTransactions(
        sortAccountTransactionHistory(
          accountTransactionHistory,
          DEFAULT_TRANSACTIONS_SORT,
          DEFAULT_TRANSACTIONS_SORT.by,
          true,
        ),
      ),
    [accountTransactionHistory],
  );

  const onChangeAccountTransactionsSort = (by: Sorting["by"]) => {
    onChangeSort(sort, by, onSetSort);
    setSortedAccountTransactions(
      sortAccountTransactionHistory(accountTransactionHistory ?? [], sort, by),
    );
  };

  const sortTooltip = (by: string) => {
    let sortName = `${t.date}/${t.time}`;
    switch (by) {
      case "transactionType":
        sortName = by;
        break;
    }

    const sortTooltipPrefix = "title: ";
    const sortTooltipSuffix = "; pos: bottom;";
    if (by === sort.by)
      return `${sortTooltipPrefix}${t.reverse}${sortTooltipSuffix}`;
    return `${sortTooltipPrefix}${t.sortBy} ${sortName}${sortTooltipSuffix}`;
  };

  return {
    displayQuantity,
    setDisplayQuantity,
    sortedAccountTransactions,
    isLoading,
    showLoadMoreButton,
    showTransactionsPlaceholder,
    sort,
    onChangeAccountTransactionsSort,
    sortTooltip,
  };
};
