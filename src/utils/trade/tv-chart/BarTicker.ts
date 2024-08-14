import { Bar, ResolutionString } from "../../../types/charting_library";
import { CHART_PERIODS } from "../../../config/trade-chart";

/**
 * Keeps track of the current bar and the previous bar.
 * An instance only keeps track of the two last bars (for the same resolution).
 */
export class BarTicker {
  /// The penultimate bar in the chart, which doesn't change  i.e. is closed.
  private previousBarClosed: Bar;
  /// The last bar in the chart, which is changing i.e. not yet closed.
  private readonly currentBarOpen: Bar;
  private readonly period: number;

  public constructor(latestHistoricBar: Bar, resolution: ResolutionString) {
    this.period = CHART_PERIODS[resolution];
    if (!this.period) {
      throw new Error(`chat period not defined for ${resolution}`);
    }
    const latestHistoricBarTimeParsed: Bar = {
      ...latestHistoricBar,
      time: getTimeParsed(latestHistoricBar.time, this.period),
    };
    this.previousBarClosed = { ...latestHistoricBarTimeParsed };
    this.currentBarOpen = { ...latestHistoricBarTimeParsed };
  }

  public getCurrentBar(): Bar {
    return { ...this.currentBarOpen };
  }

  /// Progresses the ticker with a new price using the current system timestamp.
  public tick(price: number) {
    if (this.hasPeriodExpired) {
      this.handlePeriodExpired(price);
      return;
    }
    this.currentBarOpen.close = price;
    this.currentBarOpen.high = Math.max(this.currentBarOpen.high, price);
    this.currentBarOpen.low = Math.min(this.currentBarOpen.low, price);
    this.currentBarOpen.time = getTimeNowParsed(this.period);
  }

  private get hasPeriodExpired() {
    return (
      getTimeNowParsed(this.period) - this.previousBarClosed.time >= this.period
    );
  }

  /// This should be called when the period is over, and the current bar
  /// becomes the previous bar.
  private handlePeriodExpired(price: number) {
    this.previousBarClosed = this.currentBarOpen;
    this.currentBarOpen.open = this.previousBarClosed.close;
    this.currentBarOpen.close = price;
    this.currentBarOpen.high = price;
    this.currentBarOpen.low = price;
    this.currentBarOpen.time = getTimeNowParsed(this.period);
  }
}

/// Returns the current timestamp parsed according to TradingView's
/// requirements for the specific period, i.e. at the start of
/// the day of the given timestamp (@ UTC 00:00) if the period is over 1 day,
/// otherwise the normal timestamp accurate to the millisecond.
/// See more info here, relating to bars of resolution > 1D:
/// https://www.tradingview.com/charting-library-docs/latest/connecting_data/Datafeed-Issues/#time-violation
const getTimeParsed = (time: number, period: number) => {
  const date = new Date(time);
  if (period < CHART_PERIODS["1D"]) {
    return date.getTime();
  }
  date.setUTCHours(0, 0, 0, 0);
  return date.getTime();
};

const getTimeNowParsed = (period: number) => getTimeParsed(Date.now(), period);
