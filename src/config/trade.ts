import { pairFromString } from "handle-sdk/dist/utils/general";
import { Sorting } from "../utils/sort";
import { marketTypes } from "handle-sdk/dist/components/trade";
import { utils } from "ethers";
import { IconName, IconPrefix } from "@fortawesome/fontawesome-common-types";
import { Notify } from "@handle-fi/react-components/dist/utils/notifications";
import { Pair } from "handle-sdk/dist/types/trade";

export type MarketType = (typeof marketTypes)[number];
export const COLLATERAL_LIST_ORDER = [
  "fxUSD",
  "ETH",
  "WETH",
  "fxAUD",
  "fxEUR",
  "fxGBP",
  "fxJPY",
];

export const PRICE_MEMO_INTERVAL_MS = 100;
export const DEFAULT_SELECTED_PAIR = pairFromString("ETH/USD");
export const MINIMUM_LIQ_RISK_FOR_WARNING = 0.5;
export const MINIMUM_LIQ_RISK_FOR_DANGER = 0.9;
// min width before horizontal srolling
export const POSITIONS_MIN_WIDTH = 560;
// min width before mark price is hidden
export const POSITIONS_THRESHOLD_FOR_MARK_PRICE = 900;
// min width before trade table is stacked
export const POSITIONS_THRESHOLD_FOR_STACKED_TABLE = 780;
// min width before trade table is stacked
export const TRADES_THRESHOLD_FOR_STACKED_TABLE = 680;
// min width before trade table is stacked
export const ACCOUNT_TRANSACTIONS_THRESHOLD_FOR_STACKED_TABLE = 490;
export const ROOT_NODE_ID = "root";
export const FORM_TABSET_ID = "trade";
export const FORM_TAB_COMPONENT = "trade";
export const FORM_BORDER_TAB_CLASSNAME = "form-border-tab";
export const MIN_FORM_WIDTH = 250;
export const DEFAULT_FORM_WIDTH = 325;
export const ACCOUNT_TABSET_ID = "account";
export const ACCOUNT_TAB_COMPONENT = "account";
export const ACCOUNT_BORDER_TAB_CLASSNAME = "account-border-tab";
export const DEFAULT_ACCOUNT_WIDTH = DEFAULT_FORM_WIDTH;
const FRAME_HEADER_HEIGHT = 28;
const ACCOUNT_FRAME_BASE_HEIGHT = 99;
const ACCOUNT_FRAME_ROW_HEIGHT = 21;
const ACCOUNT_FRAME_ROWS = 6;
export const DEFAULT_ACCOUNT_HEIGHT =
  FRAME_HEADER_HEIGHT +
  ACCOUNT_FRAME_BASE_HEIGHT +
  ACCOUNT_FRAME_ROWS * ACCOUNT_FRAME_ROW_HEIGHT;
export const MIN_ACCOUNT_WIDTH = MIN_FORM_WIDTH;
export const CHARTS_TABSET_ID = "charts";
export const CHARTS_TABSET_WEIGHT = 100;
export const CHART_TAB_COMPONENT = "chart";
export const CHART_BORDER_TAB_CLASSNAME = "chart-border-tab";
export const MARKETS_TABSET_ID = "markets";
export const MARKETS_TAB_COMPONENT = "markets";
export const MARKETS_BORDER_TAB_CLASSNAME = "markets-border-tab";
export const MIN_MARKETS_WIDTH = 278;
export const DEFAULT_MARKETS_WIDTH = 325;
export const POSITIONS_TABSET_ID = "positions";
export const POSITIONS_TABSET_WEIGHT = 0;
export const POSITIONS_TAB_COMPONENT = "positions";
export const POSITIONS_BORDER_TAB_CLASSNAME = "positions-border-tab";
export const ORDERS_TABSET_ID = "orders";
export const ORDERS_TAB_COMPONENT = "orders";
export const ORDERS_BORDER_TAB_CLASSNAME = "orders-border-tab";
export const TRADES_TABSET_ID = "trades";
export const TRADES_TAB_COMPONENT = "trades";
export const TRADES_BORDER_TAB_CLASSNAME = "trades-border-tab";
export const ACCOUNT_TRANSACTIONS_TABSET_ID = "transactions";
export const ACCOUNT_TRANSACTIONS_TAB_COMPONENT = "transactions";
export const ACCOUNT_TRANSACTIONS_BORDER_TAB_CLASSNAME =
  "transactions-border-tab";
