import { DepositOrWithdrawal } from "handle-sdk/dist/components/trade";
import { Sorting } from "../sort";

export const sortAccountTransactionHistory = (
  accountTransactionHistory: DepositOrWithdrawal[],
  sort: Sorting,
  by: Sorting["by"],
  isFirstLoad = false,
) => {
  if (sort.by === by && !isFirstLoad) {
    return accountTransactionHistory.reverse();
  }

  return accountTransactionHistory.sort((a, b) => {
    if (by === "timestamp") {
      return b.timestamp - a.timestamp;
    }
    if (by === "amount") {
      return a.amount.gt(b.amount) ? -1 : 1;
    }
    return 0;
  });
};
