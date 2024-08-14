import { removeTradeChartLayoutSavedLocalStorage } from "../../local-storage";

export const OFFENDING_CHART_PROPERTIES_LS_KEY = "tradingview.chartproperties";

export const checkAndResetLs = (chartId: string) => {
  const lsVar = OFFENDING_CHART_PROPERTIES_LS_KEY;
  const lsValue = window.localStorage.getItem(lsVar);
  if (lsValue) {
    const lsValueAsObject = JSON.parse(lsValue);
    if (lsValueAsObject.scalesProperties.lineColor.includes(", 0.12)")) {
      window.localStorage.removeItem(lsVar);
      // need to remove the specific chart layout ls too to ensure it loads and saves correctly again
      removeTradeChartLayoutSavedLocalStorage(chartId);
    }
  }
};
