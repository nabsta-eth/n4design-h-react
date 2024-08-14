import {
  Fragment,
  useEffect,
  useCallback,
  Dispatch,
  SetStateAction,
  useRef,
  MutableRefObject,
} from "react";
import TradeChart from "../components/TradeChart/TradeChart";
import {
  Action,
  Actions,
  BorderNode,
  DockLocation,
  IJsonModel,
  IJsonTabNode,
  ITabRenderValues,
  ITabSetRenderValues,
  Layout,
  Model,
  TabNode,
  TabSetNode,
} from "flexlayout-react";
import TradeForm from "../components/Trade/TradeForm/TradeForm";
import classes from "../components/Trade/Trade.module.scss";
import Markets from "../components/Markets/Markets";
import { hlp } from "handle-sdk/dist/components/trade/platforms";
import classNames from "classnames";
import {
  TRADE_FRAMES_VERSION,
  getTradeChartLayoutSavedLocalStorage,
  setTradeChartLayoutSavedLocalStorage,
  setTradeChartSavedLocalStorage,
  setTradeLayoutLocalStorage,
  tradeFrameTabsetDefaultHeightLocalStorage,
  tradeFramesVersionLocalStorage,
} from "../utils/local-storage";
import {
  pairIdToPair,
  pairStringToNativePairString,
  pairStringToPair,
} from "../utils/trade";
import { pairToDisplayString } from "../utils/trade/toDisplayPair";
import Positions from "../components/Positions/Positions";
import Trades from "../components/Trades/Trades";
import ColouredScrollbars from "../components/ColouredScrollbars";
import { DEFAULT_CHART_PERIOD } from "../config/trade-chart";
import { useTradeLayoutStore } from "../context/TradeLayout";
import {
  BORDER_RIGHT_FORM_TAB_ID,
  BORDER_RIGHT_MARKETS_TAB_ID,
  BORDER_RIGHT_RESET_TAB_ID,
  CHARTS_TABSET_ID,
  CHARTS_TABSET_WEIGHT,
  CHART_TAB_COMPONENT,
  CHAT_TAB_COMPONENT,
  ACCOUNT_TAB_COMPONENT,
  ENABLE_FLOAT,
  ENABLE_TAB_CLOSE,
  FORM_TABSET_ID,
  FORM_TAB_COMPONENT,
  MARKETS_TABSET_ID,
  MARKETS_TAB_COMPONENT,
  MINIMISED_TABSET_HEIGHT,
  MINIMISED_TABSET_WIDTH,
  NEW_CHART_TAB,
  NEW_CHART_TAB_ID,
  ORDERS_TAB_COMPONENT,
  POSITIONS_TABSET_ID,
  POSITIONS_TAB_COMPONENT,
  RESET_TAB_COMPONENT,
  SPLITTER_WIDTH,
  TRADES_TAB_COMPONENT,
  ACCOUNT_TRANSACTIONS_TAB_COMPONENT,
  MAX_WIDTH_BEFORE_POSITIONS_HIDDEN,
  PORTFOLIO_TAB_COMPONENT,
  PORTFOLIO_TABSET_ID,
  ACCOUNT_TABSET_ID,
  DEFAULT_MARKETS_WIDTH,
  DEFAULT_FORM_WIDTH,
  MARKETS_CONTAINER_CLASSNAME,
  MARKETS_RESPONSIVE_WIDTH,
  HIDE_BUY_SELL_BUTTONS_CLASSNAME,
  KEY_TAB_COMPONENTS,
  KEY_TABSET_IDS,
} from "../config/trade";
import { MathisChatBox } from "../components/MathisChatBox/MathisChatBox";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import { useTrade } from "../context/Trade";
import { pairToString } from "handle-sdk/dist/utils/general";
import { useUserWalletStore } from "@handle-fi/react-components/dist/context/UserWallet";
import { useLanguageStore } from "../context/Translation";
import { popout } from "../utils/trade/popout";
import {
  addClassesAndTooltips,
  resizeTabSetWidth,
  resizePositionsTabSet,
  doesTabsetExist,
  dockTabToWindow,
  getCurrentPairs,
  chartTabIxToSelect,
  addTabToTabset,
  getChartTabClassName,
  isChartTab,
  CurrentChartPairs,
  findTab,
  getNewTabId,
  checkAndSetResizeTabsets,
  resizeMarketsTabSetWidth,
  getComponentFromId,
} from "../utils/trade/frames";
import { useOrders } from "../context/Orders";
import { usePrevious } from "../hooks/usePrevious";
import TradeAccount from "../components/Trade/TradeAccount/TradeAccount";
import { MarketPrice, PRICE_DECIMALS } from "handle-sdk/dist/components/trade";
import AccountTransactions from "../components/AccountTransactions/AccountTransactions";
import { useWindowSize } from "../utils/ui";
import { getDocumentPriceTitle } from "../utils/trade/getDocumentPriceTitle";
import { getActivePaths } from "../utils/url";
import TradePortfolio from "../components/TradePortfolio/TradePortfolio";
import MarketChoiceModal from "../components/MarketChoiceModal/MarketChoiceModal";
import Metatags from "../components/Metatags";
import { Button } from "@handle-fi/react-components/dist/components/handle_uikit/components/Button";
import { useUiStore } from "../context/UserInterface";
import { TradePairOrViewOnlyInstrument } from "../types/trade";
import { useInstrumentOrThrow } from "../hooks/trade/useInstrumentOrThrow";
import { TranslationMap } from "../types/translation";
import { Pair } from "handle-sdk/dist/types/trade";

