import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChartingLibraryWidgetOptions,
  IChartingLibraryWidget,
  IOrderLineAdapter,
  IPositionLineAdapter,
  LanguageCode,
  ResolutionString,
  SeriesType,
  Timezone,
} from "../../types/charting_library";
import constructDatafeed from "../../utils/trade/tv-chart";
import { useUiStore } from "../../context/UserInterface";
import TradeChartHeader from "./TradeChartHeader";
import { DEFAULT_CHART_PERIOD } from "../../config/trade-chart";
import classNames from "classnames";
import TradeChartLoader from "./TradeChartLoader";
import {
  getTradeChartLayoutSavedLocalStorage,
  getTradeChartPeriodLocalStorage,
  getTradeChartStyleLocalStorage,
  mobileFunctionLocalStorage,
  setTradeChartLayoutSavedLocalStorage,
  setTradeChartPeriodLocalStorage,
  setTradeChartStyleLocalStorage,
} from "../../utils/local-storage";
import { Network } from "handle-sdk";
import { hlp } from "handle-sdk/dist/components/trade/platforms";
import { Pair } from "handle-sdk/dist/types/trade";
import { TranslationMap, translationLanguages } from "../../types/translation";
import { useLanguageStore } from "../../context/Translation";
import "./TradeChart.scss";
import { getThemeFile } from "../../utils/ui";
import classes from "./TradeChart.module.scss";
import { usePositions } from "../../context/Positions";
import {
  isSamePair,
  pairFromString,
  pairToString,
} from "handle-sdk/dist/utils/general";
import { ActiveOrders } from "handle-sdk/dist/components/trade/platforms/legacyInterface";
import { bigNumberToFloat } from "../../utils/general";
import type { Theme } from "../../types/theme";
import { useOrders } from "../../context/Orders";
import {
  USD_DISPLAY_DECIMALS,
  getUnderlyingTradePair,
} from "../../utils/trade";
import { isIncreaseOrder } from "../../utils/trade/orders";
import {
  DEFAULT_TRADE_NETWORK,
  getTradeNetworkOrNull,
  useTrade,
} from "../../context/Trade";
import { Instrument, PRICE_DECIMALS } from "handle-sdk/dist/components/trade";
import { constants, ethers } from "ethers";
import { bnToDisplayString } from "../../utils/format";
import { Position } from "handle-sdk/dist/components/trade/position";
import { TabNode } from "flexlayout-react";
import tradeChartHeader from "./TradeChartHeader.module.scss";
import {
  OFFENDING_CHART_PROPERTIES_LS_KEY,
  addIframeMenuOpenMutationObserver,
  checkAndResetLs,
  getChartOptions,
  getDisabledFeatures,
  addIframeDrawingToolbarMutationObserver,
  setCssFiles,
  symbolForChart,
} from "../../utils/trade/tv-chart/chart";
import { useInstrumentOrThrow } from "../../hooks/trade/useInstrumentOrThrow";
import { useConnectedNetwork } from "@handle-fi/react-components/dist/context/UserWallet";
import { getTradeChartContainerId } from "../../utils/trade/tv-chart/tradeChartContainerId";
import { useTradePrices } from "../../context/TradePrices";

export type ChartDataProps = {
  chartId: string;
  period: ResolutionString;
  tabSet: string;
  node?: TabNode;
};

type Props = {
  pair: Pair;
  className?: string;
  network?: Network;
  isMobile?: boolean;
  data?: ChartDataProps;
  addChart?: (pair: string) => void;
  renameTab?: (node: TabNode, newPair: string) => void;
};

type PositionLine = {
  entry: IPositionLineAdapter;
};

type OrderLine = IOrderLineAdapter;

export const CHART_ID_ATTRIBUTE = "data-chart-id";
const timeZone =
  (Intl.DateTimeFormat().resolvedOptions().timeZone as Timezone) || "Etc/UTC";

