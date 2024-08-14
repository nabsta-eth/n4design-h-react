import {
  FC,
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  SetStateAction,
  Dispatch,
} from "react";
import {
  Actions,
  IJsonModel,
  IJsonRowNode,
  IJsonTabNode,
  IJsonTabSetNode,
  Model,
} from "flexlayout-react";
import {
  ROOT_NODE_ID,
  BORDER_RIGHT_FORM_TAB_ID,
  BORDER_RIGHT_MARKETS_TAB_ID,
  CHARTS_TABSET_ID,
  CHARTS_TABSET_WEIGHT,
  CHART_TAB_COMPONENT,
  CHAT_TAB_COMPONENT,
  DEFAULT_FORM_WIDTH,
  DEFAULT_MARKETS_WIDTH,
  ENABLE_TAB_CLOSE,
  ENABLE_BORDER_TAB_CLOSE,
  ENABLE_TABSET_CLOSE,
  ENABLE_FLOAT,
  FORM_TABSET_ID,
  FORM_TAB_COMPONENT,
  MARKETS_TABSET_ID,
  MARKETS_TAB_COMPONENT,
  MIN_FORM_WIDTH,
  MIN_MARKETS_WIDTH,
  NEW_CHART_TAB,
  ORDERS_TAB_COMPONENT,
  POSITIONS_TABSET_ID,
  POSITIONS_TAB_COMPONENT,
  TRADES_TAB_COMPONENT,
  MARKETS_BORDER_TAB_CLASSNAME,
  CHART_BORDER_TAB_CLASSNAME,
  FORM_BORDER_TAB_CLASSNAME,
  POSITIONS_BORDER_TAB_CLASSNAME,
  BORDER_RIGHT_POSITIONS_TAB_ID,
  BORDER_RIGHT_ORDERS_TAB_ID,
  ORDERS_BORDER_TAB_CLASSNAME,
  TRADES_BORDER_TAB_CLASSNAME,
  BORDER_RIGHT_TRADES_TAB_ID,
  BORDER_RIGHT_CHAT_TAB_ID,
  CHAT_BORDER_TAB_CLASSNAME,
  MIN_CHAT_WIDTH,
  CHAT_TABSET_ID,
  SPLITTER_WIDTH,
  BORDER_RIGHT_ACCOUNT_TAB_ID,
  ACCOUNT_TAB_COMPONENT,
  ACCOUNT_BORDER_TAB_CLASSNAME,
  ACCOUNT_TABSET_ID,
  MIN_ACCOUNT_WIDTH,
  DEFAULT_ACCOUNT_HEIGHT,
  DEFAULT_TAB_MARKET,
  ACCOUNT_TRANSACTIONS_TAB_COMPONENT,
  BORDER_RIGHT_ACCOUNT_TRANSACTIONS_TAB_ID,
  ACCOUNT_TRANSACTIONS_BORDER_TAB_CLASSNAME,
  PORTFOLIO_TABSET_ID,
  PORTFOLIO_TABSET_HEIGHT,
  PORTFOLIO_TAB_COMPONENT,
  BORDER_RIGHT_PORTFOLIO_TAB_ID,
  PORTFOLIO_BORDER_TAB_CLASSNAME,
  DEFAULT_POSITIONS_TABSET_HEIGHT,
  POSITIONS_TABSET_WEIGHT,
  DEFAULT_ACCOUNT_WIDTH,
  MIN_PORTFOLIO_TABSET_WIDTH,
} from "../config/trade";
import { TranslationMap } from "../types/translation";
import {
  getTradeLayoutLocalStorage,
  setTradeLayoutLocalStorage,
  tradeFrameTabsetDefaultHeightLocalStorage,
  tradeFrameTabsetResizedLocalStorage,
} from "../utils/local-storage";
import { useLanguageStore } from "./Translation";
import { useUserWalletStore } from "@handle-fi/react-components/dist/context/UserWallet";
import {
  getChartTabClassName,
  updateMovedFrames,
  updatePortfolioFrameAttributes,
} from "../utils/trade/frames";

export type TradeLayoutValue = {
  defaultLayout: IJsonModel;
  layout: IJsonModel;
  setLayout: Dispatch<SetStateAction<IJsonModel>>;
  model: Model;
  setModel: Dispatch<SetStateAction<Model>>;
  onModelChange: (model: Model) => void;
  save: () => void;
  resetLayout: () => void;
  hasPortfolioMoved: boolean;
  setHasPortfolioMoved: Dispatch<SetStateAction<boolean>>;
  // Key frames consists of the trade form, markets and account frames/tabs.
  hasKeyFrameChanged: boolean;
  setHasKeyFrameChanged: Dispatch<SetStateAction<boolean>>;
};