const Trade = () => {
  const {
    layout,
    setLayout,
    model,
    setModel,
    onModelChange,
    resetLayout,
    setHasPortfolioMoved,
    setHasKeyFrameChanged,
  } = useTradeLayoutStore();
  const { isMobile } = useUiStore();
  const activePaths = getActivePaths();
  const { isDev } = useUserWalletStore();
  const { t } = useLanguageStore();
  const {
    protocol,
    account: tradeAccount,
    setSelectedPair,
    selectedPair,
    selectedTradePairId,
    showMarketChoiceModal,
    setShowMarketChoiceModal,
    isNewChartTab,
    setIsNewChartTab,
  } = useTrade();
  const { orders } = useOrders();
  const wasDev = usePrevious(isDev);
  const layoutRef = useRef<Layout | null>(null);
  const isTrade = activePaths.length === 1 && activePaths[0] === "trade";
  const openPositionsCount = tradeAccount?.getAllPositions()?.length ?? 0;
  const openOrdersCount =
    (orders?.decrease?.length ?? 0) + (orders?.increase?.length ?? 0);
  const onCloseMarketChoiceModal = () => {
    setShowMarketChoiceModal(false);
    setIsNewChartTab(false);
  };
  useEffect(() => setShowMarketChoiceModal(false), [isMobile]);

  // This will reset the layout to the default
  // if breaking changes have been introduced.
  // Other actions could be also introduced here in future.
  useEffect(() => {
    if (tradeFramesVersionLocalStorage.get() !== TRADE_FRAMES_VERSION) {
      resetLayout();
      tradeFramesVersionLocalStorage.set(TRADE_FRAMES_VERSION);
    }
  }, []);

  const tradePairPrice =
    protocol.tryGetPrice(selectedTradePairId) ?? MarketPrice.zero();
  const instrument = useInstrumentOrThrow(
    pairToString(selectedTradePairId.pair),
  );
  useEffect(() => {
    if (!isTrade || tradePairPrice.index.isZero()) {
      return;
    }
    document.title = getDocumentPriceTitle(
      tradePairPrice.index,
      selectedTradePairId.pair,
      instrument.getDisplayDecimals(tradePairPrice.index),
      PRICE_DECIMALS,
    );
  }, [tradePairPrice.index, selectedTradePairId.toString(), activePaths]);

  useEffect(() => {
    if (wasDev && !isDev) {
      resetLayout();
    }
  }, [isDev]);

  const windowSize = useWindowSize();
  useEffect(() => {
    if (windowSize.windowWidth === 0) {
      return;
    }

    if (windowSize.windowWidth >= MAX_WIDTH_BEFORE_POSITIONS_HIDDEN) {
      return;
    }
    resizePositionsTabSet(
      model,
      setModel,
      setLayout,
      model.getNodeById(POSITIONS_TABSET_ID) as TabSetNode,
      "hide",
    );
  }, [windowSize]);

  const save = () => {
    const jsonStr = JSON.stringify(model.toJson(), null, "\t");
    setTradeLayoutLocalStorage(jsonStr);
  };

  // Called for every tab (frame) within the layout
  // to render the correct component(s).
  const factory = useCallback(
    (node: TabNode) => {
      const component = node.getComponent();
      switch (component) {
        case FORM_TAB_COMPONENT:
          return (
            <>
              {isTrade && (
                <ColouredScrollbars universal>
                  <TradeForm />
                </ColouredScrollbars>
              )}
            </>
          );
        case ACCOUNT_TAB_COMPONENT:
          return (
            <ColouredScrollbars universal>
              <TradeAccount />
            </ColouredScrollbars>
          );
        case CHART_TAB_COMPONENT:
          node.getExtraData().data = {
            chartId: node.getId(),
            period: DEFAULT_CHART_PERIOD,
            tabSet: CHARTS_TABSET_ID,
            node,
          };
          setTradeChartSavedLocalStorage(node.getId(), {
            period: DEFAULT_CHART_PERIOD,
            tabSet: CHARTS_TABSET_ID,
          });
          return (
            <TradeChart
              pair={pairStringToPair(node.getName())}
              data={node.getExtraData().data}
              addChart={addChartTab}
              renameTab={renameChartTab}
            />
          );
        case NEW_CHART_TAB.component:
          return <></>;
        case MARKETS_TAB_COMPONENT:
          return (
            <>
              {isTrade && (
                <MarketsContainer
                  model={model}
                  layout={layout}
                  setModel={setModel}
                  setLayout={setLayout}
                  layoutRef={layoutRef}
                  getCurrentPairs={getCurrentPairs}
                  doesTabsetExist={doesTabsetExist}
                  showMarketChoiceModal={showMarketChoiceModal}
                  setShowMarketChoiceModal={setShowMarketChoiceModal}
                  setIsNewChartTab={setIsNewChartTab}
                />
              )}
            </>
          );
        case POSITIONS_TAB_COMPONENT:
          return (
            <>
              {isTrade && (
                <PositionsContainer
                  model={model}
                  layout={layout}
                  setModel={setModel}
                  setLayout={setLayout}
                  layoutRef={layoutRef}
                  getCurrentPairs={getCurrentPairs}
                  doesTabsetExist={doesTabsetExist}
                />
              )}
            </>
          );
        case TRADES_TAB_COMPONENT:
          return <>{isTrade && <Trades show />}</>;
        case ACCOUNT_TRANSACTIONS_TAB_COMPONENT:
          return <>{isTrade && <AccountTransactions />}</>;
        case CHAT_TAB_COMPONENT:
          return <>{isTrade && <MathisChatBox />}</>;
        case PORTFOLIO_TAB_COMPONENT:
          return (
            <ColouredScrollbars universal>
              <TradePortfolio />
            </ColouredScrollbars>
          );
        default:
          break;
      }
    },
    [isTrade, model, layoutRef, showMarketChoiceModal],
  );

  // Called for each tab (frame) within the layout to set the icon.
  const iconFactory = useCallback(
    (node: TabNode) => {
      const component = node.getComponent();
      switch (component) {
        case FORM_TAB_COMPONENT:
          return <i className="fa-kit fa-trade" />;
        case CHART_TAB_COMPONENT:
          return <FontAwesomeIcon icon={["fal", "chart-line-up"]} />;
        case ACCOUNT_TAB_COMPONENT:
          return <FontAwesomeIcon icon={["fal", "database"]} />;
        case MARKETS_TAB_COMPONENT:
          return <FontAwesomeIcon icon={["fal", "list"]} />;
        case POSITIONS_TAB_COMPONENT:
          return <FontAwesomeIcon icon={["fal", "list-ul"]} />;
        case ORDERS_TAB_COMPONENT:
          return <FontAwesomeIcon icon={["fal", "list-ul"]} />;
        case TRADES_TAB_COMPONENT:
          return <FontAwesomeIcon icon={["fal", "history"]} />;
        case ACCOUNT_TRANSACTIONS_TAB_COMPONENT:
          return <FontAwesomeIcon icon={["fal", "arrow-down-to-bracket"]} />;
        case CHAT_TAB_COMPONENT:
          return <FontAwesomeIcon icon={["fal", "comments"]} />;
        case RESET_TAB_COMPONENT:
          return <FontAwesomeIcon icon={["fal", "arrow-rotate-left"]} />;
        case NEW_CHART_TAB_ID:
          return (
            <Button
              size="xsmall"
              color="yellow"
              className="uk-icon-button"
              onClick={() => setShowMarketChoiceModal(true)}
              tooltip={{
                text: t.addNewChartTooltip,
                position: "right",
                classes: "hfi-yellow",
              }}
            >
              <FontAwesomeIcon icon={["far", "plus"]} />
            </Button>
          );
        case PORTFOLIO_TAB_COMPONENT:
          return <FontAwesomeIcon icon={["fal", "grid-2"]} />;
        default:
          break;
      }
    },
    [t],
  );

  // Called for each tabset (frame contioning one or more tabs) within the layout
  // to perform additonal actions based upon the items being rendered.
  const onRenderTabSet = useCallback(
    (node: TabSetNode | BorderNode, renderValues: ITabSetRenderValues) =>
      renderTabSet(
        node,
        renderValues,
        model,
        setModel,
        setLayout,
        setHasPortfolioMoved,
        resetLayout,
        isDev,
        t,
      ),
    [model, setModel, setLayout, setHasPortfolioMoved, resetLayout, isDev, t],
  );

  const onRenderTab = useCallback(
    (node: TabNode, renderValues: ITabRenderValues) =>
      renderTab(node, renderValues, openPositionsCount, openOrdersCount),
    [openPositionsCount, openOrdersCount],
  );

  const onAction = useCallback(
    (action: Action) =>
      handleAction(
        action,
        setSelectedPair,
        model,
        layout,
        setModel,
        setLayout,
        setHasKeyFrameChanged,
        setShowMarketChoiceModal,
        setIsNewChartTab,
        resetLayout,
        layoutRef,
        t,
      ),
    [
      setSelectedPair,
      model,
      setModel,
      setLayout,
      setHasKeyFrameChanged,
      setShowMarketChoiceModal,
      setIsNewChartTab,
      resetLayout,
      layoutRef,
      t,
    ],
  );

  const renameChartTab = (node: TabNode, newPair: string) => {
    const currentTabId = node.getId();
    const newTabId = getNewTabId(getCurrentPairs(layout), newPair);
    const currentSavedLayout =
      getTradeChartLayoutSavedLocalStorage(currentTabId);
    setTradeChartLayoutSavedLocalStorage(newTabId, currentSavedLayout!);
    model.doAction(Actions.renameTab(currentTabId, newPair));
    model.doAction(
      Actions.updateNodeAttributes(currentTabId, { id: newTabId }),
    );
    node.getExtraData().data.chartId = newTabId;
    node.getExtraData().data.node = node;
  };

  const addChartTab = (pair: string) => {
    addOrSelectChart(
      model,
      layout,
      setModel,
      setLayout,
      layoutRef,
      pair,
      getCurrentPairs,
      doesTabsetExist,
      true,
    );
  };

  useEffect(() => {
    const marketsTabsetExists = doesTabsetExist(model, MARKETS_TABSET_ID);
    const formTabsetExists = doesTabsetExist(model, FORM_TABSET_ID);

    // setTimeout is necessary to ensure that the layout has been rendered
    setTimeout(() => {
      addClassesAndTooltips(marketsTabsetExists, formTabsetExists);
    }, 100);

    window.onbeforeunload = (e: Event) => {
      save();
    };
  }, [layout, model]);

  const onTabDrag = useCallback(
    (
      dragging: TabNode | IJsonTabNode,
      over: TabNode,
      x: number,
      y: number,
      location: DockLocation,
      refresh: () => void,
    ) =>
      handleTabDrag(
        dragging,
        over,
        x,
        y,
        location,
        refresh,
        setHasKeyFrameChanged,
      ),
    [],
  );

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.code === "KeyK" && e.ctrlKey) {
      e.preventDefault();
      e.stopPropagation();
      setShowMarketChoiceModal(true);
    }
  };
  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <Fragment>
      <Metatags function="trade" description="trade on handle.fi" />
      <div
        className={classNames(
          "uk-flex uk-flex-column",
          classes.tradeContainer,
          {
            [classes.hidden]: !isTrade,
          },
        )}
      >
        <Layout
          model={model}
          factory={factory}
          iconFactory={iconFactory}
          onRenderTab={onRenderTab}
          onRenderTabSet={onRenderTabSet}
          ref={layoutRef}
          onModelChange={onModelChange}
          onTabDrag={onTabDrag}
          onAction={onAction}
          classNameMapper={mapClassNames}
        />

        {showMarketChoiceModal && (
          <MarketChoiceModal
            onClose={onCloseMarketChoiceModal}
            addChartTab={addChartTab}
            isNewChartTab={isNewChartTab}
          />
        )}
      </div>
    </Fragment>
  );
};

