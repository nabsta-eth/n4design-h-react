import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_TRADES_SORT,
  TRADES_DISPLAY_QUANTITY_INCREMENT,
} from "../config/trade";
import usePromise from "@handle-fi/react-components/dist/hooks/usePromise";
import { useTrade } from "../context/Trade";
import { TradeAction } from "handle-sdk/dist/components/trade";
import { sortTradeHistory } from "../utils/trade/sortTradeHistory";
import onChangeSort, { Sorting } from "../utils/sort";
import { useLanguageStore } from "../context/Translation";
import { usePositions } from "../context/Positions";
import { ethers } from "ethers";
import { useUserWalletStore } from "@handle-fi/react-components/dist/context/UserWallet";

export const useTrades = () => {
  const { connection } = useUserWalletStore();
  const { t } = useLanguageStore();
  const { account } = useTrade();
  const { positions } = usePositions();
  const [displayQuantity, setDisplayQuantity] = useState(
    TRADES_DISPLAY_QUANTITY_INCREMENT,
  );
  const [sortedTradeHistory, setSortedTradeHistory] = useState<TradeAction[]>(
    [],
  );
  const [positionsUpdateCount, setPositionsUpdateCount] = useState<number>(0);

  // When positions change after connection positionsUpdateCount is incremented and
  // trade history is cleared to be reloaded.
  // A 10s delay is added before refreshing for any change after
  // the initial load to allow the trade to be reflected in the graphql table.
  useEffect(() => {
    setPositionsUpdateCount(account ? positionsUpdateCount + 1 : 0);
    const timeout = positionsUpdateCount < 2 ? 0 : 10000;
    setTimeout(() => {
      setSortedTradeHistory([]);
      setDisplayQuantity(TRADES_DISPLAY_QUANTITY_INCREMENT);
    }, timeout);
  }, [
    positions
      ?.reduce((a, b) => a.add(b.size), ethers.constants.Zero)
      .toString(),
  ]);

  const [tradeHistoryChunk, , loading] = usePromise(
    async () =>
      account?.getTradeHistory({
        limit: TRADES_DISPLAY_QUANTITY_INCREMENT,
        skip: displayQuantity - TRADES_DISPLAY_QUANTITY_INCREMENT,
      }),
    [positionsUpdateCount, displayQuantity],
  );

  const isLoading =
    loading ||
    connection.user.isConnecting ||
    (!!account &&
      (sortedTradeHistory.length === 0 ||
        (sortedTradeHistory.length < displayQuantity &&
          tradeHistoryChunk?.length === TRADES_DISPLAY_QUANTITY_INCREMENT)));

  const showLoadMoreButton =
    sortedTradeHistory.length > 0 &&
    tradeHistoryChunk &&
    tradeHistoryChunk.length > 0 &&
    tradeHistoryChunk.length === TRADES_DISPLAY_QUANTITY_INCREMENT;

  const showTradePlaceholder = isLoading || sortedTradeHistory.length === 0;

  const tradeHistory = useMemo(
    () =>
      sortTradeHistory(
        [...sortedTradeHistory, ...(tradeHistoryChunk ?? [])],
        DEFAULT_TRADES_SORT,
        DEFAULT_TRADES_SORT.by,
      ),
    [JSON.stringify(tradeHistoryChunk)],
  );

  useEffect(() => {
    setSortedTradeHistory(
      sortTradeHistory(
        tradeHistory,
        DEFAULT_TRADES_SORT,
        DEFAULT_TRADES_SORT.by,
      ),
    );
  }, [tradeHistory]);
  const [sort, onSetSort] = useState<Sorting>(DEFAULT_TRADES_SORT);

  const onChangeTradesSort = (by: Sorting["by"]) => {
    onChangeSort(sort, by, onSetSort);
    setSortedTradeHistory(sortTradeHistory(tradeHistory ?? [], sort, by));
  };

  const sortTooltip = (by: string) => {
    let sortName = `${t.date}/${t.time}`;
    switch (by) {
      case "baseSymbol":
        sortName = t.market;
        break;
      case "isLong":
        sortName = t.side;
        break;
      case "pnl":
        sortName = t.profitAndLoss;
        break;
      case "price":
        sortName = t.price;
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
    sortTradeHistory,
    sortedTradeHistory,
    tradeHistory,
    isLoading,
    showLoadMoreButton,
    showTradePlaceholder,
    sort,
    onChangeTradesSort,
    sortTooltip,
  };
};
