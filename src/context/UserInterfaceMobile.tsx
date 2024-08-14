import { Pair } from "handle-sdk/dist/types/trade";
import { hlp } from "handle-sdk/dist/components/trade/platforms";
import { isSamePair } from "handle-sdk/dist/utils/general";
import * as React from "react";
import Markets from "../components/Markets/Markets";
import { useTrade } from "./Trade";
import UIkit from "uikit";
import { mobileMenu } from "../components/Mobile/MobileMenu";
import { SwipeEventData, useSwipeable } from "react-swipeable";
import { useNavigate } from "react-router";
import { getActivePath } from "../utils/url";
import { TradePairOrViewOnlyInstrument } from "../types/trade";
import { DEFAULT_MOBILE_FAVOURITE_CHARTS } from "../config/trade";
import { useEffect } from "react";
import { favouriteMobileChartsLocalStorageKey } from "../utils/local-storage";
import { useLocalStorageVersioned } from "@handle-fi/react-components/dist/hooks/useLocalStorageVersioned";

export type UiMobileValue = {
  isMobileHomeInViewport: boolean;
  market: Pair | undefined;
  setMarket: (pair: Pair) => void;
  marketsToDisplay: TradePairOrViewOnlyInstrument[];
  verticalSwipeIndex: number;
  setVerticalSwipeIndex: (ix: number) => void;
  storePair: (market: Pair) => void;
  onChangeVerticalSwipeIndex: (ix: number) => void;
  onClickMarket: (pair: Pair) => void;
  swipeComponents: SwipeComponent[];
  activeMenuItem: number;
  setActiveMenuItem: (ix: number) => void;
  activeMenuItemTitle: string;
} & FavouriteMobileCharts;

const NETWORK = hlp.config.DEFAULT_HLP_NETWORK;
const FAVOURITE_MOBILE_CHARTS_LOCAL_STORAGE_VERSION = 1;

type SwipeComponent = JSX.Element | Pair;

export const UiMobileContext = React.createContext<UiMobileValue | undefined>(
  undefined,
);

//this disables the long-press context menu on Android Chrome for the home button
window.oncontextmenu = (event: MouseEvent) => {
  const pointerEvent = event as PointerEvent;

  if (pointerEvent.pointerType === "touch") {
    // context menu was triggered by long press
    return false;
  }

  // just to show that pointerEvent.pointerType has another value 'mouse' aka right click
  if (pointerEvent.pointerType === "mouse") {
    // context menu was triggered by right click
    return true;
  }

  // returning true will show a context menu for other cases
  return true;
};