const addOrSelectChart = (
  model: Model,
  layout: IJsonModel,
  setModel: Dispatch<SetStateAction<Model>>,
  setLayout: Dispatch<SetStateAction<IJsonModel>>,
  layoutRef: MutableRefObject<Layout | null>,
  pair: string,
  getCurrentPairs: (layout: IJsonModel) => CurrentChartPairs,
  doesTabsetExist: (model: Model, tabset: string) => boolean,
  add?: boolean,
) => {
  // if the charts tabset exists, check if the chart is already in it
  // else (re)create it

  if (doesTabsetExist(model, CHARTS_TABSET_ID)) {
    const currentChartPairs = getCurrentPairs(layout);
    const foundTab = findTab(currentChartPairs, pair);

    // if not adding the tab then select it if it exists
    if (!add && foundTab?.id) {
      return model.doAction(Actions.selectTab(foundTab?.id));
    }

    // otherwise add a new tab with the next id for that pair
    const correctedPairString = pairStringToNativePairString(pair);
    const newTabId = getNewTabId(currentChartPairs, correctedPairString);
    const tabset = model.getNodeById(CHARTS_TABSET_ID) as TabSetNode;
    const tabsetNumChildren = tabset.getChildren().length;
    const newTab = model.doAction(
      Actions.addNode(
        {
          type: "tab",
          component: CHART_TAB_COMPONENT,
          id: newTabId,
          name: correctedPairString,
          enableClose: ENABLE_TAB_CLOSE,
          enableFloat: ENABLE_FLOAT,
          className: getChartTabClassName(correctedPairString),
        },
        CHARTS_TABSET_ID,
        DockLocation.CENTER,
        tabsetNumChildren - 1,
      ),
    );

    setTradeChartSavedLocalStorage(newTabId, {
      period: DEFAULT_CHART_PERIOD,
      tabSet: CHARTS_TABSET_ID,
    });

    newTab?.getModel().doAction(
      Actions.updateNodeAttributes(newTab?.getId(), {
        id: newTab?.getId(),
        period: DEFAULT_CHART_PERIOD,
        tabSet: CHARTS_TABSET_ID,
      }),
    );
    return;
  }

  // no charts tabset so (re)create it
  const newTabId = getNewTabId([], pair);
  if (layoutRef?.current) {
    const modelAsJson = model.toJson();
    const newModel = modelAsJson;
    newModel.layout.children.push({
      type: "tabset",
      id: CHARTS_TABSET_ID,
      weight: CHARTS_TABSET_WEIGHT,
      children: [
        {
          type: "tab",
          name: pair,
          id: newTabId,
          component: CHART_TAB_COMPONENT,
          enableClose: true,
          enableFloat: ENABLE_FLOAT,
          enableRename: false,
        },
        NEW_CHART_TAB,
      ],
      active: true,
    });
    setModel(Model.fromJson(newModel));
    setLayout(newModel);
  }
};

