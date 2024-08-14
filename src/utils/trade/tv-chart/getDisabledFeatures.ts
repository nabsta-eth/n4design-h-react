import { ChartingLibraryFeatureset } from "../../../types/charting_library";
const DISABLED_FEATURES: ChartingLibraryFeatureset[] = [
  "header_compare",
  "header_symbol_search",
  "main_series_scale_menu",
  "symbol_search_hot_key",
];
const DISABLED_MOBILE_FEATURES: ChartingLibraryFeatureset[] = [
  "header_widget",
  "legend_widget",
  "control_bar",
  "chart_scroll",
  "chart_zoom",
  "left_toolbar",
  "timeframes_toolbar",
];

export const getDisabledFeatures = (isMobile: boolean) => {
  const disabledFeatures = DISABLED_FEATURES;
  if (isMobile) {
    disabledFeatures.push(...DISABLED_MOBILE_FEATURES);
  }
  return disabledFeatures;
};