export const UiMobileProvider: React.FC<{
  children: React.ReactNode;
}> = props => {
  const navigate = useNavigate();
  const {
    pairs: markets,
    selectedPair,
    viewOnlyInstruments,
    setSelectedPair,
  } = useTrade();
  const activePath = getActivePath();
  const activeMenuItemToShow = React.useMemo(() => {
    const activeMenuItemIx = mobileMenu.findIndex(
      menuItem => menuItem.title === activePath,
    );
    // use menu item 2 (MobileHome) as default if activePath is not found in mobileMenu
    return activeMenuItemIx === -1 ? 2 : activeMenuItemIx;
  }, [activePath]);
  const [activeMenuItem, setActiveMenuItem] =
    React.useState<number>(activeMenuItemToShow);

  const isMobileHomeInViewport = mobileMenu[activeMenuItem].title === "";

  // Receive token variables
  const [market, setMarket] = React.useState<Pair>();

  const {
    favouriteMobileCharts,
    setFavouriteMobileChart,
    unsetFavouriteMobileChart,
    clickedChart,
    setClickedChart,
  } = useFavouriteMobileCharts();

  const getMarketsToDisplay = (): TradePairOrViewOnlyInstrument[] =>
    [...markets, ...viewOnlyInstruments].filter(
      market =>
        favouriteMobileCharts.some(fave => isSamePair(market.pair, fave)) ||
        (!!clickedChart && isSamePair(market.pair, clickedChart)),
    );

  const [verticalSwipeIndex, setVerticalSwipeIndex] = React.useState(0);
  useEffect(() => {
    if (verticalSwipeIndex === 0) {
      setClickedChart(undefined);
    }
  }, [verticalSwipeIndex]);

  // Syncs the pair according to the selectedPair while this component
  // is not in the viewport.
  React.useEffect(() => {
    if (isMobileHomeInViewport || !selectedPair) return;
    setMarket(selectedPair);
  }, [isMobileHomeInViewport, selectedPair]);

  const sortedMarkets = React.useMemo(getMarketsToDisplay, [
    markets,
    viewOnlyInstruments,
    favouriteMobileCharts,
    clickedChart,
  ]);

  const storePair = React.useCallback(
    (market: Pair) => {
      if (!isMobileHomeInViewport) return;
      setMarket(market);
      setSelectedPair(market);
    },
    [isMobileHomeInViewport, setSelectedPair],
  );

  const onClickMarket = (pair: Pair) => {
    storePair(pair);
    const marketsToDisplay = getMarketsToDisplay();
    const index = marketsToDisplay.findIndex(p => isSamePair(p.pair, pair));
    setVerticalSwipeIndex(index === -1 ? 0 : index + 1);
  };

  const swipeComponents: SwipeComponent[] = React.useMemo(
    () => [
      <Markets key="markets" network={NETWORK} />,
      ...sortedMarkets.map(p => p.pair),
    ],
    [sortedMarkets],
  );

  const onChangeVerticalSwipeIndex = React.useCallback(
    (ix: number) => {
      UIkit.tooltip(".uk-tooltip")?.hide();
      setVerticalSwipeIndex(ix);
      if (isSwipeComponentPair(swipeComponents[ix]))
        storePair(swipeComponents[ix] as Pair);
    },
    [storePair, swipeComponents],
  );

  const swipeHandlers = useSwipeable({
    onSwiped: (swipeEvent: SwipeEventData) => {
      if (swipeEvent.dir === "Left" && activeMenuItem < mobileMenu.length - 1) {
        navigate(`/${mobileMenu[activeMenuItem + 1].title}`);
      }
      if (swipeEvent.dir === "Right" && activeMenuItem > 0) {
        navigate(`/${mobileMenu[activeMenuItem - 1].title}`);
      }
    },
  });

  const activeMenuItemTitle = mobileMenu[activeMenuItem].title;

  const value = React.useMemo(
    () => ({
      isMobileHomeInViewport,
      market,
      setMarket,
      marketsToDisplay: getMarketsToDisplay(),
      verticalSwipeIndex,
      setVerticalSwipeIndex,
      storePair,
      onChangeVerticalSwipeIndex,
      onClickMarket,
      swipeComponents,
      activeMenuItem,
      setActiveMenuItem,
      activeMenuItemTitle,
      favouriteMobileCharts,
      setFavouriteMobileChart,
      unsetFavouriteMobileChart,
      clickedChart,
      setClickedChart,
    }),
    [
      isMobileHomeInViewport,
      market,
      setMarket,
      verticalSwipeIndex,
      setVerticalSwipeIndex,
      storePair,
      onChangeVerticalSwipeIndex,
      onClickMarket,
      swipeComponents,
      activeMenuItem,
      setActiveMenuItem,
      activeMenuItemTitle,
      favouriteMobileCharts,
      setFavouriteMobileChart,
      unsetFavouriteMobileChart,
      clickedChart,
    ],
  );
  return (
    <UiMobileContext.Provider value={value}>
      <div {...swipeHandlers}>{props.children}</div>
    </UiMobileContext.Provider>
  );
};

export const useUiMobileStore = () => {
  const context = React.useContext(UiMobileContext);

  if (context === undefined) {
    throw new Error("useUiMobileStore must be used within a UiMobileProvider");
  }
  return context;
};

const isSwipeComponentPair = (component: any) =>
  component.quoteSymbol && component.baseSymbol;

type FavouriteMobileCharts = {
  favouriteMobileCharts: Pair[];
  setFavouriteMobileChart: (pair: Pair) => void;
  unsetFavouriteMobileChart: (pair: Pair) => void;
  clickedChart: Pair | undefined;
  setClickedChart: (pair: Pair | undefined) => void;
};

const useFavouriteMobileCharts = (): FavouriteMobileCharts => {
  const [clickedChart, setClickedChart] = React.useState<Pair | undefined>();
  const [
    favouriteMobileCharts,
    setFavouriteMobileCharts,
    isFavouriteMobileChartsUninitialised,
  ] = useLocalStorageVersioned<Pair[]>(
    favouriteMobileChartsLocalStorageKey,
    FAVOURITE_MOBILE_CHARTS_LOCAL_STORAGE_VERSION,
    [],
  );
  useEffect(() => {
    if (isFavouriteMobileChartsUninitialised) {
      setFavouriteMobileCharts(DEFAULT_MOBILE_FAVOURITE_CHARTS);
    }
  }, []);

  const getFavouriteMobileChartIndex = (pair: Pair): number =>
    favouriteMobileCharts.findIndex(p => isSamePair(p, pair));

  const setFavouriteMobileChart = (pair: Pair) => {
    if (getFavouriteMobileChartIndex(pair) >= 0) {
      return;
    }
    const newFaves = [...favouriteMobileCharts];
    newFaves.push(pair);
    setFavouriteMobileCharts(newFaves);
  };

  const unsetFavouriteMobileChart = (pair: Pair) => {
    const index = getFavouriteMobileChartIndex(pair);
    if (index < 0) {
      return;
    }
    const newFaves = [...favouriteMobileCharts];
    newFaves.splice(index, 1);
    setFavouriteMobileCharts(newFaves);
  };

  return {
    favouriteMobileCharts,
    setFavouriteMobileChart,
    unsetFavouriteMobileChart,
    clickedChart,
    setClickedChart,
  };
};
