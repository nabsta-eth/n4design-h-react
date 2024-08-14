import { Pair } from "handle-sdk/dist/types/trade";
import { pairToDisplayString } from "../toDisplayPair";

export const CHART_SYMBOL_PREFIX = "handlefi:";
export const symbolForChart = (pair: Pair) =>
  `${CHART_SYMBOL_PREFIX}${pairToDisplayString(pair)}`;
