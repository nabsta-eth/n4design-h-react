import { ResolutionString } from "../types/charting_library";

export const CHART_PERIODS: { [key: string]: number } = {
  "1": 60,
  "5": 60 * 5,
  "15": 60 * 15,
  "30": 60 * 30,
  "60": 60 * 60,
  "120": 60 * 60 * 2,
  "240": 60 * 60 * 4,
  D: 60 * 60 * 24,
  "1D": 60 * 60 * 24,
};

export const DEFAULT_CHART_PERIOD = "15" as ResolutionString;

export const HANDLE_EXCHANGE = {
  // `exchange` argument for the `searchSymbols` method, if a user selects this exchange
  value: "handlefi",
  // filter name
  name: "handlefi",
  // full exchange name displayed in the filter popup
  desc: "handle.fi",
};

const TradingViewConfig = {
  supported_resolutions: [
    "1",
    "5",
    "15",
    "30",
    "60",
    "120",
    "240",
    "D",
  ] as ResolutionString[],
  exchanges: [HANDLE_EXCHANGE],
  symbols_types: [
    {
      name: "crypto",
      value: "crypto",
    },
  ],
};

export default TradingViewConfig;
