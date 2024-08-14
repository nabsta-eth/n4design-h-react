import { ColorTypes, SeriesType } from "../../../types/charting_library";
import { Theme } from "../../../types/theme";
import { getThemeFile } from "../../ui";

// find properties https://github.com/tradingview/charting_library/wiki/Overrides
export const getChartOptions = (theme: Theme, style?: SeriesType) => {
  const themeFile = getThemeFile(theme);

  return {
    // Chart Styles
    "dataWindowProperties.background": themeFile.backgroundColor,
    "dataWindowProperties.font": themeFile.font,
    "dataWindowProperties.fontSize": 8,
    "paneProperties.background": themeFile.chartBackgroundColor,
    "paneProperties.backgroundType":
      themeFile.chartBackgroundType as ColorTypes,
    "paneProperties.backgroundGradientStartColor":
      themeFile.chartBackgroundStartColor,
    "paneProperties.backgroundGradientEndColor":
      themeFile.chartBackgroundStopColor,
    "paneProperties.vertGridProperties.color": themeFile.chartGridColor,
    "paneProperties.vertGridProperties.style": Number(themeFile.chartGridStyle),
    "paneProperties.horzGridProperties.color": themeFile.chartGridColor,
    "paneProperties.horzGridProperties.style": Number(themeFile.chartGridStyle),
    "paneProperties.crossHairProperties.color": themeFile.primaryColor,
    "paneProperties.legendProperties.backgroundTransparency": 100,
    "scalesProperties.textColor": themeFile.chartTextColor,
    "scalesProperties.fontSize": 10,
    "scalesProperties.lineColor": themeFile.eighthOpacityEquivalentColor,
    "mainSeriesProperties.style": style ?? Number(themeFile.chartStyle),
    "mainSeriesProperties.baseLineColor": themeFile.primaryColor,
    "mainSeriesProperties.areaStyle.color1": themeFile.primaryColor,
    "mainSeriesProperties.areaStyle.color2": "transparent",
    "mainSeriesProperties.areaStyle.linecolor": themeFile.primaryColor,
    "mainSeriesProperties.areaStyle.linewidth": 1,
    "mainSeriesProperties.areaStyle.transparency": 50,
    "mainSeriesProperties.barStyle.upColor": themeFile.chartUpColor,
    "mainSeriesProperties.barStyle.downColor": themeFile.chartDownColor,
    "mainSeriesProperties.barStyle.thinBars": false,
    "mainSeriesProperties.baselineStyle.baseLevelPercentage": 50,
    "mainSeriesProperties.baselineStyle.baselineColor": themeFile.errorColor,
    "mainSeriesProperties.baselineStyle.topLineColor": themeFile.primaryColor,
    "mainSeriesProperties.baselineStyle.topFillColor1": themeFile.primaryColor,
    "mainSeriesProperties.baselineStyle.topFillColor2": "transparent",
    "mainSeriesProperties.baselineStyle.topLineWidth": 1,
    "mainSeriesProperties.baselineStyle.bottomLineColor": themeFile.errorColor,
    "mainSeriesProperties.baselineStyle.bottomFillColor2": themeFile.errorColor,
    "mainSeriesProperties.baselineStyle.bottomFillColor1": "transparent",
    "mainSeriesProperties.baselineStyle.bottomLineWidth": 1,
    "mainSeriesProperties.baselineStyle.transparency": 0,
    "mainSeriesProperties.candleStyle.borderColor": themeFile.chartUpColor,
    "mainSeriesProperties.candleStyle.borderUpColor": themeFile.chartUpColor,
    "mainSeriesProperties.candleStyle.borderDownColor":
      themeFile.chartDownColor,
    "mainSeriesProperties.candleStyle.upColor": themeFile.chartUpColor,
    "mainSeriesProperties.candleStyle.downColor": themeFile.chartDownColor,
    "mainSeriesProperties.candleStyle.drawWick": true,
    "mainSeriesProperties.candleStyle.drawBorder": false,
    "mainSeriesProperties.candleStyle.wickColor": themeFile.chartUpColor,
    "mainSeriesProperties.candleStyle.wickUpColor": themeFile.chartUpColor,
    "mainSeriesProperties.candleStyle.wickDownColor": themeFile.chartDownColor,
    "mainSeriesProperties.candleStyle.drawBody": true,
    "mainSeriesProperties.haStyle.upColor": themeFile.upyColor,
    "mainSeriesProperties.haStyle.downColor": themeFile.chartDownColor,
    "mainSeriesProperties.haStyle.borderColor": themeFile.chartUpColor,
    "mainSeriesProperties.haStyle.borderUpColor": themeFile.chartUpColor,
    "mainSeriesProperties.haStyle.borderDownColor": themeFile.chartDownColor,
    "mainSeriesProperties.haStyle.drawWick": true,
    "mainSeriesProperties.haStyle.drawBorder": false,
    "mainSeriesProperties.haStyle.wickColor": themeFile.chartUpColor,
    "mainSeriesProperties.haStyle.wickUpColor": themeFile.chartUpColor,
    "mainSeriesProperties.haStyle.wickDownColor": themeFile.downrColor,
    "mainSeriesProperties.haStyle.drawBody": true,
    "mainSeriesProperties.hollowCandleStyle.upColor": themeFile.chartUpColor,
    "mainSeriesProperties.hollowCandleStyle.downColor":
      themeFile.chartDownColor,
    "mainSeriesProperties.hollowCandleStyle.borderUpColor":
      themeFile.chartUpColor,
    "mainSeriesProperties.hollowCandleStyle.borderDownColor":
      themeFile.chartDownColor,
    "mainSeriesProperties.hollowCandleStyle.drawWick": true,
    "mainSeriesProperties.hollowCandleStyle.drawBorder": true,
    "mainSeriesProperties.hollowCandleStyle.wickColor": themeFile.chartUpColor,
    "mainSeriesProperties.hollowCandleStyle.wickUpColor":
      themeFile.chartUpColor,
    "mainSeriesProperties.hollowCandleStyle.wickDownColor":
      themeFile.chartDownColor,
    "mainSeriesProperties.hollowCandleStyle.drawBody": false,
    "mainSeriesProperties.lineStyle.color": themeFile.primaryColor,
    "mainSeriesProperties.lineStyle.linewidth": 1,
  };
};
