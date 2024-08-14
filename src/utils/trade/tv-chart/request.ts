import axios from "axios";
import { Bar } from "../../../types/charting_library";
import { BarFetcher } from "./fetchChartHistoricalBars";
import { Pair } from "handle-sdk/dist/types/trade";
import { pairToString } from "handle-sdk/dist/utils/general";
import config from "handle-sdk/dist/config";
import { getInstrument } from "../../../utils/instruments";
import { Instrument } from "handle-sdk/dist/components/trade";

export const CHARTING_SERVICE_BASE_URL = `${config.api.baseUrl}/charts`;

const TV_INTERVAL_TO_REQUEST_INTERVAL: Record<string, string> = {
  "1": "1min",
  "5": "5min",
  "15": "15min",
  "30": "30min",
  "60": "1h",
  "120": "2h",
  "240": "4h",
  D: "1day",
  "1D": "1day",
};

export const fetchTradingViewHistoricalBarCharts: BarFetcher = async (
  symbol,
  tvInterval,
  startUnixTimestamp,
  endUnixTimestamp,
) => {
  const requestInterval = TV_INTERVAL_TO_REQUEST_INTERVAL[tvInterval];
  if (!requestInterval) {
    throw new Error(`Could not get request interval: ${tvInterval}`);
  }
  const bars = await fetchHistoricalChartBars(
    symbol,
    requestInterval,
    startUnixTimestamp,
    endUnixTimestamp,
  );
  if (!bars) {
    throw new Error(`no historical bars (${symbol}}, ${tvInterval})`);
  }
  // 1 minute bars have lots of gaps; they look better with gaps filled.
  if (bars && requestInterval === "1min") {
    fillBarGaps(bars);
  }
  return bars;
};

/// Returns only the base symbol if the pair is an instrument.
export const parseChartSymbolFromPair = async (
  pair: Pair,
  instruments: Instrument[],
): Promise<string> => {
  const instrument = getInstrument(instruments, pair);
  if (!instrument) {
    throw new Error(`Instrument not found for pair ${pairToString(pair)}`);
  }
  return instrument.getChartSymbol();
};

export const fetchHistoricalChartBars = async (
  symbol: string,
  interval: string,
  startUnixTimestamp?: number,
  endUnixTimestamp?: number,
): Promise<Bar[]> => {
  const startDateString = startUnixTimestamp ? `/${startUnixTimestamp}` : "";
  const endDateString =
    startUnixTimestamp && endUnixTimestamp ? `/${endUnixTimestamp}` : "";
  const response = await axios.get<Bar[]>(
    `${CHARTING_SERVICE_BASE_URL}/${symbol.replace("/", "_")}/` +
      interval +
      startDateString +
      endDateString,
  );
  return response.data;
};

const fillBarGaps = (bars: Bar[]) => {
  bars.forEach((bar, i) => {
    if (bars[i + 1]) {
      bar.close = bars[i + 1].open;
    }
  });
};