export const TradeLayoutContext = createContext<TradeLayoutValue | undefined>(
  undefined,
);

export type TabsetNode = IJsonTabSetNode | IJsonRowNode;

const getLayout = (t: TranslationMap, isDev = false): IJsonModel => ({
  global: {
    tabEnableRename: false,
    splitterSize: SPLITTER_WIDTH,
    tabSetEnableClose: true,
  },
  borders: [
    {
      type: "border",
      location: "right",
      size: DEFAULT_FORM_WIDTH,
      barSize: 40,
      get children() {
        const tabs: IJsonTabNode[] = [
          {
            type: "tab",
            id: BORDER_RIGHT_MARKETS_TAB_ID,
            name: t.markets,
            enableClose: ENABLE_BORDER_TAB_CLOSE,
            component: MARKETS_TAB_COMPONENT,
            className: MARKETS_BORDER_TAB_CLASSNAME,
          },
          {
            type: "tab",
            id: BORDER_RIGHT_PORTFOLIO_TAB_ID,
            name: t.portfolio,
            enableClose: ENABLE_BORDER_TAB_CLOSE,
            component: PORTFOLIO_TAB_COMPONENT,
            className: PORTFOLIO_BORDER_TAB_CLASSNAME,
          },
          {
            type: "tab",
            id: "ETH_USD_1_RIGHT",
            name: "ETH/USD",
            enableClose: ENABLE_BORDER_TAB_CLOSE,
            enableDrag: false,
            component: CHART_TAB_COMPONENT,
            className: CHART_BORDER_TAB_CLASSNAME,
          },
          {
            type: "tab",
            id: BORDER_RIGHT_ACCOUNT_TAB_ID,
            name: "account",
            enableClose: ENABLE_BORDER_TAB_CLOSE,
            component: ACCOUNT_TAB_COMPONENT,
            className: ACCOUNT_BORDER_TAB_CLASSNAME,
          },
          {
            type: "tab",
            id: BORDER_RIGHT_FORM_TAB_ID,
            name: t.trade,
            enableClose: ENABLE_BORDER_TAB_CLOSE,
            component: FORM_TAB_COMPONENT,
            className: FORM_BORDER_TAB_CLASSNAME,
          },
          {
            type: "tab",
            id: BORDER_RIGHT_POSITIONS_TAB_ID,
            name: t.positions,
            enableClose: ENABLE_BORDER_TAB_CLOSE,
            component: POSITIONS_TAB_COMPONENT,
            className: POSITIONS_BORDER_TAB_CLASSNAME,
          },
        ];

        if (isDev) {
          tabs.push({
            type: "tab",
            id: BORDER_RIGHT_ORDERS_TAB_ID,
            name: t.orders,
            enableClose: ENABLE_BORDER_TAB_CLOSE,
            component: ORDERS_TAB_COMPONENT,
            className: ORDERS_BORDER_TAB_CLASSNAME,
          });
        }

        tabs.push({
          type: "tab",
          id: BORDER_RIGHT_TRADES_TAB_ID,
          name: t.tradeHistory,
          enableClose: ENABLE_BORDER_TAB_CLOSE,
          component: TRADES_TAB_COMPONENT,
          className: TRADES_BORDER_TAB_CLASSNAME,
        });

        tabs.push({
          type: "tab",
          id: BORDER_RIGHT_ACCOUNT_TRANSACTIONS_TAB_ID,
          name: "transactions",
          enableClose: ENABLE_BORDER_TAB_CLOSE,
          component: ACCOUNT_TRANSACTIONS_TAB_COMPONENT,
          className: ACCOUNT_TRANSACTIONS_BORDER_TAB_CLASSNAME,
        });

        if (isDev) {
          tabs.push({
            type: "tab",
            id: BORDER_RIGHT_CHAT_TAB_ID,
            name: "chat",
            enableClose: ENABLE_BORDER_TAB_CLOSE,
            component: CHAT_TAB_COMPONENT,
            className: CHAT_BORDER_TAB_CLASSNAME,
          });
        }

        return tabs;
      },
    },
  ],
  layout: {
    id: ROOT_NODE_ID,
    type: "row",
    get children() {
      const tabsets: TabsetNode[] = [
        MARKETS_TABSET(t),
        {
          type: "row",
          children: [
            PORTFOLIO_TABSET(t),
            {
              type: "tabset",
              id: CHARTS_TABSET_ID,
              enableClose: ENABLE_TABSET_CLOSE,
              weight: CHARTS_TABSET_WEIGHT,
              selected: 0,
              children: [
                {
                  type: "tab",
                  name: DEFAULT_TAB_MARKET,
                  id: `ETH_USD_1`,
                  className: getChartTabClassName(DEFAULT_TAB_MARKET),
                  component: CHART_TAB_COMPONENT,
                  enableClose: ENABLE_TAB_CLOSE,
                  enableFloat: ENABLE_FLOAT,
                },
                NEW_CHART_TAB,
              ],
              active: true,
            },
            POSITIONS_TABSET(t, isDev),
          ],
        },
        FORM_TABSET(t),
      ];
      return tabsets;
    },
  },
});