const TradeChart = (props: Props) => {
  const { activeTheme, isMobile, isTradePopout, isModernTheme } = useUiStore();
  const { network = hlp.config.DEFAULT_HLP_NETWORK } = props;
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartHeaderRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const [tvWidget, setTvWidget] = useState<IChartingLibraryWidget>();
  const [chartPair, setChartPair] = useState(
    props.pair || { baseSymbol: "WETH", quoteSymbol: "USD" },
  );
  const chartSymbol = symbolForChart(chartPair);
  const isMobileButNotTrade =
    isMobile && mobileFunctionLocalStorage.get() !== "trade";
  const { t, language } = useLanguageStore();
  const [locale, setLocale] = useState<LanguageCode>(
    translationLanguages.find(lang => lang.language === language)?.code ?? "en",
  );
  const trade = useTrade();
  const { showPositionsInChart } = usePositions();
  const {
    account: tradeAccount,
    setSelectedPair,
    setShowMarketChoiceModal,
    setIsNewChartTab,
  } = useTrade();
  const [isChartReady, setIsChartReady] = useState(false);
  const { getPrice } = useTradePrices();
  const marketPrices = getPrice(chartPair);
  const marketPrice = marketPrices?.marketPrice ?? constants.Zero;
  const [iframeMenuIsOpen, setIframeMenuIsOpen] = useState(false);
  const [iframeDrawingToolbarIsOpen, setIframeDrawingToolbarIsOpen] =
    useState(false);
  const { orders } = useOrders();
  const pairAsString = pairToString(chartPair);
  const instrument = useInstrumentOrThrow(pairAsString);
  const activeThemeName = activeTheme.replace("Modern", "");

  const tradePositions = tradeAccount?.getAllPositions();
  const tradePositionsForPair = useMemo(
    () =>
      tradePositions?.filter(position =>
        isSamePair(position.pairId.pair, getUnderlyingTradePair(props.pair)),
      ),
    [tradePositions, JSON.stringify(props.pair)],
  );

  const ordersForPair = useMemo(() => {
    const increase =
      orders?.increase.filter(order => isSamePair(order.pair, props.pair)) ??
      [];
    const decrease =
      orders?.decrease.filter(order => isSamePair(order.pair, props.pair)) ??
      [];
    return {
      increase,
      decrease,
    };
  }, [orders, JSON.stringify(props.pair)]);

  const initialPeriod = useMemo(
    () =>
      props?.data?.chartId &&
      getTradeChartPeriodLocalStorage(props.data.chartId)
        ? getTradeChartPeriodLocalStorage(props.data.chartId)
        : DEFAULT_CHART_PERIOD,
    [],
  );
  const [period, setPeriod] = useState<ResolutionString>(initialPeriod);

  const initialStyle = useMemo(
    () =>
      props?.data?.chartId &&
      getTradeChartStyleLocalStorage(props.data.chartId, activeTheme)
        ? getTradeChartStyleLocalStorage(props.data.chartId, activeTheme)
        : Number(getThemeFile(activeTheme).chartStyle),
    [],
  );
  const [style, setStyle] = useState<SeriesType>(initialStyle);

  useEffect(() => {
    if (isMobile) {
      setPeriod(DEFAULT_CHART_PERIOD);
      setStyle(Number(getThemeFile(activeTheme).chartStyle));
      return;
    }

    if (
      props.data?.chartId &&
      getTradeChartPeriodLocalStorage(props.data.chartId)
    ) {
      setPeriod(getTradeChartPeriodLocalStorage(props.data.chartId));
    } else {
      setPeriod(DEFAULT_CHART_PERIOD);
    }

    if (
      props.data?.chartId &&
      getTradeChartStyleLocalStorage(props.data.chartId, activeTheme)
    ) {
      setStyle(getTradeChartStyleLocalStorage(props.data.chartId, activeTheme));
    } else {
      setStyle(Number(getThemeFile(activeTheme).chartStyle));
    }
  }, [chartPair, activeTheme]);

  useEffect(() => {
    if (props?.data?.chartId) {
      checkAndResetLs(props.data.chartId);
    }
  }, [
    props?.data?.chartId,
    window.localStorage.getItem(OFFENDING_CHART_PROPERTIES_LS_KEY),
  ]);

  useEffect(() => {
    setLocale(
      translationLanguages.find(lang => lang.language === language)?.code ??
        "en",
    );
  }, [language]);

  const providerNetwork = useConnectedNetwork() ?? DEFAULT_TRADE_NETWORK;
  const tradeNetwork = providerNetwork
    ? getTradeNetworkOrNull(providerNetwork)
    : DEFAULT_TRADE_NETWORK;

  const chartPairIdString =
    props.data?.chartId && !isMobile
      ? props.data?.chartId
      : pairAsString.replace("/", "_");
  const chartIdAttribute = `trade-chart-${chartPairIdString}`;
  const chartContainerId = getTradeChartContainerId(chartPairIdString);

  useEffect(() => {
    if (!chartRef.current || !trade) {
      return;
    }

    // necessary to avoid colour flashes during change of theme
    setIsChartReady(false);
    const decimals = instrument.getDisplayDecimals(
      marketPrice,
      instrument.shouldUseExtendedDecimals,
    );
    const datafeed = constructDatafeed(
      trade,
      tradeNetwork!,
      props.data?.chartId,
      decimals,
    );
    const disabledFeatures = getDisabledFeatures(isMobile);
    const chartConfig: ChartingLibraryWidgetOptions = {
      container: chartRef.current,
      symbol: chartSymbol,
      interval: period,
      library_path: "/charting_library/",
      datafeed,
      auto_save_delay: 5,
      load_last_chart: true,
      saved_data:
        !isMobile && props.data?.chartId
          ? getTradeChartLayoutSavedLocalStorage(props.data?.chartId)
          : undefined,
      fullscreen: true,
      autosize: true,
      locale: locale,
      timezone: timeZone,
      theme: "dark",
      overrides: getChartOptions(activeTheme, style),
      toolbar_bg: getThemeFile(activeTheme).backgroundColor,
      loading_screen: {
        backgroundColor: getThemeFile(activeTheme).backgroundColor,
        foregroundColor: getThemeFile(activeTheme).primaryColor,
      },
      custom_css_url: `/charting_library/handle/handle_tv_styles.css`,
      enabled_features: ["hide_left_toolbar_by_default"],
      disabled_features: disabledFeatures,
    };

    // @ts-ignore TradingView is injected in index.html
    const _tvWidget = new TradingView.widget(chartConfig);

    const onChartReady = () => {
      const tvThemeName = activeTheme === "handleView" ? "light" : "dark";
      _tvWidget.changeTheme(tvThemeName).then(() => {
        // need to reapply overrides after changing theme
        // but state style may not be up to date so use LS
        // which will default to theme style if not set
        _tvWidget.applyOverrides(
          getChartOptions(
            activeTheme,
            getTradeChartStyleLocalStorage(
              props?.data?.chartId ?? "",
              activeTheme,
            ),
          ),
        );
        _tvWidget.onShortcut("ctrl+k", () => {
          setIsNewChartTab(true);
          setShowMarketChoiceModal(true);
        });
        // Get the iframe just created and add an id attribute to it
        // based on the its parent trade frame tab id.
        const chartIframeElement = document
          .getElementById(chartIdAttribute)
          ?.getElementsByTagName("iframe")[0];
        if (chartIframeElement) {
          chartIframeElement.setAttribute(
            CHART_ID_ATTRIBUTE,
            chartPairIdString,
          );
        }
        // Add an observer to the iframe to detect when any tradingview menu is open.
        // This is used to hide the buy/sell buttons when anyu menu is open
        // because the buttons could overlay the menu.
        if (!isMobile && props.data?.chartId) {
          addIframeMenuOpenMutationObserver(
            pairAsString,
            props.data.chartId,
            setIframeMenuIsOpen,
          );
          addIframeDrawingToolbarMutationObserver(
            pairAsString,
            props.data.chartId,
            setIframeDrawingToolbarIsOpen,
          );
        }
        setCssFiles(activeThemeName, isMobile, isModernTheme);
        setIsChartReady(true);
      });
    };

    setTvWidget(_tvWidget);
    _tvWidget.onChartReady(onChartReady);
    _tvWidget.subscribe("onAutoSaveNeeded", () => {
      _tvWidget.save(payload => {
        setTradeChartLayoutSavedLocalStorage(
          props.data?.chartId ?? "",
          payload,
        );
      });
    });

    return () => {
      setIsChartReady(false);
      _tvWidget.remove();
      setTvWidget(undefined);
    };
  }, [chartRef, isMobile, activeThemeName, locale, isModernTheme]);

  const onChartSymbolChange = (tvWidget: IChartingLibraryWidget) => {
    const newPair = tvWidget.activeChart().symbolExt()?.symbol;
    if (newPair && !isSamePair(chartPair, pairFromString(newPair))) {
      setChartPair(pairFromString(newPair));
      setSelectedPair(pairFromString(newPair));
      if (props.renameTab && props.data?.node) {
        props.renameTab(props.data.node, newPair);
      }
    }
  };

  useEffect(() => {
    if (
      !tvWidget ||
      !chartRef.current ||
      isMobileButNotTrade ||
      !isChartReady
    ) {
      return;
    }

    tvWidget?.setSymbol(chartSymbol, period, () => void 0);
    tvWidget
      ?.activeChart()
      .onSymbolChanged()
      .subscribe(null, () => onChartSymbolChange(tvWidget));
    tvWidget
      ?.activeChart()
      .onIntervalChanged()
      .subscribe(null, (newInterval: ResolutionString) => {
        setPeriod(newInterval);
        setTradeChartPeriodLocalStorage(props.data?.chartId ?? "", newInterval);
      });
    tvWidget
      ?.activeChart()
      .onChartTypeChanged()
      .subscribe(null, (newStyle: SeriesType) => {
        setStyle(newStyle);
        setTradeChartStyleLocalStorage(
          props.data?.chartId ?? "",
          activeTheme,
          newStyle,
        );
      });
  }, [tvWidget, isChartReady, chartRef, period, isMobileButNotTrade, trade]);

  const chartHeaderHeight = +tradeChartHeader.tradeChartHeaderHeight;

  const [positionLines, setPositionLines] = useState<PositionLine[]>([]);
  const [orderLines, setOrderLines] = useState<OrderLine[]>([]);

  useEffect(() => {
    if (
      !tvWidget ||
      !chartRef.current ||
      isMobileButNotTrade ||
      !isChartReady
    ) {
      return;
    }

    // Lines should be attempted to be removed before drawing
    // regardless of whether any are currently shown in the chart.
    removePositionLines();
    removeOrderLines();
    if (showPositionsInChart && tradePositionsForPair) {
      const positionLines = drawPositionLines(
        t,
        tradePositionsForPair,
        instrument,
        activeTheme,
        tvWidget,
      );
      const orderLines = ordersForPair
        ? drawOrderLines(ordersForPair, activeTheme, tvWidget)
        : [];
      setPositionLines(positionLines);
      setOrderLines(orderLines);
    }
  }, [
    tvWidget,
    isChartReady,
    chartRef.current,
    tradePositionsForPair?.length,
    ordersForPair.decrease.length,
    ordersForPair.increase.length,
    showPositionsInChart,
  ]);

  const removePositionLines = () => {
    positionLines.forEach(line => {
      line.entry.remove();
    });
    setPositionLines([]);
  };

  const removeOrderLines = () => {
    orderLines.forEach(line => line.remove());
    setOrderLines([]);
  };

  return (
    <div
      id={chartContainerId}
      className={classNames(classes.chartContainer, {
        "uk-height-1-1": !isTradePopout && !isMobile,
        [classes.popoutContainer]: isTradePopout,
        [classes.mobileContainer]: isMobile,
      })}
      ref={chartContainerRef}
    >
      <div className={classNames("uk-flex uk-flex-column")}>
        <div className="uk-flex uk-flex-middle" ref={chartHeaderRef}>
          <TradeChartHeader
            pair={chartPair}
            network={network}
            data={props.data}
            isChartReady={isChartReady}
            iframeMenuIsOpen={iframeMenuIsOpen}
            iframeDrawingToolbarIsOpen={iframeDrawingToolbarIsOpen}
          />
        </div>
      </div>

      <TradeChartLoader
        className={classNames("uk-flex uk-flex-center", {
          "uk-hidden": isChartReady,
          "uk-height-1-1": !isMobile,
          [classes.mobileLoader]: isMobile,
        })}
        style={isMobile ? undefined : { marginTop: `-${chartHeaderHeight}px` }}
      />

      <div
        id={chartIdAttribute}
        className={classNames(props.className, {
          "uk-hidden": !isChartReady,
        })}
        ref={chartRef}
        style={
          isMobile
            ? undefined
            : { height: `calc(100% - ${chartHeaderHeight}px)` }
        }
      />
    </div>
  );
};

