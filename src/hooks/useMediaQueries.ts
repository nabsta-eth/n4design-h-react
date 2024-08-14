import { useMediaQuery as useReactResponsiveMediaQuery } from "react-responsive";
import { themeFile } from "../utils/ui";
import {
  POSITIONS_THRESHOLD_FOR_STACKED_TABLE,
  TRADES_THRESHOLD_FOR_STACKED_TABLE,
} from "../config/trade";

export type MediaQueries = {
  maxLargeDesktop: boolean;
  minLargeDesktop: boolean;
  minDesktop: boolean;
  maxDesktop: boolean;
  minTablet: boolean;
  maxTablet: boolean;
  minMobile: boolean;
  maxMobile: boolean;
  minSmallMobile: boolean;
  maxSmallMobile: boolean;
  isStandalone: boolean;
  orientation: "portrait" | "landscape";
  tradeChartMinBreakpoint: boolean;
  tradeChartMaxBreakpoint: boolean;
  isMobile: boolean;
  isPositionsStacked: boolean;
  isTradesStacked: boolean;
  isDarkMode: boolean;
};

export const useMediaQueries = (): MediaQueries => {
  return {
    minLargeDesktop: useReactResponsiveMediaQuery({
      query: `(min-width: ${themeFile.minLargeDesktopBreakpoint})`,
    }),
    maxLargeDesktop: useReactResponsiveMediaQuery({
      query: `(max-width: ${themeFile.maxLargeDesktopBreakpoint})`,
    }),
    minDesktop: useReactResponsiveMediaQuery({
      query: `(min-width: ${themeFile.minDesktopBreakpoint})`,
    }),
    maxDesktop: useReactResponsiveMediaQuery({
      query: `(max-width: ${themeFile.maxDesktopBreakpoint})`,
    }),
    minTablet: useReactResponsiveMediaQuery({
      query: `(min-width: ${themeFile.minTabletBreakpoint})`,
    }),
    maxTablet: useReactResponsiveMediaQuery({
      query: `(max-width: ${themeFile.maxTabletBreakpoint})`,
    }),
    minMobile: useReactResponsiveMediaQuery({
      query: `(min-width: ${themeFile.minMobileBreakpoint})`,
    }),
    maxMobile: useReactResponsiveMediaQuery({
      query: `(max-width: ${themeFile.maxMobileBreakpoint})`,
    }),
    minSmallMobile: useReactResponsiveMediaQuery({
      query: `(min-width: ${themeFile.minSmallMobileBreakpoint})`,
    }),
    maxSmallMobile: useReactResponsiveMediaQuery({
      query: `(max-width: ${themeFile.maxSmallMobileBreakpoint})`,
    }),
    isStandalone: useReactResponsiveMediaQuery({
      query: `(display-mode: standalone)`,
    }),
    tradeChartMaxBreakpoint: useReactResponsiveMediaQuery({
      query: `(max-width: ${themeFile.maxTradeChartBreakpoint})`,
    }),
    tradeChartMinBreakpoint: useReactResponsiveMediaQuery({
      query: `(min-width: ${themeFile.minTradeChartBreakpoint})`,
    }),
    orientation: useReactResponsiveMediaQuery({
      query: `(orientation: portrait)`,
    })
      ? "portrait"
      : "landscape",
    isMobile: useReactResponsiveMediaQuery({
      query: `(pointer: coarse) and (hover: none)`,
    }),
    isPositionsStacked: useReactResponsiveMediaQuery({
      query: `(max-width: ${POSITIONS_THRESHOLD_FOR_STACKED_TABLE - 1}px)`,
    }),
    isTradesStacked: useReactResponsiveMediaQuery({
      query: `(max-width: ${TRADES_THRESHOLD_FOR_STACKED_TABLE - 1}px)`,
    }),
    isDarkMode: useReactResponsiveMediaQuery({
      query: "(prefers-color-scheme: dark)",
    }),
  };
};
