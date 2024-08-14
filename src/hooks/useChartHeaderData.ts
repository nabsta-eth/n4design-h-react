import { constants, ethers } from "ethers";
import { formatPrice } from "../utils/trade";
import { isMarketOneToOne } from "../utils/trade/isMarketOneToOne";
import { formatNumber } from "../utils/format";
import { useTradePrices } from "../context/TradePrices";
import { trade } from "handle-sdk";
import { PRICE_DECIMALS } from "handle-sdk/dist/components/trade";
import { TradePairOrViewOnlyInstrument } from "../types/trade";
import { useInstrumentOrThrow } from "./trade/useInstrumentOrThrow";
import { pairToString } from "handle-sdk/dist/utils/general";
import { useTrade } from "../context/Trade";

type ChartHeaderData = {
  currentPriceDisplay: string | undefined;
  marketPriceDisplay: string | undefined;
  isLoaded: boolean;
  change: number | undefined;
  trueHigh: number | undefined;
  trueLow: number | undefined;
  precision: number;
  bidPriceDisplay: string | undefined;
  askPriceDisplay: string | undefined;
};

export const useChartHeaderData = (
  tradePair: TradePairOrViewOnlyInstrument,
): ChartHeaderData => {
  const pair = tradePair.pair;
  const { getPrice } = useTradePrices();
  const marketPrices = getPrice(pair);
  const livePrice = marketPrices?.index ?? null;
  const marketPrice = marketPrices?.marketPrice ?? livePrice;
  const marketOneToOne = isMarketOneToOne(pair);
  const instrument = useInstrumentOrThrow(pairToString(pair));
  const { prices24h } = useTrade();
  const data = prices24h[instrument.getChartSymbol()];

  const precision = instrument.getDisplayDecimals(
    marketPrices?.marketPrice ?? constants.Zero,
    instrument.shouldUseExtendedDecimals,
  );
  const livePriceDisplay = formatPrice(
    livePrice ?? ethers.constants.Zero,
    precision,
    undefined,
    trade.PRICE_DECIMALS,
  );
  const liveMarketPriceDisplay = formatPrice(
    marketPrice ?? ethers.constants.Zero,
    precision,
    undefined,
    trade.PRICE_DECIMALS,
  );
  const liveBidPriceDisplay = formatPrice(
    marketPrices?.bestBid ?? ethers.constants.Zero,
    precision,
    undefined,
    trade.PRICE_DECIMALS,
  );
  const liveAskPriceDisplay = formatPrice(
    marketPrices?.bestAsk ?? ethers.constants.Zero,
    precision,
    undefined,
    trade.PRICE_DECIMALS,
  );

  // if the market is closed (e.g. weekends for fx tokens)
  // the index price (BN) is zero,
  // so use the previous session close price (number) instead
  const shouldUseLivePrice = livePrice !== null;
  const closePrice = data?.close
    ? Math.round(Number(data?.close) * 10 ** precision) / 10 ** precision
    : null;

  if (marketOneToOne) {
    return {
      currentPriceDisplay: livePriceDisplay,
      marketPriceDisplay: liveMarketPriceDisplay,
      isLoaded: true,
      change: 0,
      trueHigh: 1,
      trueLow: 1,
      precision: precision,
      bidPriceDisplay: liveBidPriceDisplay,
      askPriceDisplay: liveAskPriceDisplay,
    };
  }

  const latestPrice = livePrice
    ? +ethers.utils.formatUnits(livePrice, PRICE_DECIMALS)
    : closePrice ?? 0;
  const latestPriceDisplay = shouldUseLivePrice
    ? livePriceDisplay
    : formatNumber(closePrice ?? 0, precision);
  const latestMarketPriceDisplay = shouldUseLivePrice
    ? liveMarketPriceDisplay
    : latestPriceDisplay;
  const change = data && latestPrice / data.open - 1;
  const trueLow = data && Math.min(latestPrice, data.low);
  const trueHigh = data && Math.max(latestPrice, data.high);
  const didLoadLatestPriceAvailable =
    (shouldUseLivePrice && livePrice !== null) ||
    (!shouldUseLivePrice && closePrice !== null);
  const isLoaded = !!(
    change &&
    trueLow &&
    trueHigh &&
    didLoadLatestPriceAvailable &&
    Math.abs(latestPrice) > 0
  );

  const currentPriceDisplay = didLoadLatestPriceAvailable
    ? latestPriceDisplay
    : undefined;
  const marketPriceDisplay = didLoadLatestPriceAvailable
    ? latestMarketPriceDisplay
    : undefined;
  const bidPriceDisplay = didLoadLatestPriceAvailable
    ? liveBidPriceDisplay
    : undefined;
  const askPriceDisplay = didLoadLatestPriceAvailable
    ? liveAskPriceDisplay
    : undefined;

  return {
    currentPriceDisplay,
    marketPriceDisplay,
    isLoaded,
    change,
    trueHigh,
    trueLow,
    precision,
    bidPriceDisplay,
    askPriceDisplay,
  };
};
