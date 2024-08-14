import TradingViewConfig, {
  HANDLE_EXCHANGE,
} from "../../../config/trade-chart";
import {
  LibrarySymbolInfo,
  SearchSymbolResultItem,
  SeriesFormat,
  Timezone,
} from "../../../types/charting_library";
import { Pair } from "handle-sdk/dist/types/trade";
import { pairToDisplayString } from "../toDisplayPair";
import { TradeContextType } from "../../../context/Trade";
import { forexTradingHours } from "../viewOnlyTradingHours";
import { getInstrument } from "../../../utils/instruments";

// Generate a symbol ID from a pair of the coins
const generateSymbol = (exchange: string, pair: Pair) => {
  const short = pairToDisplayString(pair);
  return {
    short,
    full: `${exchange}:${short}`,
  };
};

export const getAllSymbols = (
  trade: TradeContextType,
): SearchSymbolResultItem[] => {
  return [...trade.pairs, ...trade.viewOnlyInstruments].map(tradePair => {
    const symbol = generateSymbol(HANDLE_EXCHANGE.value, tradePair.pair);
    const instrument = getInstrument(trade.instruments, tradePair.pair);
    return {
      symbol: instrument.getDescription(),
      full_name: symbol.full,
      description: instrument.getChartSymbol(),
      exchange: HANDLE_EXCHANGE.value,
      ticker: symbol.full,
      type: instrument.marketType,
    };
  });
};

export const getSymbol = (symbolName: string, trade: TradeContextType) => {
  const symbols = getAllSymbols(trade);
  return symbols.find(
    ({ full_name }) => full_name.toLowerCase() === symbolName.toLowerCase(),
  );
};

export const getChartForexTradingHours = () => {
  const hoursMapped = forexTradingHours().map(
    (hours, ix) => `${hours.open}-${hours.close}:${ix + 1}`,
  );
  return hoursMapped.join("|");
};

export const resolveSymbol = async (
  symbolName: string,
  // symbol info is a tradingview symbol object, which is not type supported
  onSymbolResolvedCallback: (symbolInfo: LibrarySymbolInfo) => void,
  onResolveErrorCallback: (error: string) => void,
  trade: TradeContextType,
  decimals: number,
) => {
  const symbols = getAllSymbols(trade);
  const symbolItem = symbols.find(
    ({ full_name }) => full_name.toLowerCase() === symbolName.toLowerCase(),
  );
  if (!symbolItem) {
    console.log(`[resolveSymbol] Symbol ${symbolName} not found in`, symbols);
    onResolveErrorCallback("cannot resolve symbol");
    return;
  }

  const symbolInfo: LibrarySymbolInfo = {
    ticker: symbolItem.full_name,
    full_name: symbolItem.full_name,
    name: symbolItem.symbol,
    description: symbolItem.description,
    type: symbolItem.type,
    // TODO: This is using the view-only method for forex.
    // Refactor once SDK returns hours for tradeable pairs.
    session: symbolItem.type === "forex" ? getChartForexTradingHours() : "24x7",
    timezone: "Etc/UTC" as Timezone,
    exchange: symbolItem.exchange,
    minmov: 1,
    pricescale: 10 ** decimals,
    has_intraday: true,
    has_seconds: true,
    has_weekly_and_monthly: false,
    supported_resolutions: TradingViewConfig.supported_resolutions,
    volume_precision: 2,
    // This is for typescript issues with the charting library
    data_status: "streaming" as const,
    listed_exchange: HANDLE_EXCHANGE.value,
    format: "price" as SeriesFormat,
  };

  onSymbolResolvedCallback(symbolInfo);
};