export const MARKETS_TABSET = (t: TranslationMap): IJsonTabSetNode => ({
  type: "tabset",
  id: MARKETS_TABSET_ID,
  enableClose: ENABLE_TABSET_CLOSE,
  weight: 0,
  width: DEFAULT_MARKETS_WIDTH,
  minWidth: MIN_MARKETS_WIDTH,
  children: [
    {
      type: "tab",
      name: t.markets,
      className: "markets-tab",
      component: MARKETS_TAB_COMPONENT,
      enableClose: ENABLE_TAB_CLOSE,
      enableFloat: ENABLE_FLOAT,
    },
  ],
  active: true,
});

export const FORM_TABSET = (
  t: TranslationMap,
  includeAccountTabset = true,
): IJsonRowNode => ({
  type: "row",
  width: DEFAULT_FORM_WIDTH,
  get children() {
    const tabs: IJsonTabSetNode[] = [];

    if (includeAccountTabset) {
      tabs.push({
        type: "tabset",
        id: ACCOUNT_TABSET_ID,
        enableClose: ENABLE_TABSET_CLOSE,
        height: DEFAULT_ACCOUNT_HEIGHT,
        weight: 0,
        width: DEFAULT_ACCOUNT_WIDTH,
        minWidth: MIN_ACCOUNT_WIDTH,
        children: [
          {
            type: "tab",
            name: "account",
            className: "deposit-tab",
            component: ACCOUNT_TAB_COMPONENT,
            enableClose: ENABLE_TAB_CLOSE,
            enableFloat: ENABLE_FLOAT,
          },
        ],
      });
    }

    tabs.push({
      type: "tabset",
      id: FORM_TABSET_ID,
      enableClose: ENABLE_TABSET_CLOSE,
      weight: 10,
      width: DEFAULT_FORM_WIDTH,
      minWidth: MIN_FORM_WIDTH,
      children: [
        {
          type: "tab",
          name: t.trade,
          className: "form-tab",
          component: FORM_TAB_COMPONENT,
          enableClose: ENABLE_TAB_CLOSE,
          enableFloat: ENABLE_FLOAT,
        },
      ],
    });

    return tabs;
  },
});

export const POSITIONS_TABSET = (
  t: TranslationMap,
  isDev: boolean,
): IJsonTabSetNode => ({
  type: "tabset",
  id: POSITIONS_TABSET_ID,
  enableClose: ENABLE_TABSET_CLOSE,
  minHeight: DEFAULT_POSITIONS_TABSET_HEIGHT,
  weight: 0,
  get children() {
    const tabs: IJsonTabNode[] = [
      {
        type: "tab",
        name: t.positions,
        className: "positions-tab",
        component: POSITIONS_TAB_COMPONENT,
        enableClose: ENABLE_TAB_CLOSE,
        enableFloat: ENABLE_FLOAT,
      },
    ];
    if (isDev) {
      tabs.push({
        type: "tab",
        name: t.orders,
        className: "orders-tab",
        component: ORDERS_TAB_COMPONENT,
        enableFloat: ENABLE_FLOAT,
      });
    }
    tabs.push({
      type: "tab",
      name: t.tradeHistory,
      className: "trades-tab",
      component: TRADES_TAB_COMPONENT,
      enableFloat: ENABLE_FLOAT,
    });
    tabs.push({
      type: "tab",
      name: "transactions",
      className: "transactions-tab",
      component: ACCOUNT_TRANSACTIONS_TAB_COMPONENT,
      enableFloat: ENABLE_FLOAT,
    });
    return tabs;
  },
  active: true,
});

export const CHAT_LAYOUT_ROW = {
  type: "row",
  children: [
    {
      type: "tabset",
      id: CHAT_TABSET_ID,
      enableClose: ENABLE_TABSET_CLOSE,
      weight: 0,
      width: MIN_CHAT_WIDTH,
      minWidth: MIN_CHAT_WIDTH,
      children: [
        {
          type: "tab",
          name: "chat",
          className: "chat-tab",
          component: CHAT_TAB_COMPONENT,
          enableClose: ENABLE_TAB_CLOSE,
          enableFloat: ENABLE_FLOAT,
        },
      ],
      active: true,
    },
  ],
};

