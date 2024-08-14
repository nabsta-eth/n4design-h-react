import {
  Bar,
  LibrarySymbolInfo,
  ResolutionString,
  SubscribeBarsCallback,
} from "../../../types/charting_library";
import { BigNumber, ethers } from "ethers";
import { PRICE_DECIMALS } from "handle-sdk/dist/components/trade";
import { Pair } from "handle-sdk/dist/types/trade";
import { BarTicker } from "./BarTicker";
import { pairFromSymbolInfo } from "./index";
import { priceFeedRef } from "../../../context/PriceFeed";

export class SubscriptionItem {
  public readonly chartSubscriptionId: string;
  public readonly h2soSubscriptionId: number;
  public readonly resolution: ResolutionString;
  /// An array of bar chart listeners, that when called
  /// update the respective chart with the input bar.
  private listeners: Array<SubscribeBarsCallback>;
  private readonly barTicker: BarTicker;

  public constructor(
    symbolInfo: LibrarySymbolInfo,
    resolution: ResolutionString,
    listener: SubscribeBarsCallback,
    chartSubscriptionId: string,
    latestHistoricalBar: Bar,
  ) {
    this.chartSubscriptionId = chartSubscriptionId;
    const pair = pairFromSymbolInfo(symbolInfo);
    this.listeners = [listener];
    this.resolution = resolution;
    this.barTicker = new BarTicker(latestHistoricalBar, resolution);
    this.h2soSubscriptionId = priceFeedRef.value.subscribe(
      [pair],
      this.onTick.bind(this),
    );
  }

  private onTick(_pair: Pair, priceBn: BigNumber) {
    const price = +ethers.utils.formatUnits(priceBn, PRICE_DECIMALS);
    this.barTicker.tick(price);
    const bar = this.barTicker.getCurrentBar();
    this.listeners.forEach(callback => callback(bar));
  }

  public addListener(callback: SubscribeBarsCallback) {
    this.listeners.push(callback);
  }

  public end() {
    console.log(
      "ended subscription " +
        this.resolution +
        " ID: " +
        this.chartSubscriptionId,
    );
    priceFeedRef.value.unsubscribe(this.h2soSubscriptionId);
    this.listeners = [];
  }
}
