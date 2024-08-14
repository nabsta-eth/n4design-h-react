import { TradeAction } from "handle-sdk/dist/components/trade";
import { Sorting } from "../../utils/sort";

export const sortTradeHistory = (
  tradeHistory: TradeAction[],
  sort: Sorting,
  by: Sorting["by"],
) => {
  if (sort.by === by) {
    return tradeHistory.reverse();
  }

  return tradeHistory.sort((a, b) => {
    if (by === "baseSymbol") {
      return b.pairId.pair.baseSymbol
        .toLowerCase()
        .localeCompare(a.pairId.pair.baseSymbol.toLowerCase());
    }
    if (by === "isLong") {
      if (a.size.gt(0) === b.size.gt(0)) return 0;

      if (a.size.gt(0)) return -1;
      return 1;
    }
    if (by === "timestamp") {
      return b.timestamp - a.timestamp;
    }
    if (by === "pnl") {
      return a.realisedEquity.gt(b.realisedEquity) ? -1 : 1;
    }
    if (by === "price") {
      return a.price.gt(b.price) ? -1 : 1;
    }
    return 0;
  });
};