export default TradeChart;

const drawLine = (
  line: IPositionLineAdapter | IOrderLineAdapter,
  price: number,
  quantity: string,
  text: string,
  color: string,
  activeTheme: Theme,
): IPositionLineAdapter | IOrderLineAdapter => {
  return line
    .setPrice(price)
    .setQuantity(quantity)
    .setText(text)
    .setLineStyle(1)
    .setLineColor(color)
    .setExtendLeft(true)
    .setBodyFont("bold 8px Verdana")
    .setQuantityFont("normal 8px Verdana")
    .setBodyBorderColor(color)
    .setBodyBackgroundColor(color)
    .setBodyTextColor(getThemeFile(activeTheme).backgroundColor)
    .setQuantityBorderColor(color)
    .setQuantityBackgroundColor(getThemeFile(activeTheme).backgroundColor)
    .setQuantityTextColor(color);
};

const drawPositionLine = (
  tvWidget: IChartingLibraryWidget,
  price: number,
  quantity: string,
  text: string,
  color: string,
  activeTheme: Theme,
): IPositionLineAdapter => {
  const baseLine = tvWidget.activeChart().createPositionLine();
  return drawLine(
    baseLine,
    price,
    quantity,
    text,
    color,
    activeTheme,
  ) as IPositionLineAdapter;
};

