import { TradePair } from "handle-sdk/dist/components/trade";
import { Pair } from "handle-sdk/dist/types/trade";
import React from "react";
import { useTrade } from "../context/Trade";
import { useLanguageStore } from "../context/Translation";
import { getUkTooltip } from "../utils/general";
import { pairToDisplayString } from "../utils/trade/toDisplayPair";

export const useTradeModal = (tradePair: TradePair) => {
  const { setSelectedPair, selectedTradePairLp, selectedPair } = useTrade();
  const { t } = useLanguageStore();

  const isMarketClosed = !selectedTradePairLp.getPairAvailability({
    pair: selectedPair,
  }).isAvailable;

  const buyTooltip = getUkTooltip({
    title: `${t.buy} ${pairToDisplayString(tradePair.pair)}`,
    position: "bottom-left",
    hide: isMarketClosed,
  });

  const sellTooltip = getUkTooltip({
    title: `${t.sell} ${pairToDisplayString(tradePair.pair)}`,
    position: "bottom-left",
    hide: isMarketClosed,
  });

  const [showTrade, setShowTrade] = React.useState<boolean>(false);
  const [isLong, setIsLong] = React.useState<boolean>(false);
  const [pair, setPair] = React.useState<Pair>();

  const openTrade = (isLong: boolean) => {
    setPair(tradePair.pair);
    setSelectedPair(tradePair.pair);
    setIsLong(isLong);
    setShowTrade(true);
  };

  return {
    showTrade,
    setShowTrade,
    isLong,
    setIsLong,
    pair,
    setPair,
    buyTooltip,
    sellTooltip,
    openTrade,
  };
};