export const PORTFOLIO_TABSET = (t: TranslationMap): IJsonTabSetNode => ({
  type: "tabset",
  id: PORTFOLIO_TABSET_ID,
  enableClose: ENABLE_TABSET_CLOSE,
  weight: POSITIONS_TABSET_WEIGHT,
  height: PORTFOLIO_TABSET_HEIGHT,
  minHeight: PORTFOLIO_TABSET_HEIGHT,
  minWidth: MIN_PORTFOLIO_TABSET_WIDTH,
  children: [
    {
      type: "tab",
      name: t.portfolio,
      className: "portfolio-tab",
      component: PORTFOLIO_TAB_COMPONENT,
      enableClose: ENABLE_TAB_CLOSE,
      enableFloat: ENABLE_FLOAT,
    },
  ],
  active: true,
});

export const TradeLayoutProvider: FC<{
  children: ReactNode;
}> = props => {
  const { t } = useLanguageStore();
  const { isDev } = useUserWalletStore();
  const [hasPortfolioMoved, setHasPortfolioMoved] = useState<boolean>(false);
  const [hasKeyFrameChanged, setHasKeyFrameChanged] = useState<boolean>(false);
  const defaultLayout = useMemo(() => getLayout(t, isDev), [t, isDev]);
  // When dev mode is enabled, set default layout plus mathis chat box.
  useEffect(() => {
    if (!isDev) {
      return;
    }
    const layout = JSON.parse(JSON.stringify(defaultLayout));
    layout.layout.children.push(CHAT_LAYOUT_ROW);
    setModel(Model.fromJson(layout));
    setLayout(layout);
  }, [isDev]);

  const [layout, setLayout] = useState<IJsonModel>(defaultLayout);

  const save = () => {
    const jsonStr = JSON.stringify(layout, null, "\t");
    setTradeLayoutLocalStorage(jsonStr);
  };

  const tradeLayoutFromLs = getTradeLayoutLocalStorage();
  const [model, setModel] = useState<Model>(
    Model.fromJson(tradeLayoutFromLs ? JSON.parse(tradeLayoutFromLs) : layout),
  );

  const resetLayout = () => {
    setModel(Model.fromJson(defaultLayout));
    setLayout(defaultLayout);
    save();
    tradeFrameTabsetDefaultHeightLocalStorage(POSITIONS_TABSET_ID).remove();
    tradeFrameTabsetResizedLocalStorage(POSITIONS_TABSET_ID).remove();
  };

  const onModelChange = (newModel: Model) => {
    const newLayout = newModel.toJson();
    setModel(newModel);
    setLayout(newLayout);
    save();

    const activeTabset = newModel.getActiveTabset();
    // Caters for the markets, form or account tabs being changed
    // to ensure the tabset is set to the correct size.
    if (activeTabset) {
      newModel.doAction(Actions.setActiveTabset(undefined));

      // Caters for the portfolio tab being moved
      // to ensure the tabset is set to the correct size.
      if (hasPortfolioMoved) {
        setHasPortfolioMoved(false);
        updatePortfolioFrameAttributes(newModel, activeTabset.getId(), true);
        return;
      }

      // Caters for the form, markets or account tabs being moved
      // to ensure they are set to the correct size.
      if (hasKeyFrameChanged) {
        setHasKeyFrameChanged(false);
        updateMovedFrames(newModel, activeTabset, hasKeyFrameChanged);
      }
    }
  };

  const value = useMemo(
    () => ({
      defaultLayout,
      layout,
      setLayout,
      model,
      setModel,
      onModelChange,
      save,
      resetLayout,
      hasPortfolioMoved,
      setHasPortfolioMoved,
      hasKeyFrameChanged,
      setHasKeyFrameChanged,
    }),
    [
      defaultLayout,
      layout,
      model,
      onModelChange,
      save,
      resetLayout,
      hasPortfolioMoved,
      hasKeyFrameChanged,
    ],
  );

  return (
    <TradeLayoutContext.Provider value={value}>
      {props.children}
    </TradeLayoutContext.Provider>
  );
};

export const useTradeLayoutStore = () => {
  const context = useContext(TradeLayoutContext);

  if (context === undefined) {
    throw new Error(
      "useTradeLayoutStore must be used within a TradeLayoutProvider",
    );
  }
  return context;
};