type MarketsContainerProps = {
  model: Model;
  layout: IJsonModel;
  setModel: Dispatch<SetStateAction<Model>>;
  setLayout: Dispatch<SetStateAction<IJsonModel>>;
  layoutRef: MutableRefObject<Layout | null>;
  getCurrentPairs: (model: IJsonModel) => CurrentChartPairs;
  doesTabsetExist: (model: Model, tabset: string) => boolean;
  showMarketChoiceModal: boolean;
  setShowMarketChoiceModal: (show: boolean) => void;
  setIsNewChartTab?: (isNew: boolean) => void;
};

const MarketsContainer = (props: MarketsContainerProps) => {
  const supportedNetwork = hlp.config.DEFAULT_HLP_NETWORK;

  const onClickMarket = (pair: TradePairOrViewOnlyInstrument) => {
    const pairToAdd = pairToDisplayString(pair.pair);
    addOrSelectChart(
      props.model,
      props.layout,
      props.setModel,
      props.setLayout,
      props.layoutRef,
      pairToAdd,
      props.getCurrentPairs,
      props.doesTabsetExist,
    );
  };

  return (
    <div
      className={classNames(
        "uk-height-1-1",
        MARKETS_CONTAINER_CLASSNAME,
        classes.marketsContainer,
      )}
    >
      <Markets
        network={supportedNetwork}
        onClickMarket={onClickMarket}
        noBorder
        noTitle
        setShowMarketChoiceModal={props.setShowMarketChoiceModal}
        setIsNewChartTab={props.setIsNewChartTab}
      />
    </div>
  );
};