export const CHAT_TABSET_ID = "chat";
export const CHAT_TAB_COMPONENT = "chat";
export const CHAT_BORDER_TAB_CLASSNAME = "chat-border-tab";
export const MIN_CHAT_WIDTH = 300;
export const PORTFOLIO_TABSET_ID = "portfolio";
export const PORTFOLIO_TABSET_WEIGHT = 0;
export const MIN_PORTFOLIO_TABSET_WIDTH = 150;
export const PORTFOLIO_TAB_COMPONENT = "portfolio";
export const PORTFOLIO_BORDER_TAB_CLASSNAME = "portfolio-border-tab";
export const BORDER_RIGHT_MARKETS_TAB_ID = `right-${MARKETS_TABSET_ID}`;
export const BORDER_RIGHT_PORTFOLIO_TAB_ID = `right-${PORTFOLIO_TABSET_ID}`;
export const BORDER_RIGHT_FORM_TAB_ID = `right-${FORM_TABSET_ID}`;
export const BORDER_RIGHT_ACCOUNT_TAB_ID = `right-${ACCOUNT_TABSET_ID}`;
export const BORDER_RIGHT_POSITIONS_TAB_ID = `right-${POSITIONS_TABSET_ID}`;
export const BORDER_RIGHT_ORDERS_TAB_ID = `right-${ORDERS_TABSET_ID}`;
export const BORDER_RIGHT_TRADES_TAB_ID = `right-${TRADES_TABSET_ID}`;
export const BORDER_RIGHT_ACCOUNT_TRANSACTIONS_TAB_ID = `right-${ACCOUNT_TRANSACTIONS_TABSET_ID}`;
export const BORDER_RIGHT_CHAT_TAB_ID = `right-${CHAT_TABSET_ID}`;
export const BORDER_RIGHT_RESET_TAB_ID = "right-reset";
export const RESET_TAB_COMPONENT = "reset";
export const RESET_BORDER_TAB_CLASSNAME = "reset-border-tab";
export const ENABLE_FLOAT = false;
export const ENABLE_TAB_CLOSE = true;
export const ENABLE_BORDER_TAB_CLOSE = true;
export const ENABLE_TABSET_CLOSE = true;
export const MINIMISED_TABSET_HEIGHT = 27.5; // allows for tabs to remain visible
export const MINIMISED_TABSET_WIDTH = 0; // allows for resize button to remain visible
export const DEFAULT_MIN_WIDTH = Math.max(
  MIN_FORM_WIDTH,
  MIN_ACCOUNT_WIDTH,
  MIN_MARKETS_WIDTH,
  MIN_CHAT_WIDTH,
);
export const STANDARD_POSITIONS_TABSET_HEIGHT = 200;
export const DEFAULT_POSITIONS_TABSET_HEIGHT = 200;
export const DEFAULT_TAB_MARKET = "ETH/USD";
export const NEW_CHART_TAB_ID = "new-chart";
export const NEW_CHART_TAB = {
  type: "tab",
  id: NEW_CHART_TAB_ID,
  name: "...",
  className: "new-chart-tab",
  component: NEW_CHART_TAB_ID,
  enableDrag: false,
  enableClose: false,
  enableRename: false,
};
export const PORTFOLIO_TABSET_HEIGHT = 78 + FRAME_HEADER_HEIGHT;
export const SPLITTER_WIDTH = 4;
export const KEY_TAB_COMPONENTS = [
  MARKETS_TAB_COMPONENT,
  FORM_TAB_COMPONENT,
  ACCOUNT_TAB_COMPONENT,
];
export const KEY_TABSET_IDS = [
  MARKETS_TABSET_ID,
  FORM_TABSET_ID,
  ACCOUNT_TABSET_ID,
];
export const DEFAULT_TRADE_DEPOSIT_TOKEN = "fxUSD";
export const TRADE_DEPOSIT_TOKENS = [
  "fxUSD",
  "DAI",
  "USDC",
  "USDC.e",
  "FRAX",
  "USDT",
];
export const TRADE_WITHDRAW_TOKENS = [
  "fxUSD",
  "DAI",
  "USDC",
  "USDC.e",
  "FRAX",
  "USDT",
];
export const TRADE_LP_DEFAULT_CURRENCY_SYMBOL = "USD";
export const TRADES_DISPLAY_QUANTITY_INCREMENT = 10;
export const DEFAULT_TRADES_SORT: Sorting = {
  by: "timestamp",
  direction: "asc",
};
export const TRANSACTIONS_DISPLAY_QUANTITY_INCREMENT = 10;
export const DEFAULT_TRANSACTIONS_SORT: Sorting = {
  by: "timestamp",
  direction: "asc",
};
export const WIDTH_OF_TRADE_MODAL = 450;
export const WIDTH_OF_TRADE_CONFIRM_REDUCE_MODALS = 520;
export const SHOULD_SHOW_SPREAD_FEE = false;
export const MAX_WIDTH_BEFORE_POSITIONS_HIDDEN = 1600;
export const ALLOW_MULTIPLE_CHART_TABS_FOR_PAIR = true;
export const MARKETS_RESPONSIVE_WIDTH = 460;
export const MARKETS_MIN_WIDTH_BEFORE_SCROLL = 230;
export const MARKET_COLUMN_WIDTH = 138;
// Allow for "fave" icon on desktop.
export const MARKET_COLUMN_WIDTH_MOBILE = MARKET_COLUMN_WIDTH;
export const MARKET_COLUMN_WIDTH_DESKTOP = MARKET_COLUMN_WIDTH + 25.75;
export const MARKETS_CONTAINER_CLASSNAME = "trade-markets-container";
export const HIDE_BUY_SELL_BUTTONS_CLASSNAME = "hide-buy-sell-buttons";
export const THRESHOLD_FOR_SHORT_CUSTOM_UNIT = 244;
export const HIDE_PRICE_CHANGE_ARROWS = true;
export const PERIODIC_FEES_DISPLAY_DECIMALS = 4;
export const TRADE_LEADERBOARD_ACCOUNTS = [32, 33, 34, 35, 36, 37, 38, 39].join(
  ",",
);
export const PRICE_IMPACT_DECIMALS = 4;
export const TRADE_CHART_BUY_SELL_BUTTONS_DRAG_HANDLE_CLASS_PREFIX = "drag";
// The threshold for the chart legend prices to be under
// the symbol details so the buy/sell buttons need to be lower.
export const TRADE_CHART_WIDTH_THRESHOLD_FOR_CHART_LEGEND_WRAP = 756;
export const TRADE_MAINTENANCE_MESSAGE =
  "handlePerps v2 is under maintenance. Some functionalities may not be available. Please visit our Discord or X feed for more information.";