const drawOrderLine = (
  tvWidget: IChartingLibraryWidget,
  price: number,
  quantity: string,
  text: string,
  color: string,
  activeTheme: Theme,
): IOrderLineAdapter => {
  const baseLine = tvWidget.activeChart().createOrderLine();
  return drawLine(
    baseLine,
    price,
    quantity,
    text,
    color,
    activeTheme,
  ) as IOrderLineAdapter;
};

const getPositionLineData = (
  t: TranslationMap,
  position: Position,
  instrument: Instrument,
  theme: Theme,
) => {
  const entryPrice = +ethers.utils.formatUnits(
    position.entryPrice,
    PRICE_DECIMALS,
  );
  const entryPriceDisplay = bnToDisplayString(
    position.entryPrice,
    PRICE_DECIMALS,
    instrument.getDisplayDecimals(position.entryPrice),
  );
  const entryColor = position.isLong
    ? getThemeFile(theme).primaryColor
    : getThemeFile(theme).errorColor;
  const liquidationPrice = 0;
  const liquidationColor = position.isLong
    ? getThemeFile(theme).errorColor
    : getThemeFile(theme).primaryColor;

  const entryText = `${position.isLong ? t.long : t.short} ${t.entry}`;
  const liquidationText = `${position.isLong ? t.long : t.short} liq.`;

  return {
    entryPrice,
    entryPriceDisplay,
    entryColor,
    liquidationPrice,
    liquidationColor,
    entryText,
    liquidationText,
  };
};

