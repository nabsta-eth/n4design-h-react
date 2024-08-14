import { Pair } from "handle-sdk/dist/types/trade";
import { Language, TranslationMap } from "../types/translation";
import { ResolutionString, SeriesType } from "../types/charting_library";
import { Theme } from "../types/theme";
import { DEFAULT_CHART_PERIOD } from "../config/trade-chart";
import { getThemeFile } from "./ui";

export const SHOW_POSITIONS_IN_CHART_LOCAL_STORAGE_KEY = "showPositionsInChart";
export const IS_MODERN_THEME_KEY = "isModernTheme";

export type VersionedLocalStorageItem<T> = {
  value: T;
  version: number;
};

export interface LocalStorageItem<T> {
  remove: () => void;
  get: () => T | undefined;
  set: (value: T) => void;
}

export const createLocalStorageVersioned = <T>(
  key: string,
  version: number,
): LocalStorageItem<T> => ({
  remove: () => window.localStorage.removeItem(key),
  get: (): T | undefined => getVersionedLocalStorageItem(key, version),
  set: (value: T) => {
    const versionedItem: VersionedLocalStorageItem<T> = {
      version,
      value,
    };
    window.localStorage.setItem(key, JSON.stringify(versionedItem));
  },
});

export const createStorage = <T>(key: string): LocalStorageItem<T> => ({
  remove: () => window.localStorage.removeItem(key),
  get: (): T | undefined => getStorageItem(key),
  set: (value: T) => window.localStorage.setItem(key, JSON.stringify(value)),
});

const getVersionedLocalStorageItem = <T>(
  key: string,
  version: number,
): T | undefined => {
  const storage = createStorage<VersionedLocalStorageItem<T>>(key);
  const versionedItem = storage.get();
  if (!versionedItem) {
    return undefined;
  }
  if (versionedItem.version < version) {
    storage.remove();
    return undefined;
  }
  return versionedItem.value;
};

const setVersionedLocalStorageItem = <T>(
  key: string,
  version: number,
  value: T,
) => {
  const storage = createStorage<VersionedLocalStorageItem<T>>(key);
  storage.set({ version, value });
};

const removeVersionedLocalStorageItem = <T>(key: string) => {
  const storage = createStorage<VersionedLocalStorageItem<T>>(key);
  storage.remove();
};

const getStorageItem = <T>(key: string): T | undefined => {
  const item = window.localStorage.getItem(key);
  if (item) {
    try {
      return JSON.parse(item);
    } catch {
      // previous vue app didnt save data as JSON
      // this try catch stops users moving between apps seeing issues.
      console.error("Failed to parse local storage item", key);
    }
  }
};

export const isDevPanelVisibleLocalStorage =
  createStorage<boolean>("isDevPanelVisible");
export const slippageLocalStorage = createStorage<number>("slippage");
export const userSetGasPriceLocalStorage =
  createStorage<string>("userSetGasPrice");
export const tradePairLocalStorage = createStorage<Pair>("tradePair");
export const mobileFunctionLocalStorage =
  createStorage<string>("mobileFunction");
export const portfolioTilesLayoutsLocalStorage = createStorage(
  "portfolioTilesLayoutsLocalStorage",
);
export const hasInstallModalBeenDisplayedLocalStorage = createStorage<boolean>(
  "hasInstallModalBeenDisplayed",
);
export const isInstalledPwaLocalStorage =
  createStorage<boolean>("isInstalledPwa");

export const PRICECHART_TILE_ID_PREFIX = "priceChart";
export type PriceChartTile = {
  fromToken: string;
  toToken: string;
};
export type PriceChartTiles = {
  [key: string]: PriceChartTile;
};

export const priceChartTilesLocalStorage =
  createStorage<PriceChartTiles>("priceChartTiles");

export const walletValueThresholdLocalStorage = createStorage<string>(
  "walletValueThreshold",
);
export const tradeChartHeightLocalStorage =
  createStorage<number>("tradeChartHeight");
export const languageLocalStorage = createStorage<Language>("language");
export const translationLocalStorage =
  createStorage<TranslationMap>("translation");
export const themeLocalStorage = createStorage<Theme>("theme");

const FAVOURITE_MARKETS_LOCAL_STORAGE_KEY = "FavouriteMarkets";
export const favouriteMarketsLocalStorageKey = (
  mobileOrDesktop: "mobile" | "desktop",
) => `${mobileOrDesktop}${FAVOURITE_MARKETS_LOCAL_STORAGE_KEY}`;

export const favouriteMobileChartsLocalStorageKey = "favouriteMobileCharts";

export const showPositionsInChartLocalStorage = createStorage<boolean>(
  SHOW_POSITIONS_IN_CHART_LOCAL_STORAGE_KEY,
);

export const TRADE_FRAMES_VERSION = 3;
const TRADE_LAYOUT_LS_PREFIX = "tradeLayoutVersioned";
export const getTradeLayoutLocalStorage = (): string | undefined =>
  getVersionedLocalStorageItem<string>(
    TRADE_LAYOUT_LS_PREFIX,
    TRADE_FRAMES_VERSION,
  );

