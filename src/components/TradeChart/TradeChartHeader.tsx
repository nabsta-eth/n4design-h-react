import "./TradeChartHeader.scss";
import classNames from "classnames";
import { useMediaQueries } from "../../hooks/useMediaQueries";
import { useUiStore } from "../../context/UserInterface";
import {
  bnToDisplayString,
  removeWholeNumberSeparatorsFromNumberString,
  valueToDisplayString,
} from "../../utils/format";
import React from "react";
import FlashingNumber from "../FlashingNumber/FlashingNumber";
import Loader from "@handle-fi/react-components/dist/components/Loader";
import { useChartHeaderData } from "../../hooks/useChartHeaderData";
import { Network } from "handle-sdk";
import { Pair } from "handle-sdk/dist/types/trade";
import {
  getDisplayPair,
  pairToDisplayString,
  pairToDisplayTokens,
} from "../../utils/trade/toDisplayPair";
import PairDisplay from "@handle-fi/react-components/dist/components/PairDisplay/PairDisplay";
import { useLanguageStore } from "../../context/Translation";
import { getUkTooltip } from "../../utils/general";
import { getChartOptions } from "../../utils/trade/tv-chart/getChartOptions";
import { getDocumentPriceTitle } from "../../utils/trade/getDocumentPriceTitle";
import { useTradePrices } from "../../context/TradePrices";
import PriceDisplayExtended from "../PriceDisplayExtended/PriceDisplayExtended";
import { getThemeFile } from "../../utils/ui";
import { useTrade } from "../../context/Trade";
import { ViewOnlyInstrument } from "../../config/viewOnlyInstruments";
import classes from "./TradeChartHeader.module.scss";
import { TradeChartHeaderRightSection } from "./TradeChartHeaderRightSection";
import { constants, ethers } from "ethers";
import { useMarketAvailability } from "../../hooks/useMarketAvailability";
import { useTradePairFromPair } from "../../hooks/trade/useTradePairFromPair";
import { AMOUNT_UNIT } from "handle-sdk/dist/components/trade/reader";
import { TradePair } from "handle-sdk/dist/components/trade";
import { useInstrumentOrThrow } from "../../hooks/trade/useInstrumentOrThrow";
import { pairToString } from "handle-sdk/dist/utils/general";
import { ChartDataProps } from "./TradeChart";
import { TradeChartBuySellWidget } from "./TradeChartBuySellWidget";

type Props = {
  pair: Pair;
  network: Network;
  hidden?: boolean;
  isChartReady: boolean;
  data?: ChartDataProps;
  iframeMenuIsOpen: boolean;
  iframeDrawingToolbarIsOpen: boolean;
};

const DESKTOP_MIN_WIDTH_NEEDED_TO_SHOW_24H_PRICES = 1050;
const MOBILE_MIN_WIDTH_NEEDED_TO_SHOW_24H_PRICES = 520;
const MIN_WIDTH_NEEDED_TO_SHOW_OPEN_INTEREST = 840;

