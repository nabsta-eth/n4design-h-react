import { DateTime } from "luxon";
import { ViewOnlyInstrument } from "../../config/viewOnlyInstruments";

export const isItDaylightSavingsInNy = (date = new Date()) => {
  return DateTime.fromJSDate(date, { zone: "America/New_York" }).isInDST;
};

// see https://www.tradingview.com/charting-library-docs/latest/connecting_data/Trading-Sessions/
// Sunday = 1, Monday = 2, Tuesday = 3, Wednesday = 4, Thursday = 5, Friday = 6, Saturday = 7.
// Open from Sunday 17:00 EST/EDT until Friday 17:00 EST/EDT.
// For this array the first element is Sunday and the last is Saturday,
// so actual weekday number - 1 is used to index the array.
type TradingHoursType = { open: string; close: string }[];
export const forexTradingHours = (): TradingHoursType => [
  {
    open: isItDaylightSavingsInNy() ? "2100" : "2200",
    close: "2400",
  },
  {
    open: "0000",
    close: "2400",
  },
  {
    open: "0000",
    close: "2400",
  },
  {
    open: "0000",
    close: "2400",
  },
  {
    open: "0000",
    close: "2400",
  },
  {
    open: "0000",
    close: isItDaylightSavingsInNy() ? "2100" : "2200",
  },
];

export const isForexMarketAvailable = () => {
  const now = DateTime.local().toUTC();
  const weekDayIx = now.weekday === 7 ? 0 : now.weekday;
  const currentHourMinute = `${now.hour.toString().padStart(2, "0")}${now.minute
    .toString()
    .padStart(2, "0")}`;
  const forexHours = forexTradingHours();
  const isMarketAvailable =
    forexHours[weekDayIx] &&
    +currentHourMinute >= +forexHours[weekDayIx].open &&
    +currentHourMinute <= +forexHours[weekDayIx].close;
  return isMarketAvailable;
};

// TODO: add to this once market hours known
// for other view only markets
export const isViewOnlyMarketAvailable = (market: ViewOnlyInstrument) => {
  if (market.instrument.marketType === "forex") return isForexMarketAvailable();
  return true;
};
