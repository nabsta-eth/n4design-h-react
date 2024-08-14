import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import classNames from "classnames";
import classes from "./Markets.module.scss";
import Market from "../Market/Market";
import { Network } from "handle-sdk";
import { useUiStore } from "../../context/UserInterface";
import { useParams } from "react-router-dom";
import { useTrade } from "../../context/Trade";
import { isSamePair, pairToString } from "handle-sdk/dist/utils/general";
import { useLanguageStore } from "../../context/Translation";
import ColouredScrollbars from "../ColouredScrollbars";
import { useTradePrices } from "../../context/TradePrices";
import {
  MARKETS_MIN_WIDTH_BEFORE_SCROLL,
  MARKETS_RESPONSIVE_WIDTH,
  MARKET_COLUMN_WIDTH_DESKTOP,
  MAX_MOBILE_FAVOURITE_CHARTS,
} from "../../config/trade";
import MobileMarket from "../Mobile/MobileMarket";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import ChooseWalletModal from "@handle-fi/react-components/dist/components/ChooseWalletModal/ChooseWalletModal";
import { getThemeFile } from "../../utils/ui";
import { TradePairId } from "handle-sdk/dist/components/trade";
import { Button } from "@handle-fi/react-components/dist/components/handle_uikit/components/Button";
import SelectTradePair from "../SelectTradePair";
import changeSort, { Sorting } from "../../utils/sort";
import { useInView } from "react-intersection-observer";
import { TradePairOrViewOnlyInstrument } from "../../types/trade";
import { useLocalStorageVersioned } from "@handle-fi/react-components/dist/hooks/useLocalStorageVersioned";
import mobileMarket from "../Mobile/MobileMarket.module.scss";
import { useUiMobileStore } from "../../context/UserInterfaceMobile";

type Props = {
  network: Network;
  isMarketsOnly?: boolean;
  noBorder?: boolean;
  noTitle?: boolean;
  onClickMarket?: (pair: TradePairOrViewOnlyInstrument) => void;
  setShowMarketChoiceModal?: (show: boolean) => void;
  setIsNewChartTab?: (isNew: boolean) => void;
};

