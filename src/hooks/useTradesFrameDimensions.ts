import React from "react";
import { useUiStore } from "../context/UserInterface";
import { TRADES_THRESHOLD_FOR_STACKED_TABLE } from "../config/trade";
import tradesHeader from "../components/Trades/Trades.module.scss";
import trade from "../components/TradeElement/TradeElement.module.scss";

export const useTradesFrameDimensions = () => {
  const tradesRef = React.createRef<HTMLDivElement>();
  const { isTradePopout } = useUiStore();
  const [frameWidth, setWidth] = React.useState(
    TRADES_THRESHOLD_FOR_STACKED_TABLE,
  );

  const allowanceForTradesHeader = `- ${tradesHeader.tradesHeaderHeight}px`;
  const popoutAllowanceForTradesHeader =
    frameWidth >= TRADES_THRESHOLD_FOR_STACKED_TABLE
      ? allowanceForTradesHeader
      : "";
  const frameScrollHeight = isTradePopout
    ? `calc(100vh ${allowanceForTradesHeader})`
    : `calc(100% ${popoutAllowanceForTradesHeader})`;

  React.useEffect(() => {
    setWidth(tradesRef.current?.offsetWidth ?? 0);
  }, [tradesRef]);

  return {
    tradesRef,
    frameScrollHeight,
    frameWidth,
    tradesHeaderHeight: tradesHeader.tradesHeaderHeight,
    tradeHeight: trade.tradeHeight,
  };
};