const drawPositionLines = (
  t: TranslationMap,
  positions: Position[],
  instrument: Instrument,
  theme: Theme,
  tvWidget: IChartingLibraryWidget,
) => {
  return positions.map(position => {
    const { entryPrice, entryPriceDisplay, entryColor, entryText } =
      getPositionLineData(t, position, instrument, theme);

    const entryLine = drawPositionLine(
      tvWidget,
      entryPrice,
      entryPriceDisplay,
      entryText,
      entryColor,
      theme,
    );

    return {
      entry: entryLine,
    };
  });
};

const drawOrderLines = (
  orders: ActiveOrders,
  theme: Theme,
  tvWidget: IChartingLibraryWidget,
) => {
  const [successColor, errorColor] = [
    getThemeFile(theme).primaryColor,
    getThemeFile(theme).errorColor,
  ];
  return [...orders.increase, ...orders.decrease].map(order => {
    const [text, color] = (() => {
      if (isIncreaseOrder(order)) {
        const isLimit = order.isLong !== order.shouldTriggerAboveThreshold;
        return isLimit ? ["limit", successColor] : ["stop", successColor];
      }
      const isTakeProfit = order.isLong === order.shouldTriggerAboveThreshold;
      return isTakeProfit
        ? ["take profit", successColor]
        : ["stop loss", errorColor];
    })();

    return drawOrderLine(
      tvWidget,
      bigNumberToFloat(order.triggerPrice, PRICE_DECIMALS),
      bigNumberToFloat(order.sizeDelta, PRICE_DECIMALS).toFixed(
        USD_DISPLAY_DECIMALS,
      ),
      text,
      color,
      theme,
    );
  });
};