type PositionsContainerProps = {
  model: Model;
  layout: IJsonModel;
  setModel: Dispatch<SetStateAction<Model>>;
  setLayout: Dispatch<SetStateAction<IJsonModel>>;
  layoutRef: MutableRefObject<Layout | null>;
  getCurrentPairs: (model: IJsonModel) => CurrentChartPairs;
  doesTabsetExist: (model: Model, tabset: string) => boolean;
};

const PositionsContainer = (props: PositionsContainerProps) => {
  const onClickPositionMarket = useCallback(
    (pair: TradePairOrViewOnlyInstrument) => {
      const pairToAdd = pairToDisplayString(pair.pair);
      addOrSelectChart(
        props.model,
        props.layout,
        props.setModel,
        props.setLayout,
        props.layoutRef,
        pairToAdd,
        props.getCurrentPairs,
        props.doesTabsetExist,
      );
    },
    [],
  );

  return (
    <div className={classNames("uk-height-1-1", classes.positionsContainer)}>
      <Positions show onClickMarket={onClickPositionMarket} />
    </div>
  );
};

export default Trade;

const renderTabSet = (
  node: TabSetNode | BorderNode,
  renderValues: ITabSetRenderValues,
  model: Model,
  setModel: Dispatch<SetStateAction<Model>>,
  setLayout: Dispatch<SetStateAction<IJsonModel>>,
  setHasPortfolioMoved: Dispatch<SetStateAction<boolean>>,
  resetLayout: () => void,
  isDev: boolean,
  t: TranslationMap,
) => {
  if (node.getType() === "border") {
    return;
  }

  const tabsetNode = node as TabSetNode;
  checkAndSetResizeTabsets(tabsetNode);

  const id = tabsetNode.getId();
  const isPositionsTabset = id === POSITIONS_TABSET_ID;
  const isMarketsTabset = id === MARKETS_TABSET_ID;
  const isFormTabset = id === FORM_TABSET_ID;
  const isAccountTabset = id === ACCOUNT_TABSET_ID;
  const isChartTabset = id === CHARTS_TABSET_ID;
  const isPortfolioTabset = id === PORTFOLIO_TABSET_ID;

  const { height, width, x } = tabsetNode.getRect();
  if (
    isPositionsTabset &&
    !tradeFrameTabsetDefaultHeightLocalStorage(POSITIONS_TABSET_ID).get()
  ) {
    tradeFrameTabsetDefaultHeightLocalStorage(POSITIONS_TABSET_ID).set(height);
  }

  const resizeButtonEffectiveWidth = 16;
  const marketsResizeButtonLeftOffset =
    x +
    (width > resizeButtonEffectiveWidth / 2
      ? width - resizeButtonEffectiveWidth / 2
      : 0);

  const tradeResizeButtonLeftOffset =
    x -
    (width > resizeButtonEffectiveWidth - SPLITTER_WIDTH
      ? SPLITTER_WIDTH
      : resizeButtonEffectiveWidth - SPLITTER_WIDTH);

  const shouldHideBuySellButtons = width <= MARKETS_RESPONSIVE_WIDTH;
  const isTabsetWidthMinimised = width <= MINIMISED_TABSET_WIDTH;
  const isTabsetHeightMinimised = height <= MINIMISED_TABSET_HEIGHT;
  const isMarketsDefaultWidth = width === DEFAULT_MARKETS_WIDTH;
  const isFormDefaultWidth = width === DEFAULT_FORM_WIDTH;
  const shouldShowResetMarketsToDefaultWidthButton =
    !isTabsetWidthMinimised && !isMarketsDefaultWidth;
  const shouldShowResetFormToDefaultWidthButton =
    !isTabsetWidthMinimised && !isFormDefaultWidth;

  renderValues.buttons = [
    isPositionsTabset && (
      <button
        key={`${id}_resize`}
        className={classNames(
          `flexlayout__tab_toolbar_button ${id}-resize`,
          classes.tabsetButton,
          {
            minimised: height <= MINIMISED_TABSET_HEIGHT,
          },
        )}
        onClick={() =>
          resizePositionsTabSet(model, setModel, setLayout, tabsetNode)
        }
        uk-tooltip={`title: ${
          isTabsetHeightMinimised ? t.open : t.minimise
        }; pos: bottom; cls: uk-active;`}
      >
        <FontAwesomeIcon
          icon={[
            "far",
            isTabsetHeightMinimised ? "chevron-up" : "chevron-down",
          ]}
        />
      </button>
    ),

    isMarketsTabset && (
      <div
        key={`${id}_resize_buttons`}
        className={`hfi-button-collection-vertical ${id}-resize-buttons`}
        style={{
          left: `${marketsResizeButtonLeftOffset}px`,
        }}
      >
        {!shouldShowResetMarketsToDefaultWidthButton && (
          <button
            key={`${id}_resize`}
            className={classNames(
              `flexlayout__tab_toolbar_button uk-button uk-button-secondary ${id}-resize`,
              classes.tabsetButton,
              {
                minimised: isTabsetWidthMinimised,
              },
            )}
            onClick={() =>
              resizeTabSetWidth(model, setModel, setLayout, tabsetNode)
            }
            uk-tooltip={`title: ${
              isTabsetWidthMinimised ? t.showMarkets : t.hideMarkets
            }; pos: ${
              shouldShowResetMarketsToDefaultWidthButton ? "top" : "bottom"
            }; cls: uk-active;`}
          >
            <FontAwesomeIcon
              icon={[
                "far",
                isTabsetWidthMinimised ? "chevron-right" : "chevron-left",
              ]}
            />
          </button>
        )}

        {shouldShowResetMarketsToDefaultWidthButton && (
          <button
            key={`${id}_reset`}
            className={classNames(
              `flexlayout__tab_toolbar_button uk-button uk-button-secondary ${id}-reset`,
              classes.tabsetButton,
            )}
            onClick={() =>
              resizeMarketsTabSetWidth(
                model,
                setModel,
                setLayout,
                tabsetNode,
                "show",
                shouldHideBuySellButtons,
              )
            }
            uk-tooltip={`title: ${t.frameResetButtonTooltip}; pos: bottom; cls: uk-active;`}
          >
            <FontAwesomeIcon
              icon={[
                "far",
                `chevron-double-${
                  width < DEFAULT_MARKETS_WIDTH ? "right" : "left"
                }`,
              ]}
            />
          </button>
        )}
      </div>
    ),

    isFormTabset && (
      <div
        key={`${id}_resize_buttons`}
        className={`hfi-button-collection-vertical ${id}-resize-buttons`}
        style={{
          left: `${tradeResizeButtonLeftOffset}px`,
        }}
      >
        {!shouldShowResetFormToDefaultWidthButton && (
          <button
            key={`${id}_resize`}
            className={classNames(
              `flexlayout__tab_toolbar_button uk-button uk-button-secondary ${id}-resize`,
              classes.tabsetButton,
              {
                minimised: width <= MINIMISED_TABSET_WIDTH,
              },
            )}
            onClick={() =>
              resizeTabSetWidth(model, setModel, setLayout, tabsetNode)
            }
            uk-tooltip={`title: ${
              isTabsetWidthMinimised ? t.showTradeForm : t.hideTradeForm
            }; pos:  ${
              shouldShowResetFormToDefaultWidthButton ? "top" : "bottom"
            }; cls: uk-active;`}
          >
            <FontAwesomeIcon
              icon={[
                "far",
                isTabsetWidthMinimised ? "chevron-left" : "chevron-right",
              ]}
            />
          </button>
        )}

        {shouldShowResetFormToDefaultWidthButton && (
          <button
            key={`${id}_reset`}
            className={classNames(
              `flexlayout__tab_toolbar_button uk-button uk-button-secondary ${id}-reset`,
              classes.tabsetButton,
            )}
            onClick={() =>
              resizeTabSetWidth(model, setModel, setLayout, tabsetNode, "show")
            }
            uk-tooltip={`title: ${t.frameResetButtonTooltip}; pos: bottom; cls: uk-active;`}
          >
            <FontAwesomeIcon
              icon={[
                "far",
                `chevron-double-${
                  width < DEFAULT_FORM_WIDTH ? "left" : "right"
                }`,
              ]}
            />
          </button>
        )}
      </div>
    ),

    <button
      key={`${id}_reset`}
      className={classNames(
        `flexlayout__tab_toolbar_button ${id}-reset`,
        classes.tabsetButton,
      )}
      onClick={resetLayout}
      uk-tooltip="title: reset layout; pos: bottom; cls: uk-active;"
    >
      <FontAwesomeIcon icon={["far", "arrow-rotate-left"]} />
    </button>,

    <button
      key={`${id}_popout`}
      className={classNames(
        `flexlayout__tab_toolbar_button ${id}-popout`,
        classes.tabsetButton,
      )}
      onClick={() => popout(tabsetNode, isDev)}
      uk-tooltip="title: open in separate window; pos: bottom; cls: uk-active;"
    >
      <FontAwesomeIcon icon={["far", "external-link"]} />
    </button>,
  ];

  if (isMarketsTabset) {
    document
      .querySelectorAll(`.${MARKETS_CONTAINER_CLASSNAME}`)
      .forEach(div => {
        const method = width <= MARKETS_RESPONSIVE_WIDTH ? "add" : "remove";
        div.classList[method](HIDE_BUY_SELL_BUTTONS_CLASSNAME);
      });
  }

  if (
    isMarketsTabset ||
    isFormTabset ||
    isPositionsTabset ||
    isChartTabset ||
    isAccountTabset ||
    isPortfolioTabset
  ) {
    return;
  }

  // All "standard" tabsets have been processed so,
  // a final check to see if any additional tabsets contain
  // a portfolio tab to ensure its attributes are set.
  const tabsetChildren = tabsetNode.getChildren();
  const tabsetChildrenAsTabNodes = tabsetChildren.map(
    child => child as TabNode,
  );
  const hasPortfolioChild = tabsetChildrenAsTabNodes.some(
    child =>
      child.getComponent() === PORTFOLIO_TAB_COMPONENT &&
      !child.getId().includes(PORTFOLIO_TABSET_ID),
  );
  // If the tabset has a portfolio tab, trigger the setting of the default attributes.
  if (hasPortfolioChild) {
    setHasPortfolioMoved(true);
  }
};

