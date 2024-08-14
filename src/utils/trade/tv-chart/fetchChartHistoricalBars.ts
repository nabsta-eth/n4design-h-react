import { Pair } from "handle-sdk/dist/types/trade";
import { Bar, ResolutionString } from "../../../types/charting_library";
import { BarData } from "../../../types/trade-chart";
import {
  fetchTradingViewHistoricalBarCharts,
  parseChartSymbolFromPair,
} from "./request";
import { LatestHistoricalBarCache } from "./index";
import { pairToString } from "handle-sdk/dist/utils/general";
import { Instrument } from "handle-sdk/dist/components/trade";

const NO_DATA_COUNTERS: NoDataCounter = {};
// Threshold of empty responses for the chart to stop making requests
// to the server further back in time.
const NO_DATA_THRESHOLD = 2;

export const parseFullSymbol = (fullSymbol: string) => {
  const match = fullSymbol.match(/^(\w+):(\w+)\/(\w+)$/);
  if (!match) {
    return null;
  }

  return { exchange: match[1], fromSymbol: match[2], toSymbol: match[3] };
};

type BadBar = {
  pair: string;
  lowerLimit: number;
  ignoreTimes?: number[];
};

// Some bar data have outliers that are incorrect.
// 12data is a disgusting slimy piece of shit.
const badBars: BadBar[] = [
  {
    pair: "ETH/USD",
    lowerLimit: 10,
    // These are all referencing the same bad bar, but at different resolutions.
    ignoreTimes: [
      // 1 min.
      1705286520000,
      // 15 min.
      1705285800000,
      // 5 min.
      1705286400000,
      // 1 hr.
      1705284000000,
    ],
  },
  {
    pair: "BTC/USD",
    lowerLimit: 5000,
  },
];

// Sometimes bars are returned as zero on inital load.
const isValidBar = (bar: Bar, pair: Pair): boolean => {
  for (const badBar of badBars) {
    if (pairToString(pair) !== badBar.pair) {
      continue;
    }
    const isBelowLimit =
      Math.min(bar.open, bar.close, bar.low, bar.high) < badBar.lowerLimit;
    if (isBelowLimit) {
      return false;
    }
    if (badBar.ignoreTimes?.includes(bar.time)) {
      return false;
    }
  }
  return Math.min(bar.open, bar.close, bar.low, bar.high) > 0;
};

export type BarFetcher = (
  pair: string,
  interval: string,
  from: number,
  to: number,
) => Promise<Bar[] | undefined>;

/// Fetches historical bars and calls the chart callback with the result.
/// Also populates the `LatestHistoricalBarCache` on first data request.
export const fetchChartHistoricalBars = async (
  pair: Pair,
  instruments: Instrument[],
  resolution: ResolutionString,
  periodParams: {
    from: number;
    to: number;
    firstDataRequest: boolean;
  },
  onHistoryCallback: (data: BarData[], options?: Object) => void,
  latestHistoricalBarCache: LatestHistoricalBarCache,
) => {
  const { from, to } = periodParams;
  const chartSymbol = await parseChartSymbolFromPair(pair, instruments);
  const historicalData = await fetchTradingViewHistoricalBarCharts(
    chartSymbol,
    resolution,
    from,
    to,
  );
  if (!historicalData || historicalData.length === 0) {
    const noDataCount = getNoDataCounter(pair, resolution) + 1;
    setNoDataCounter(pair, resolution, noDataCount);
    const noData = noDataCount >= NO_DATA_THRESHOLD;
    // See the link below for information on `noData`.
    // https://www.tradingview.com/charting-library-docs/latest/api/interfaces/Charting_Library.HistoryMetadata/#nodata
    onHistoryCallback([], { noData });
    return;
  }
  if (getNoDataCounter(pair, resolution) > 0) {
    setNoDataCounter(pair, resolution, 0);
  }
  const bars = historicalData.filter(
    b => b.time >= from * 1000 && b.time <= to * 1000 && isValidBar(b, pair),
  );
  updateLatestHistoricalBarCache(
    latestHistoricalBarCache,
    bars.at(-1),
    resolution,
  );
  onHistoryCallback(bars, { noData: false });
};

const shouldUpdateLatestHistoricalBarCache = (
  cachedBar: Bar | undefined,
  latestBar: Bar | undefined,
): boolean => {
  const isFirstCacheUpdate = !!(!cachedBar && latestBar);
  const isNewCacheUpdate = !!(
    cachedBar &&
    latestBar &&
    latestBar.time > cachedBar.time
  );
  return isFirstCacheUpdate || isNewCacheUpdate;
};

const updateLatestHistoricalBarCache = (
  cache: LatestHistoricalBarCache,
  latestBar: Bar | undefined,
  resolution: ResolutionString,
) => {
  if (!shouldUpdateLatestHistoricalBarCache(cache[resolution], latestBar)) {
    return;
  }
  cache[resolution] = latestBar;
};

type ChartIdentifier = string;

type NoDataCounter = Record<ChartIdentifier, number | undefined>;

const getChartIdentifier = (pair: Pair, resolution: ResolutionString): string =>
  `${pairToString(pair)}:${resolution}`;

const getNoDataCounter = (pair: Pair, resolution: ResolutionString): number => {
  const value = NO_DATA_COUNTERS[getChartIdentifier(pair, resolution)];
  if (value) {
    return value;
  }
  NO_DATA_COUNTERS[getChartIdentifier(pair, resolution)] = 0;
  return 0;
};

const setNoDataCounter = (
  pair: Pair,
  resolution: ResolutionString,
  value: number,
) => {
  if (value < 0 || isNaN(value)) {
    throw new Error("invalid value");
  }
  NO_DATA_COUNTERS[getChartIdentifier(pair, resolution)] = value;
};