export const setTradeLayoutLocalStorage = (layout: string | undefined) =>
  setVersionedLocalStorageItem<string | undefined>(
    TRADE_LAYOUT_LS_PREFIX,
    TRADE_FRAMES_VERSION,
    layout,
  );

const TRADE_CHART_LS_VERSION = 1;
const TRADE_CHART_LS_PREFIX = "tradeChart_";

const TRADE_CHART_PERIOD_LS_PREFIX = `${TRADE_CHART_LS_PREFIX}Period_`;
export const getTradeChartPeriodLocalStorage = (id: string): ResolutionString =>
  getVersionedLocalStorageItem<ResolutionString>(
    `${TRADE_CHART_PERIOD_LS_PREFIX}${id}`,
    TRADE_CHART_LS_VERSION,
  ) ?? DEFAULT_CHART_PERIOD;

export const setTradeChartPeriodLocalStorage = (
  id: string,
  resolution: ResolutionString,
) =>
  setVersionedLocalStorageItem<ResolutionString>(
    `${TRADE_CHART_PERIOD_LS_PREFIX}${id}`,
    TRADE_CHART_LS_VERSION,
    resolution,
  );

const TRADE_CHART_STYLE_LS_PREFIX = `${TRADE_CHART_LS_PREFIX}Style_`;
export const getTradeChartStyleLocalStorage = (
  id: string,
  theme: Theme,
): SeriesType =>
  Number(
    (getVersionedLocalStorageItem<SeriesType>(
      `${TRADE_CHART_STYLE_LS_PREFIX}${theme}_${id}`,
      TRADE_CHART_LS_VERSION,
    ) as SeriesType) ?? getThemeFile(theme).chartStyle,
  );

export const setTradeChartStyleLocalStorage = (
  id: string,
  theme: Theme,
  style: SeriesType,
) =>
  setVersionedLocalStorageItem<SeriesType>(
    `${TRADE_CHART_STYLE_LS_PREFIX}${theme}_${id}`,
    TRADE_CHART_LS_VERSION,
    style,
  );

export const getTradeChartSavedLocalStorage = (id: string): object =>
  getVersionedLocalStorageItem<object>(
    `${TRADE_CHART_LS_PREFIX}${id}`,
    TRADE_CHART_LS_VERSION,
  ) ?? {};

export const setTradeChartSavedLocalStorage = (
  id: string,
  payload: {
    period: string;
    tabSet: string;
  },
) =>
  setVersionedLocalStorageItem<object>(
    `${TRADE_CHART_LS_PREFIX}${id}`,
    TRADE_CHART_LS_VERSION,
    payload,
  );

const TRADE_CHART_LAYOUT_LS_PREFIX = `${TRADE_CHART_LS_PREFIX}Layout_`;
export const getTradeChartLayoutSavedLocalStorage = (
  id: string,
): object | undefined =>
  getVersionedLocalStorageItem<object>(
    `${TRADE_CHART_LAYOUT_LS_PREFIX}${id}`,
    TRADE_CHART_LS_VERSION,
  );

export const setTradeChartLayoutSavedLocalStorage = (
  id: string,
  payload: object,
) =>
  setVersionedLocalStorageItem<object>(
    `${TRADE_CHART_LAYOUT_LS_PREFIX}${id}`,
    TRADE_CHART_LS_VERSION,
    payload,
  );

export const removeTradeChartLayoutSavedLocalStorage = (id: string) =>
  removeVersionedLocalStorageItem(`${TRADE_CHART_LAYOUT_LS_PREFIX}${id}`);

const TRADE_FRAMES_UPDATE_LOCAL_STORAGE_KEY = "tradeFramesUpdate";

export const getTradeFramesUpdateLocalStorage = (): boolean | undefined =>
  getVersionedLocalStorageItem<boolean>(
    TRADE_FRAMES_UPDATE_LOCAL_STORAGE_KEY,
    TRADE_FRAMES_VERSION,
  );

export const setTradeFramesUpdateLocalStorage = (value: boolean) =>
  setVersionedLocalStorageItem<boolean>(
    TRADE_FRAMES_UPDATE_LOCAL_STORAGE_KEY,
    TRADE_FRAMES_VERSION,
    value,
  );

export const tradeFramesVersionLocalStorage =
  createStorage<number>("tradeFramesVersion");

export const tradeFrameTabsetClosedLocalStorage = (id: string) =>
  createStorage<boolean | undefined>(`tradeFrameTabsetClosed_${id}`);
export const tradeFrameTabsetResizedLocalStorage = (id: string) =>
  createStorage<boolean | undefined>(`tradeFrameTabsetResized_${id}`);
export const tradeFrameTabsetDefaultHeightLocalStorage = (id: string) =>
  createStorage<number | undefined>(`tradeFrameTabsetDefaultHeight_${id}`);