const Markets: FC<Props> = props => {
  const {
    isMobile,
    isTradePopout,
    showChooseWalletModal,
    setShowChooseWalletModal,
    activeTheme,
    setMaxMobileFavouriteMarkets,
  } = useUiStore();
  const { t } = useLanguageStore();
  // gets the optional component param from the route
  const { component: componentParam } = useParams();
  const mobileMarkets =
    isMobile && !props.isMarketsOnly && componentParam !== "markets";
  const isMarkets = !props.isMarketsOnly && !mobileMarkets;
  const {
    pairs,
    viewOnlyInstruments,
    favouriteMarkets,
    selectedTradePairId,
    setFavouriteMarket,
  } = useTrade();
  const [showSearch, setShowSearch] = useState(false);
  const { ref, inView } = useInView({ threshold: 0.5 });
  const [hideMarketHeaderHint, setHideMarketHeaderHint] =
    useLocalStorageVersioned<boolean>("hideMarketHeaderHint", 1, false);

  const marketsRef = useRef<HTMLDivElement>(null);
  const marketsWidth = marketsRef.current ? marketsRef.current.offsetWidth : 0;
  // Allow for header or taskbar.
  const desktopOuterScrollbarHeight = isTradePopout ? "100vh" : "100%";
  const outerScrollbarStyle = {
    height: isMobile
      ? "var(--available-content-height-with-bottom-taskbar-only)"
      : desktopOuterScrollbarHeight,
  };
  const marketsScrollWrapperRef = useRef<HTMLDivElement>(null);
  const scrollWrapperHeight =
    marketsScrollWrapperRef.current?.getBoundingClientRect().height ?? 0;
  useEffect(() => {
    if (!isMobile || !marketsScrollWrapperRef.current) {
      return;
    }
    const maxMarkets = Math.max(
      0,
      Math.trunc(scrollWrapperHeight / +mobileMarket.mobileMarketRowHeight) - 1,
    );
    setMaxMobileFavouriteMarkets(maxMarkets);
  }, [scrollWrapperHeight]);

  const [sort, onSetSort] = useState<Sorting>({
    by: "symbol",
    direction: "asc",
  });

  const markets = useMemo(
    () =>
      [...pairs, ...viewOnlyInstruments].filter(market =>
        favouriteMarkets.some(fave => isSamePair(fave, market.pair)),
      ),
    [pairs, viewOnlyInstruments, favouriteMarkets],
  );

  const [sortedMarkets, setSortedMarkets] = useState<
    TradePairOrViewOnlyInstrument[]
  >([]);
  const marketsReversed = [...markets].reverse();
  useEffect(() => {
    const newSort = sort.direction === "asc" ? markets : marketsReversed;
    setSortedMarkets(newSort);
  }, [markets, sort]);

  const closeSearch = () => {
    setShowSearch(false);
  };

  const reverseSort = () => {
    changeSort(sort, sort.by, onSetSort);
  };

  const onClickShowMarketChoiceModal = () => {
    closeSearch();
    props.setIsNewChartTab?.(false);
    props.setShowMarketChoiceModal?.(true);
    setHideMarketHeaderHint(true);
  };

  useEffect(() => {
    if (!inView) {
      setShowSearch(false);
    }
  }, [inView]);

  const showBuySell = !isMobile && marketsWidth >= MARKETS_RESPONSIVE_WIDTH;

  const onChangeSelectedTradePair = useCallback(
    (tradePairId: TradePairId) => {
      setFavouriteMarket(tradePairId.pair);
    },
    [setFavouriteMarket],
  );

  return (
    <div
      ref={ref}
      className="uk-flex uk-flex-grow uk-height-1-1 uk-width-expand"
    >
      <ColouredScrollbars style={outerScrollbarStyle} universal>
        <div
          ref={marketsRef}
          className={classNames("uk-flex uk-flex-column", {
            [classes.mobileMarkets]: mobileMarkets,
            [classes.marketsOnly]: props.isMarketsOnly,
            [classes.markets]: isMarkets,
            [classes.noBorder]: props.noBorder,
            [classes.popoutMarkets]: isTradePopout,
          })}
          style={
            isMarkets && !mobileMarkets
              ? { minWidth: MARKETS_MIN_WIDTH_BEFORE_SCROLL }
              : undefined
          }
        >
          <div
            className={classNames(
              "uk-flex uk-flex-between uk-flex-middle",
              classes.headerWrapper,
            )}
          >
            <div
              className="uk-flex uk-flex-middle"
              style={{ width: isMobile ? "100%" : MARKET_COLUMN_WIDTH_DESKTOP }}
            >
              <Button
                size="small"
                color="yellow"
                className="uk-icon-button"
                onClick={onClickShowMarketChoiceModal}
                tooltip={
                  isMobile
                    ? undefined
                    : {
                        text: t.selectMarkets,
                        position: "right",
                        classes: "hfi-yellow",
                      }
                }
              >
                <FontAwesomeIcon icon={["far", "plus"]} />
              </Button>

              <Button
                className="uk-button-text uk-margin-left"
                onClick={reverseSort}
                tooltip={
                  isMobile
                    ? undefined
                    : { text: t.reverseSort, position: "bottom-left" }
                }
              >
                <FontAwesomeIcon
                  icon={[
                    "far",
                    `arrow-down-${
                      sort.direction === "asc" ? "short-wide" : "wide-short"
                    }`,
                  ]}
                  className={classNames("cursor-pointer pointer-events-all")}
                />
              </Button>

              {isMobile && !showSearch && (
                <Button
                  className="uk-button-text uk-margin-left uk-position-relative"
                  onClick={() => setShowSearch(true)}
                >
                  <FontAwesomeIcon icon={["far", "magnifying-glass"]} />
                </Button>
              )}

              {isMobile && showSearch && (
                <SelectTradePair
                  id="market-select"
                  className={classNames(
                    "uk-margin-small-left uk-width-expand",
                    classes.marketSelect,
                  )}
                  onChange={onChangeSelectedTradePair}
                  value={selectedTradePairId}
                  includeViewOnly
                  showInputAsSearch
                  dropdownOffset="0"
                  enableSelected
                />
              )}

              {!isMobile && !props.noTitle && (
                <h4 className="uk-margin-remove-vertical uk-margin-small-left">
                  {t.markets}
                </h4>
              )}
            </div>

            {showBuySell && (
              <div
                className="uk-flex-1 uk-margin-remove-vertical uk-flex uk-flex-middle uk-flex-right hfi-down buy-sell-button"
                style={{ paddingRight: 8 }}
              >
                <FontAwesomeIcon
                  className="uk-margin-small-right"
                  icon={["far", "chart-line-down"]}
                />
                {t.sell}
              </div>
            )}

            {showBuySell && (
              <div
                className="uk-flex-1 uk-margin-remove-vertical uk-flex uk-flex-middle uk-flex-right hfi-up buy-sell-button"
                style={{ paddingRight: 8 }}
              >
                <FontAwesomeIcon
                  className="uk-margin-small-right"
                  icon={["far", "chart-line-up"]}
                />
                {t.buy}
              </div>
            )}

            {(!isMobile || !showSearch) && (
              <div
                className="
                uk-flex-1
                uk-margin-remove-vertical
                uk-flex
                uk-flex-column
                uk-flex-bottom
                uk-flex-middle
                uk-text-right
              "
              >
                <div className={classes.priceHeader}>{t.market}</div>
                <div className={classes.changeHeader}>{t.change}</div>
              </div>
            )}

            {isMobile && showSearch && (
              <Button
                className="uk-button-text uk-margin-small-left uk-position-relative"
                onClick={() => closeSearch()}
              >
                <FontAwesomeIcon icon={["far", "times"]} />
              </Button>
            )}
          </div>

          {!hideMarketHeaderHint && (
            <div
              className={classNames(
                "uk-flex uk-flex-between uk-flex-middle",
                classes.hintWrapper,
              )}
            >
              <div
                className={classNames(
                  "uk-flex uk-flex-middle uk-width-expand",
                  classes.hintContent,
                )}
              >
                <FontAwesomeIcon
                  className={classNames(
                    "uk-margin-left",
                    classes.reflectVertical,
                  )}
                  icon={["far", "arrow-turn-up"]}
                />
                <span className="uk-margin-small-left">
                  {isMobile ? t.tapToAddMoreMarkets : t.clickToAddMoreMarkets}
                </span>
              </div>
            </div>
          )}

          {isMobile && <MobileMarketHint />}

          <div className="uk-flex uk-flex-1" ref={marketsScrollWrapperRef}>
            <ColouredScrollbars universal>
              <MarketsList
                network={props.network}
                sortedMarkets={sortedMarkets}
                isMarketsOnly={props.isMarketsOnly}
                onClickMarket={props.onClickMarket}
                marketsWidth={marketsWidth}
              />
            </ColouredScrollbars>
          </div>
        </div>
      </ColouredScrollbars>

      {isTradePopout && (
        <ChooseWalletModal
          showChooseWalletModal={showChooseWalletModal}
          setShowChooseWalletModal={setShowChooseWalletModal}
          isMobile={isMobile}
          primaryColor={getThemeFile(activeTheme).primaryColor}
        />
      )}
    </div>
  );
};