// Renders the tab content.
// The left icon is set by iconFactory.
// For orders tab, the renderValues.button array is set to
// a warning icon with a tooltip to indicate beta.
// The border and new chart tabs are rendered empty with just icons.
const renderTab = (
  node: TabNode,
  renderValues: ITabRenderValues,
  openPositionsCount: number,
  openOrdersCount: number,
) => {
  const component = node.getComponent();
  const parentNode = node.getParent();
  const parentType = parentNode?.getType();
  if (parentType === "tabset" && component === ORDERS_TAB_COMPONENT) {
    renderValues.buttons = [
      <span key="orders-tab-button" className="hfi-orange">
        <FontAwesomeIcon
          icon={["fal", "warning"]}
          uk-tooltip="title: this feature is in beta. use at your own risk.; pos: bottom; cls: uk-active hfi-orange;"
        />
      </span>,
    ];
  }

  const isPositionsTypeTab =
    parentType === "tabset" &&
    (component === ORDERS_TAB_COMPONENT ||
      component === POSITIONS_TAB_COMPONENT);

  if (isPositionsTypeTab) {
    renderValues.buttons.push(
      <span key="number-tab-button" className="number-tab-button">
        {component === POSITIONS_TAB_COMPONENT && openPositionsCount}
        {component === ORDERS_TAB_COMPONENT && openOrdersCount}
      </span>,
    );
  }

  if (parentType === "tabset" && component !== NEW_CHART_TAB.component) {
    return;
  }
  renderValues.content = "";
};