const TradeChartHeader: React.FC<Props> = ({
  pair,
  network,
  hidden,
  isChartReady,
  data,
  iframeMenuIsOpen,
  iframeDrawingToolbarIsOpen,
}) => {
  const { setSelectedPair } = useTrade();
  const tradePair = useTradePairFromPair(pair);
  const pairAvailability = useMarketAvailability(tradePair);
  const isMarketClosed = !pairAvailability.isAvailable;
  const { t } = useLanguageStore();
  const { isMobile, activeTheme, isTradePopout } = useUiStore();
  const { getPrice } = useTradePrices();
  const price = getPrice(pair)?.index ?? ethers.constants.Zero;
  const mediaQueries = useMediaQueries();
  const headerTitleClass = "uk-h6 hfi-3qtr-opacity";
  const headerDetailClass = mediaQueries.minMobile ? "uk-h4" : "uk-h5";
  const loaderClass = mediaQueries.minMobile
    ? classes.loaderHeightLarge
    : classes.loaderHeightSmall;
  const isViewOnly = ViewOnlyInstrument.isViewOnlyInstrument(tradePair);
  const chartHeaderData = useChartHeaderData(tradePair);
  const currentPriceValue = chartHeaderData?.currentPriceDisplay
    ? +removeWholeNumberSeparatorsFromNumberString(
        chartHeaderData?.currentPriceDisplay,
      )
    : 0;
  const chartHeaderDataChangeIsPositive =
    chartHeaderData.change && chartHeaderData.change >= 0;
  const chartHeaderDataChange = chartHeaderData.change
    ? chartHeaderData.change
    : 0;
  const chartHeaderDataChangeDisplay = `${
    chartHeaderDataChangeIsPositive ? "+" : ""
  }${(chartHeaderDataChange * 100).toFixed(2)}%`;

  const pairToDisplay = pairToDisplayTokens(pair);

  const marketTooltip = getUkTooltip({
    title: `${t.selectMarket} ${pairToDisplayString(pair)}`,
    position: "right",
    hide: isViewOnly || isMarketClosed || isMobile,
  });

  const setPairInternal = () => {
    setSelectedPair(pair);
  };

  const chartHeaderRef = React.useRef<HTMLDivElement>(null);
  const tradeHeaderWidth = chartHeaderRef.current?.offsetWidth ?? 0;
  const show24hHighLow =
    (isMobile &&
      tradeHeaderWidth >= MOBILE_MIN_WIDTH_NEEDED_TO_SHOW_24H_PRICES) ||
    (!isMobile &&
      tradeHeaderWidth >= DESKTOP_MIN_WIDTH_NEEDED_TO_SHOW_24H_PRICES);
  const showRightSection =
    !isViewOnly &&
    tradeHeaderWidth >= MIN_WIDTH_NEEDED_TO_SHOW_OPEN_INTEREST &&
    !isMobile;

  const instrument = useInstrumentOrThrow(pairToString(pair));
  const marketPrices = getPrice(pairToDisplay);
  const marketPrice = marketPrices?.marketPrice ?? constants.Zero;
  if (isTradePopout)
    document.title = getDocumentPriceTitle(
      price,
      tradePair.pair,
      instrument.getDisplayDecimals(marketPrice),
    );

  const displayPair = getDisplayPair(tradePair.pair, instrument);
  const shouldHideQuote = instrument.hideQuoteSymbol;

  const showLeverageDisplay = isMobile && !isViewOnly;
  const maxLeverageDisplay = isViewOnly
    ? undefined
    : `${bnToDisplayString(
        AMOUNT_UNIT.div((tradePair as TradePair).initialMarginFraction),
        0,
        0,
      )}x`;
  const shouldShowBuySellButtons =
    !isViewOnly && !!data?.chartId && !iframeMenuIsOpen;

  return (
    <div ref={chartHeaderRef} className="uk-width-expand">
      {pair && (
        <div
          className={classNames(
            "trade-chart-header uk-flex uk-flex-middle",
            classes.header,
            {
              "mobile-home": isMobile,
              "uk-hidden": hidden,
            },
          )}
          style={{
            backgroundColor: isMobile
              ? undefined
              : getChartOptions(activeTheme)["paneProperties.background"],
          }}
        >
          <div
            className={classNames(
              "uk-flex uk-flex-between uk-flex-middle uk-width-expand",
              classes.gapPoint675Rem,
              {
                [classes.gapPoint675Rem]: !mediaQueries.minMobile,
              },
            )}
          >
            <div
              className={classNames(
                "uk-flex uk-flex-between",
                classes.gapOneRem,
                {
                  [classes.gapPoint675Rem]: !mediaQueries.minMobile,
                },
              )}
            >
              <div
                className={classNames(
                  "uk-margin-remove-bottom uk-flex",
                  headerDetailClass,
                  {
                    "pair-width": mediaQueries.minMobile,
                    "pair-width-mobile uk-margin-small-right":
                      !mediaQueries.minMobile,
                    "uk-flex-middle": mediaQueries.minMobile,
                    "uk-flex-column uk-flex-top": !mediaQueries.minMobile,
                    "cursor-pointer": !isMarketClosed && !isViewOnly,
                  },
                )}
                onClick={
                  isViewOnly || isMarketClosed ? undefined : setPairInternal
                }
                uk-tooltip={marketTooltip}
              >
                <div className="uk-flex uk-flex-middle">
                  <PairDisplay
                    pair={displayPair as Pair}
                    size="1.5x"
                    assetsFontSize={17.5}
                    noAssets
                    className={classNames({
                      "uk-flex-column uk-flex-top":
                        isMobile ?? !mediaQueries.minMobile,
                      [classes.noQuoteIcon]: shouldHideQuote,
                    })}
                    instrument={instrument}
                  />
                  {showLeverageDisplay && (
                    <span className={classes.maxLeverage}>
                      {maxLeverageDisplay}
                    </span>
                  )}
                </div>
                <div
                  className={classNames(
                    "uk-flex uk-flex-column uk-flex-center uk-flex-top",
                  )}
                >
                  <PairDisplay
                    pair={displayPair as Pair}
                    assetsFontSize={17.5}
                    noIcons
                    className={classNames({
                      "uk-flex-column uk-flex-top":
                        isMobile ?? !mediaQueries.minMobile,
                    })}
                    instrument={instrument}
                  />
                </div>
              </div>

              <div
                className={classNames("uk-flex uk-flex-between", {
                  "uk-flex-bottom": isMobile ?? !mediaQueries.minMobile,
                  [classes.mobile]: isMobile ?? !mediaQueries.minMobile,
                  [classes.gapHalfRem]: !mediaQueries.minMobile,
                })}
              >
                <div className="stat-width uk-flex uk-flex-column uk-flex-start uk-flex-middle">
                  <span
                    className={classNames("uk-margin-remove", headerTitleClass)}
                  >
                    {t.marketPrice}
                  </span>

                  {chartHeaderData.marketPriceDisplay &&
                  currentPriceValue > 0 ? (
                    <FlashingNumber
                      className={classNames(
                        "margin-left-unset uk-margin-remove uk-flex uk-flex-middle",
                        headerDetailClass,
                        {
                          "uk-height-1-1": chartHeaderData.isLoaded,
                          "disabled-opacity": isMarketClosed,
                        },
                      )}
                      value={currentPriceValue}
                    >
                      <PriceDisplayExtended
                        price={chartHeaderData.marketPriceDisplay}
                        isViewOnly={isViewOnly}
                        chartHeader
                        className={classes.priceDisplay}
                      />
                    </FlashingNumber>
                  ) : (
                    <span
                      className={classNames(
                        "uk-flex uk-flex-middle",
                        loaderClass,
                      )}
                    >
                      <Loader color={getThemeFile(activeTheme).primaryColor} />
                    </span>
                  )}
                </div>

                {!isMobile && (
                  <div className="stat-width uk-flex uk-flex-column uk-flex-start uk-flex-middle">
                    <span
                      className={classNames(
                        "uk-margin-remove",
                        headerTitleClass,
                      )}
                    >
                      {t.indexPrice}
                    </span>

                    {chartHeaderData.currentPriceDisplay &&
                    currentPriceValue > 0 ? (
                      <FlashingNumber
                        className={classNames(
                          "margin-left-unset uk-margin-remove uk-flex uk-flex-middle",
                          headerDetailClass,
                          {
                            "uk-height-1-1": chartHeaderData.isLoaded,
                            "disabled-opacity": isMarketClosed,
                          },
                        )}
                        value={currentPriceValue}
                      >
                        <PriceDisplayExtended
                          price={chartHeaderData.currentPriceDisplay}
                          isViewOnly={isViewOnly}
                          chartHeader
                          className={classes.priceDisplay}
                        />
                      </FlashingNumber>
                    ) : (
                      <span
                        className={classNames(
                          "uk-flex uk-flex-middle",
                          loaderClass,
                        )}
                      >
                        <Loader
                          color={getThemeFile(activeTheme).primaryColor}
                        />
                      </span>
                    )}
                  </div>
                )}

                <div
                  className={classNames(
                    classes.smaller,
                    "stat-width smaller uk-flex uk-flex-column uk-flex-middle",
                  )}
                >
                  <span
                    className={classNames("uk-margin-remove", headerTitleClass)}
                  >
                    {t.tradeChartHeader24hChangeText}
                  </span>

                  {isMarketClosed && (
                    <span
                      className={classNames(
                        "uk-height-1-1 uk-flex uk-flex-middle",
                        {
                          [classes.disabled]: isMarketClosed,
                        },
                      )}
                    >
                      {t.closed}
                    </span>
                  )}

                  {!isMarketClosed && (
                    <FlashingNumber
                      value={
                        chartHeaderData.change &&
                        +(chartHeaderData.change * 100).toFixed(2)
                      }
                      delay="0.25s"
                      className={classNames(
                        "uk-flex uk-flex-middle",
                        headerDetailClass,
                        classes.headerDetailClassNonSpecial,
                        {
                          "uk-height-1-1": chartHeaderData.isLoaded,
                          "hfi-flash-up":
                            chartHeaderData.isLoaded &&
                            chartHeaderData.change &&
                            chartHeaderData.change >= 0,
                          "hfi-flash-down":
                            chartHeaderData.isLoaded &&
                            chartHeaderData.change &&
                            chartHeaderData.change < 0,
                        },
                      )}
                    >
                      {chartHeaderData.isLoaded ? (
                        chartHeaderDataChangeDisplay
                      ) : (
                        <span
                          className={classNames(
                            "uk-flex uk-flex-middle",
                            loaderClass,
                          )}
                        >
                          <Loader
                            color={getThemeFile(activeTheme).primaryColor}
                          />
                        </span>
                      )}
                    </FlashingNumber>
                  )}
                </div>

                {show24hHighLow && (
                  <div
                    className={classNames(
                      classes.smaller,
                      "stat-width smaller uk-flex uk-flex-column uk-flex-middle",
                    )}
                  >
                    <span
                      className={classNames(
                        "uk-margin-remove",
                        headerTitleClass,
                      )}
                    >
                      {t.tradeChartHeader24hHighText}
                    </span>

                    {isMarketClosed && (
                      <span
                        className={classNames(
                          "uk-height-1-1 uk-flex uk-flex-middle",
                          {
                            [classes.disabled]: isMarketClosed,
                          },
                        )}
                      >
                        {t.closed}
                      </span>
                    )}

                    {!isMarketClosed && (
                      <FlashingNumber
                        value={chartHeaderData.trueHigh}
                        className={classNames(
                          "uk-margin-remove uk-flex uk-flex-middle",
                          headerDetailClass,
                          {
                            "uk-height-1-1": chartHeaderData.isLoaded,
                          },
                        )}
                      >
                        {chartHeaderData.isLoaded &&
                        chartHeaderData.trueHigh ? (
                          <PriceDisplayExtended
                            price={valueToDisplayString(
                              chartHeaderData.trueHigh,
                              pair.baseSymbol,
                              chartHeaderData.precision,
                            )}
                            chartHeader
                            isViewOnly={isViewOnly}
                            className={classes.priceDisplay}
                          />
                        ) : (
                          <span
                            className={classNames(
                              "uk-flex uk-flex-middle",
                              loaderClass,
                            )}
                          >
                            <Loader
                              color={getThemeFile(activeTheme).primaryColor}
                            />
                          </span>
                        )}
                      </FlashingNumber>
                    )}
                  </div>
                )}

                {show24hHighLow && (
                  <div
                    className={classNames(
                      classes.smaller,
                      "stat-width smaller uk-flex uk-flex-column uk-flex-middle",
                    )}
                  >
                    <span
                      className={classNames(
                        "uk-margin-remove",
                        headerTitleClass,
                      )}
                    >
                      {t.tradeChartHeader24hLowText}
                    </span>

                    {isMarketClosed && (
                      <span
                        className={classNames(
                          "uk-height-1-1 uk-flex uk-flex-middle",
                          {
                            [classes.disabled]: isMarketClosed,
                          },
                        )}
                      >
                        {t.closed}
                      </span>
                    )}

                    {!isMarketClosed && (
                      <FlashingNumber
                        value={chartHeaderData.trueLow}
                        className={classNames(
                          "uk-margin-remove uk-flex uk-flex-middle",
                          headerDetailClass,
                          {
                            "uk-height-1-1": chartHeaderData.isLoaded,
                          },
                        )}
                      >
                        {chartHeaderData.isLoaded && chartHeaderData.trueLow ? (
                          <PriceDisplayExtended
                            price={valueToDisplayString(
                              chartHeaderData.trueLow,
                              pair.baseSymbol,
                              chartHeaderData.precision,
                            )}
                            chartHeader
                            isViewOnly={isViewOnly}
                            className={classes.priceDisplay}
                          />
                        ) : (
                          <span
                            className={classNames(
                              "uk-flex uk-flex-middle",
                              loaderClass,
                            )}
                          >
                            <Loader
                              color={getThemeFile(activeTheme).primaryColor}
                            />
                          </span>
                        )}
                      </FlashingNumber>
                    )}
                  </div>
                )}
              </div>
            </div>

            {showRightSection && (
              <div className={classNames("uk-flex", classes.rightSection)}>
                <TradeChartHeaderRightSection tradePair={tradePair} />
              </div>
            )}

            {isChartReady && (
              <TradeChartBuySellWidget
                tradePair={tradePair as TradePair}
                chartId={data?.chartId ?? ""}
                headerWidth={tradeHeaderWidth}
                show={shouldShowBuySellButtons}
                iframeDrawingToolbarIsOpen={iframeDrawingToolbarIsOpen}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TradeChartHeader;