type MarketsListProps = {
  network: Network;
  sortedMarkets: TradePairOrViewOnlyInstrument[];
  isMarketsOnly?: boolean;
  onClickMarket?: (pair: TradePairOrViewOnlyInstrument) => void;
  marketsWidth: number;
};

const MarketsList = ({
  network,
  sortedMarkets,
  isMarketsOnly,
  onClickMarket,
  marketsWidth,
}: MarketsListProps) => {
  const { isMobile, maxMobileFavouriteMarkets } = useUiStore();
  const { favouriteMarkets } = useTrade();
  const { getPrice } = useTradePrices();
  const { t } = useLanguageStore();
  const marketsToShow = isMobile
    ? sortedMarkets.slice(0, maxMobileFavouriteMarkets + 1)
    : sortedMarkets;
  return (
    <>
      {marketsToShow.length > 0 ? (
        marketsToShow.map((market, ix) => {
          const isFavourite = favouriteMarkets.some(fave =>
            isSamePair(fave, market.pair),
          );
          if (!isMobile && !isFavourite) return null;
          const key = `${pairToString(market.pair)}-${ix}`;
          return isMobile ? (
            <MobileMarket key={key} tradePair={market} />
          ) : (
            <Market
              key={key}
              price={getPrice(market.pair)}
              tradePair={market}
              isFavourite={isFavourite}
              isMarketsOnly={isMarketsOnly}
              onClickMarket={onClickMarket}
              network={network}
              width={marketsWidth}
            />
          );
        })
      ) : (
        <div className="uk-flex uk-flex-center uk-width-1-1 uk-margin-top">
          {t.noMarketsFound}
        </div>
      )}
    </>
  );
};

const MobileMarketHint = () => {
  const { favouriteMobileCharts } = useUiMobileStore();
  const { t } = useLanguageStore();

  const favouriteChartsMessage = useMemo(() => {
    const isMaxFavouriteMobileChartsReached =
      favouriteMobileCharts.length >= MAX_MOBILE_FAVOURITE_CHARTS;
    return (
      isMaxFavouriteMobileChartsReached
        ? t.maxFavouriteChartsReached
        : t.maxFavouriteCharts
    ).replace("#numFavouriteCharts#", MAX_MOBILE_FAVOURITE_CHARTS.toString());
  }, [favouriteMobileCharts]);
  return (
    <div
      className={classNames(
        "uk-flex uk-flex-middle",
        classes.mobileAddFavesWrapper,
      )}
    >
      {t.addToCharts}
      <div className={classNames("uk-margin-small-left", classes.keyBox)}>
        <span className={classes.checkboxDummy} />
      </div>
      <span
        className={classNames("uk-margin-small-left", {
          "hfi-warning":
            favouriteMobileCharts.length >= MAX_MOBILE_FAVOURITE_CHARTS,
        })}
      >
        {favouriteChartsMessage}
      </span>
    </div>
  );
};

export default Markets;