const handleTabDrag = (
  dragging: TabNode | IJsonTabNode,
  _over: TabNode,
  _x: number,
  _y: number,
  _location: DockLocation,
  _refresh: () => void,
  setHasKeyFrameChanged: Dispatch<SetStateAction<boolean>>,
) => {
  const dragComponent = (dragging as TabNode).getComponent();
  if (dragComponent && KEY_TAB_COMPONENTS.includes(dragComponent)) {
    setHasKeyFrameChanged(true);
  }
  return undefined;
};

// Fired for any action taken on the layout: select, add, move, delete, etc.
// determined by the Actions class.
const handleAction = (
  action: Action,
  setSelectedPair: (pair: Pair) => void,
  model: Model,
  layout: IJsonModel,
  setModel: Dispatch<SetStateAction<Model>>,
  setLayout: Dispatch<SetStateAction<IJsonModel>>,
  setHasKeyFrameChanged: Dispatch<SetStateAction<boolean>>,
  setShowMarketChoiceModal: Dispatch<SetStateAction<boolean>>,
  setIsNewChartTab: Dispatch<SetStateAction<boolean>>,
  resetLayout: () => void,
  layoutRef: MutableRefObject<Layout | null>,
  t: TranslationMap,
) => {
  // Firstly, if a chart tab is selected,
  // ensure the trade form reflects the chart's market.
  if (action.type === Actions.SELECT_TAB && isChartTab(action.data.tabNode)) {
    setSelectedPair(pairIdToPair(action.data.tabNode));
  }

  // Determine if the action is a drag from the right border.
  // If so, it could be to a tabset (DockLocation.CENTER)
  // or the window (DockLocation.LEFT/RIGHT/TOP/BOTTOM).
  // Doing an empty return here is deliberate to prevent
  // the default action from being done
  // because that will for example,
  // remove the tab from the right border.

  if (action.type === Actions.MOVE_NODE) {
    if (action.data.fromNode.split("-").length < 3) {
      // If it's a chart tab and it's being moved from the charts tabset,
      // ensure that the new chart tab is only selected
      // if it is the only tab left.
      if (isChartTab(action.data.fromNode)) {
        const parent = model.getNodeById(action.data.fromNode)?.getParent();
        if (parent?.getId() !== CHARTS_TABSET_ID) {
          return action;
        }
        const currentChartTabPairs = getCurrentPairs(layout);
        const chartIdToSelect =
          currentChartTabPairs[chartTabIxToSelect(layout, action.data.fromNode)]
            .id;
        model.doAction(Actions.selectTab(chartIdToSelect));
        return action;
      }

      if (action.data.toNode !== "border_right") {
        if (action.data.fromNode === PORTFOLIO_TABSET_ID) {
          return action;
        }

        if (action.data.location === DockLocation.CENTER.getName()) {
          addTabToTabset(model, setModel, setLayout, action, t);
        } else {
          // Get the component of the tab being dragged
          // based upon the type of node id.
          const newComponent = getComponentFromId(action.data.fromNode, model);
          // Don't pass the original node id to prevent
          // deleting it if it's being dragged from the right border.
          const fromNodeId = action.data.fromNode.includes("right-")
            ? undefined
            : action.data.fromNode;
          dockTabToWindow(
            model,
            setModel,
            setLayout,
            layoutRef,
            t,
            newComponent,
            action.data.location,
            action.data.toNode,
            true,
            fromNodeId,
          );
        }
        return;
      }
    }
    if (KEY_TABSET_IDS.includes(action.data.toNode)) {
      setHasKeyFrameChanged(true);
    }
    return action;
  }

  // SELECT_TAB action is equivalent to clicking on a tab/button.
  // If the tab is the right chart button or the new chart tab,
  // open the choose market modal.
  // If it's the markets or form right button,
  // call the method to add back if removed.
  if (action.type === Actions.SELECT_TAB) {
    if (
      action.data.tabNode.includes("_RIGHT") ||
      action.data.tabNode === NEW_CHART_TAB_ID
    ) {
      setShowMarketChoiceModal(true);
      setIsNewChartTab(true);
      return;
    }

    if (
      action.data.tabNode.includes("_RIGHT") ||
      action.data.tabNode === BORDER_RIGHT_RESET_TAB_ID
    ) {
      resetLayout();
      return;
    }

    // Add markets/form tabs back to relevant side.
    if (
      action.data.tabNode.toLowerCase().includes("right") &&
      (action.data.tabNode === BORDER_RIGHT_MARKETS_TAB_ID ||
        action.data.tabNode === BORDER_RIGHT_FORM_TAB_ID)
    ) {
      const newComponent = action.data.tabNode.split("-")[1];
      const side =
        action.data.tabNode === BORDER_RIGHT_MARKETS_TAB_ID ? "left" : "right";
      dockTabToWindow(
        model,
        setModel,
        setLayout,
        layoutRef,
        t,
        newComponent,
        side,
        newComponent,
      );
      return;
    }
    if (action.data.tabNode.toLowerCase().includes("right")) {
      return;
    }
  }

  // If the action is to delete a chart tab,
  // make sure that the nearest chart tab is selected,
  // unless the new chart tab is the only one left.
  if (
    action.type === Actions.DELETE_TAB &&
    action.data.node.split("-").length < 3
  ) {
    const currentChartTabPairs = getCurrentPairs(layout);
    const chartIdToSelect =
      currentChartTabPairs[chartTabIxToSelect(layout, action.data.node)].id;
    model.doAction(Actions.selectTab(chartIdToSelect));
  }

  // Everything that is allowed to fall through,
  // let the default action continue,
  // in addition to any specific logic above.
  return action;
};

const mapClassNames = (classes: string): string => `${classes} trade`;