// TODO: https://github.com/handle-fi/handle-react/issues/3984
// Move as many of these as possible to a server side config JSON.
export const TIPR_ACTIVE = true;
export const TIPR_DOC_LINK =
  "https://docs.handle.fi/rewards/active/trader-incentive-pool-rewards-tipr";
export const FLI_DOC_LINK =
  "https://docs.handle.fi/rewards/active/forex-liquidity-initiative-fli";
export const TIPR_MINIMUM_ELIGIBLE_TRADE_VALUE_LPC = utils.parseEther("500");
export const TIPR_ICON: [IconPrefix, IconName] = ["far", "trophy-star"];
export const TIPR_NOTIFICATION_TIMEOUT_IN_SECONDS = 10;
export const TIPR_NOTIFICATION_POSITION: Notify["position"] = "top-right";
export const TIPR_EXPLOSION_DURATION_IN_MS = 5000;
export const TIPR_EXPLOSION_INTERVAL_DELAY_IN_MS = 500;
export const TIPR_WIN_ICON: { prefix: IconPrefix; name: IconName } = {
  prefix: "far",
  name: "trophy-star",
};
export const FLI_ACTIVE = false;
export const DEFAULT_POSITION_WITH_DRAWING_TOOLBAR_OPEN = 67;
export const AMOUNT_TO_MOVE_RIGHT_IF_TOOLBAR_OPENED = 47;
export const DEFAULT_MOBILE_FAVOURITE_CHARTS: Pair[] = [
  "ETH/USD",
  "BTC/USD",
].map(p => pairFromString(p));
export const MARKET_CHOICE_FAVOURITE_MARKET_BUTTON_ICON: IconName = "plus";
export const MAX_MOBILE_FAVOURITE_CHARTS = 5;
