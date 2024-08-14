import { addDays } from "date-fns";
import { PricePoint } from "handle-sdk";
import { average } from "./general";
import { fetchHistoricalChartBars } from "./trade/tv-chart/request";

type DataInterval = "1min" | "5min" | "15min";

const interval = (period: number): DataInterval => {
  switch (period) {
    case 1:
      return "1min";
    case 7:
      return "5min";
    case 30:
      return "15min";
    default:
      return "1min";
  }
};

export async function getFiatPriceData(
  from: string,
  to: string,
  days: number,
): Promise<PricePoint[] | null | undefined> {
  const endDate = new Date();
  const startDate = addDays(endDate, -days);
  try {
    const bars = await fetchHistoricalChartBars(
      `${from}/${to}`,
      interval(days),
      startDate.getTime(),
      endDate.getTime(),
    );
    return bars.map(bar => ({
      timestamp: bar.time,
      price: average([bar.open, bar.high, bar.low, bar.close]),
      date: bar.time,
    }));
  } catch (error: any) {
    if (error.response) {
      // Request made and server responded
      console.error("getFiatPriceData: error:", error.response);
      console.error(error.response.data.message);
    } else if (error.request) {
      // The request was made but no response was received
      console.error("getFiatPriceData: no response:", error.request);
      console.error(error);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("getFiatPriceData: other error:", error.message);
      console.error(error);
    }
  }
}
