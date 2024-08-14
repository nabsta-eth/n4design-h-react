import { pairToString } from "handle-sdk/dist/utils/general";
import { TranslationKey } from "../../../types/translation";
import { Pair } from "handle-sdk/dist/types/trade";

export const getPairUnavailabilityMessage = (
  t: Record<TranslationKey, string>,
  reason: string | undefined,
  pair: Pair,
  showAsClosedOnWeekends = false,
  isMarketsList?: boolean,
) => {
  if (reason?.toLowerCase().includes("weekend")) {
    if (showAsClosedOnWeekends) {
      return isMarketsList ? t.closed : t.marketClosed;
    }
    return `${pairToString(pair)} ${isMarketsList ? t.closed : t.marketClosed}`;
  }
  const reasonToShow =
    isMarketsList && reason === "market inactive" ? t.inactive : reason;
  return reasonToShow ?? t.closed;
};
