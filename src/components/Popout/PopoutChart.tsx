import { pairIdToPair } from "../../utils/trade";
import useQueryString from "../../hooks/useQueryString";
import TradeChart from "../TradeChart/TradeChart";
import { DEFAULT_CHART_PERIOD } from "../../config/trade-chart";
import { CHARTS_TABSET_ID } from "../../config/trade";
import { ResolutionString } from "src/types/charting_library";

const PopoutChart = () => {
  const queryString = useQueryString();
  const data = {
    chartId: queryString.get("id") ?? "ETH_USD",
    period: (queryString.get("period") ??
      DEFAULT_CHART_PERIOD) as ResolutionString,
    tabSet: queryString.get("tabSet") ?? CHARTS_TABSET_ID,
  };
  const pairFromString = pairIdToPair(data.chartId);
  return <TradeChart pair={pairFromString} data={data} />;
};

export default PopoutChart;
