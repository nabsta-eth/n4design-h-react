import TradingViewConfig from "../../../config/trade-chart";
import {
  fetchChartHistoricalBars,
  parseFullSymbol,
} from "./fetchChartHistoricalBars";
import {
  Bar,
  ErrorCallback,
  HistoryCallback,
  IDatafeedChartApi,
  IExternalDatafeed,
  LibrarySymbolInfo,
  OnReadyCallback,
  PeriodParams,
  ResolutionString,
  SearchSymbolsCallback,
  SubscribeBarsCallback,
} from "../../../types/charting_library";
import { TradeContextType } from "../../../context/Trade";
import { Pair } from "handle-sdk/dist/types/trade";
import { toParsedDatafeedPair } from "handle-sdk/dist/components/h2so/toParsedDatafeedPair";
import { getAllSymbols, resolveSymbol } from "./resolveSymbol";
import { SubscriptionItem } from "./SubscriptionItem";
import { TradeNetwork } from "handle-sdk/dist/types/network";

export type LatestHistoricalBarCache = Record<
  ResolutionString,
  Bar | undefined
>;

export class ChartDataFeed implements IDatafeedChartApi, IExternalDatafeed {
  private readonly id: string | undefined;
  private readonly tradeContext: TradeContextType;
  private readonly tradeNetwork: TradeNetwork;
  private readonly decimals: number;
  private subscriptions: Array<SubscriptionItem> = [];
  /// This stores the latest historical bar per resolution string,
  /// which is set after each getBars call.
  /// The latest bar is used for constructing new BarTickers inside
  /// a SubscriptionItem instance.
  private latestHistoricalBarCache: LatestHistoricalBarCache = {};

  public constructor(
    tradeContext: TradeContextType,
    tradeNetwork: TradeNetwork,
    id: string | undefined,
    decimals: number,
  ) {
    this.tradeContext = tradeContext;
    this.tradeNetwork = tradeNetwork;
    this.id = id;
    this.decimals = decimals;
  }

  public onReady(callback: OnReadyCallback) {
    // This is required to be called asynchronously.
    setTimeout(() => callback(TradingViewConfig));
  }

  public searchSymbols(
    userInput: string,
    exchange: string,
    _symbolType: string,
    onResultReadyCallback: SearchSymbolsCallback,
  ) {
    const symbols = getAllSymbols(this.tradeContext);
    const newSymbols = symbols.filter(symbol => {
      const isExchangeValid = exchange === "" || symbol.exchange === exchange;
      const isFullSymbolContainsInput =
        symbol.full_name.toLowerCase().indexOf(userInput.toLowerCase()) !== -1;
      return isExchangeValid && isFullSymbolContainsInput;
    });
    onResultReadyCallback(newSymbols);
  }

  public async resolveSymbol(
    symbolName: string,
    onSymbolResolvedCallback: (symbolInfo: LibrarySymbolInfo) => void,
    onResolveErrorCallback: (error: string) => void,
  ) {
    await resolveSymbol(
      symbolName,
      onSymbolResolvedCallback,
      onResolveErrorCallback,
      this.tradeContext,
      this.decimals,
    );
  }

  public async getBars(
    symbolInfo: LibrarySymbolInfo,
    resolution: ResolutionString,
    periodParams: PeriodParams,
    onHistoryCallback: HistoryCallback,
    onErrorCallback: ErrorCallback,
  ) {
    try {
      const pair = pairFromSymbolInfo(symbolInfo);
      await fetchChartHistoricalBars(
        pair,
        this.tradeContext.instruments,
        resolution,
        periodParams,
        onHistoryCallback,
        this.latestHistoricalBarCache,
      );
    } catch (e: any) {
      console.error("Could not get bars:", e);
      onErrorCallback(e?.message);
    }
  }

  public subscribeBars(
    symbolInfo: LibrarySymbolInfo,
    resolution: ResolutionString,
    callback: SubscribeBarsCallback,
    chartSubscriptionId: string,
    _onResetCacheNeededCallback: () => void,
  ) {
    const subscription = this.subscriptions.find(
      s => s.chartSubscriptionId == chartSubscriptionId,
    );
    if (subscription) {
      subscription.addListener(callback);
      return;
    }
    const latestHistoricalBar = this.latestHistoricalBarCache[resolution];
    if (!latestHistoricalBar) {
      throw new Error(`no historical bar for resolution ${resolution}`);
    }
    this.subscriptions.push(
      new SubscriptionItem(
        symbolInfo,
        resolution,
        callback,
        chartSubscriptionId,
        latestHistoricalBar,
      ),
    );
  }

  public unsubscribeBars(chartSubscriptionId: string) {
    const subscriptionIndex = this.subscriptions.findIndex(
      s => s.chartSubscriptionId == chartSubscriptionId,
    );
    if (!subscriptionIndex) {
      return;
    }
    this.subscriptions[subscriptionIndex].end();
    this.subscriptions.splice(subscriptionIndex, 1);
  }
}

const constructDatafeed = (
  trade: TradeContextType,
  tradeNetwork: TradeNetwork,
  id: string | undefined,
  decimals: number,
): IDatafeedChartApi & IExternalDatafeed =>
  new ChartDataFeed(trade, tradeNetwork, id, decimals);

export const pairFromSymbolInfo = (symbolInfo: LibrarySymbolInfo): Pair => {
  const parsedSymbol = parseFullSymbol(symbolInfo.full_name);
  if (!parsedSymbol) {
    console.error("Cannot parse symbol", symbolInfo);
    throw new Error(`Cannot parse symbol ${symbolInfo}`);
  }
  return toParsedDatafeedPair({
    baseSymbol: parsedSymbol.fromSymbol,
    quoteSymbol: parsedSymbol.toSymbol,
  });
};

export default constructDatafeed;
