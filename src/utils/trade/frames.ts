import {
  Action,
  Actions,
  BorderNode,
  DockLocation,
  IJsonModel,
  IJsonTabNode,
  Layout,
  Model,
  TabNode,
  TabSetNode,
  Node,
  IJsonRowNode,
  IJsonTabSetNode,
} from "flexlayout-react";
import {
  MARKETS_TAB_COMPONENT,
  MIN_MARKETS_WIDTH,
  FORM_TAB_COMPONENT,
  MIN_FORM_WIDTH,
  CHAT_TAB_COMPONENT,
  MIN_CHAT_WIDTH,
  MARKETS_BORDER_TAB_CLASSNAME,
  FORM_BORDER_TAB_CLASSNAME,
  CHART_BORDER_TAB_CLASSNAME,
  POSITIONS_BORDER_TAB_CLASSNAME,
  ORDERS_BORDER_TAB_CLASSNAME,
  TRADES_BORDER_TAB_CLASSNAME,
  RESET_BORDER_TAB_CLASSNAME,
  CHAT_BORDER_TAB_CLASSNAME,
  NEW_CHART_TAB,
  MINIMISED_TABSET_WIDTH,
  FORM_TABSET_ID,
  MINIMISED_TABSET_HEIGHT,
  STANDARD_POSITIONS_TABSET_HEIGHT,
  MARKETS_TABSET_ID,
  ENABLE_TAB_CLOSE,
  ENABLE_FLOAT,
  CHARTS_TABSET_ID,
  DEFAULT_MIN_WIDTH,
  ROOT_NODE_ID,
  CHAT_TABSET_ID,
  NEW_CHART_TAB_ID,
  ACCOUNT_BORDER_TAB_CLASSNAME,
  ACCOUNT_TRANSACTIONS_BORDER_TAB_CLASSNAME,
  DEFAULT_MARKETS_WIDTH,
  DEFAULT_FORM_WIDTH,
  POSITIONS_TABSET_ID,
  PORTFOLIO_BORDER_TAB_CLASSNAME,
  PORTFOLIO_TABSET_ID,
  PORTFOLIO_TAB_COMPONENT,
  PORTFOLIO_TABSET_HEIGHT,
  PORTFOLIO_TABSET_WEIGHT,
  ACCOUNT_TAB_COMPONENT,
  MIN_ACCOUNT_WIDTH,
  ACCOUNT_TABSET_ID,
  DEFAULT_ACCOUNT_WIDTH,
  MARKETS_CONTAINER_CLASSNAME,
  HIDE_BUY_SELL_BUTTONS_CLASSNAME,
  POSITIONS_TAB_COMPONENT,
  ACCOUNT_TRANSACTIONS_TAB_COMPONENT,
  TRADES_TAB_COMPONENT,
  TRADES_TABSET_ID,
  CHART_TAB_COMPONENT,
  KEY_TAB_COMPONENTS,
  MIN_PORTFOLIO_TABSET_WIDTH,
} from "../../config/trade";
import { uniqueId } from "../general";
import {
  FORM_TABSET,
  MARKETS_TABSET,
  TabsetNode,
} from "../../context/TradeLayout";
import { TranslationMap } from "src/types/translation";
import {
  tradeFrameTabsetDefaultHeightLocalStorage,
  tradeFrameTabsetClosedLocalStorage,
  tradeFrameTabsetResizedLocalStorage,
} from "../local-storage";
import { Dispatch, MutableRefObject, SetStateAction } from "react";

export const getNewLocation = (location: string) => {
  switch (location) {
    case "left":
      return DockLocation.LEFT;
    case "right":
      return DockLocation.RIGHT;
    case "top":
      return DockLocation.TOP;
    default:
      return DockLocation.BOTTOM;
  }
};

export const getMinWidth = (component: string) => {
  switch (component) {
    case MARKETS_TAB_COMPONENT:
      return MIN_MARKETS_WIDTH;
    case FORM_TAB_COMPONENT:
      return MIN_FORM_WIDTH;
    case ACCOUNT_TAB_COMPONENT:
      return MIN_ACCOUNT_WIDTH;
    case CHAT_TAB_COMPONENT:
      return MIN_CHAT_WIDTH;
    default:
      return DEFAULT_MIN_WIDTH;
  }
};

export const getDefaultWidth = (component: string) => {
  switch (component) {
    case MARKETS_TAB_COMPONENT:
      return DEFAULT_MARKETS_WIDTH;
    case FORM_TAB_COMPONENT:
      return DEFAULT_FORM_WIDTH;
    case ACCOUNT_TAB_COMPONENT:
      return DEFAULT_ACCOUNT_WIDTH;
    default:
      return DEFAULT_MIN_WIDTH;
  }
};

export const getMinWidthById = (id: string) => {
  switch (id) {
    case MARKETS_TABSET_ID:
      return MIN_MARKETS_WIDTH;
    case FORM_TABSET_ID:
      return MIN_FORM_WIDTH;
    case ACCOUNT_TABSET_ID:
      return MIN_ACCOUNT_WIDTH;
    case CHAT_TABSET_ID:
      return MIN_CHAT_WIDTH;
    default:
      return DEFAULT_MIN_WIDTH;
  }
};

export const getDefaultWidthById = (id: string) => {
  switch (id) {
    case MARKETS_TABSET_ID:
      return DEFAULT_MARKETS_WIDTH;
    case FORM_TABSET_ID:
      return DEFAULT_FORM_WIDTH;
    case ACCOUNT_TABSET_ID:
      return DEFAULT_ACCOUNT_WIDTH;
    default:
      return DEFAULT_MIN_WIDTH;
  }
};

const FLEXLAYOUT_CLASS_SUFFIXES_TO_EXCLUDE_FROM_TABINDEX = [
  "splitter",
  "tabset",
  "tab",
  "tab_button",
  "border",
  "tabset_tabbar_outer",
];

const FLEXLAYOUT_SELECTOR_QUERY_STRING =
  FLEXLAYOUT_CLASS_SUFFIXES_TO_EXCLUDE_FROM_TABINDEX.map(
    (suffix: string) => `:not(.flexlayout__${suffix})`,
  ).join("");

export const getCurrentPairs = (layout: IJsonModel): CurrentChartPairs => {
  const tabNames: CurrentChartPairs = [];
  layout.layout.children.map((child: IJsonRowNode | IJsonTabSetNode) => {
    if (child.type === "tabset") {
      child.children.map((tab: IJsonTabNode) => {
        if (tab.id && tab.name && isChartTab(tab.id)) {
          tabNames.push({ name: tab.name, id: tab.id });
        }
      });
    }
    if (child.type === "row") {
      child.children.map((tab: IJsonRowNode | IJsonTabSetNode) => {
        if (tab.type === "tabset") {
          if (tab.id && tab.name && isChartTab(tab.id)) {
            tabNames.push({ name: tab.name, id: tab.id });
          }
          tab.children.map((tab: IJsonTabNode) => {
            if (tab.id && tab.name && isChartTab(tab.id)) {
              tabNames.push({ name: tab.name, id: tab.id });
            }
          });
        }
        if (tab.type === "row") {
          tab.children.map((tab: IJsonRowNode | IJsonTabSetNode) => {
            tab.children.map((tab: IJsonTabNode) => {
              if (tab.id && tab.name && isChartTab(tab.id)) {
                tabNames.push({ name: tab.name, id: tab.id });
              }
            });
          });
        }
      });
    }
  });
  return tabNames;
};

export const doesTabsetExist = (model: Model, tabset: string) => {
  return !!model.getNodeById(tabset);
};

export const chartTabIxToSelect = (layout: IJsonModel, node: any): number => {
  const currentChartTabPairs = getCurrentPairs(layout);
  const deletedChartTabIx = currentChartTabPairs.findIndex(
    chart => chart.id === node,
  );
  if (currentChartTabPairs.length === 1 || deletedChartTabIx === -1) {
    return 0;
  }
  if (deletedChartTabIx === 0) {
    return 1;
  }
  return deletedChartTabIx - 1;
};

export const addClassesAndTooltips = (
  marketsTabsetExists: boolean,
  formTabsetExists: boolean,
) => {
  // Adjusts tabindexes to necessary components.
  document.querySelectorAll(`iframe[id*="tradingview"]`).forEach(element => {
    element.setAttribute("tabindex", "-1");
  });

  document.querySelectorAll(".new-chart-tab").forEach(element => {
    element.setAttribute("tabindex", "-1");
  });

  document
    .querySelectorAll(
      `[data-layout-path*="/"]${FLEXLAYOUT_SELECTOR_QUERY_STRING}`,
    )
    .forEach(element => {
      const tabIndex = element.getAttribute("tabindex");
      if (tabIndex !== "-99") {
        element.setAttribute("tabindex", "0");
      }
    });

  // Replace all tooltips with handle tooltips
  // because the package doesn't support custom tooltips.
  document
    .querySelectorAll(".flexlayout__tab_toolbar_button-close")
    .forEach(button => {
      if (!button.getAttribute("title")) {
        return;
      }
      button.removeAttribute("title");
      button.setAttribute("uk-tooltip", "title: close tabset; pos: bottom;");
    });
  document
    .querySelectorAll(".flexlayout__tab_toolbar_button-min")
    .forEach(button => {
      if (!button.getAttribute("title")) {
        return;
      }
      button.removeAttribute("title");
      button.setAttribute("uk-tooltip", "title: full screen; pos: bottom;");
    });
  document
    .querySelectorAll(".flexlayout__tab_toolbar_button-max")
    .forEach(button => {
      if (!button.getAttribute("title")) {
        return;
      }
      button.removeAttribute("title");
      button.setAttribute(
        "uk-tooltip",
        "title: exit full screen; pos: bottom;",
      );
    });

  document
    .querySelectorAll(
      `.flexlayout__border_button_right.${MARKETS_BORDER_TAB_CLASSNAME}`,
    )
    .forEach(button => {
      button.setAttribute(
        "uk-tooltip",
        `title: ${
          marketsTabsetExists ? "" : "click to reinstate markets tab or "
        }drag to add new markets tab; pos: bottom;`,
      );
    });

  document
    .querySelectorAll(
      `.flexlayout__border_button_right.${FORM_BORDER_TAB_CLASSNAME}`,
    )
    .forEach(button => {
      button.setAttribute(
        "uk-tooltip",
        `title: ${
          formTabsetExists ? "" : "click to reinstate trade tab or "
        }drag to add new trade tab; pos: bottom;`,
      );
    });

  document
    .querySelectorAll(
      `.flexlayout__border_button_right.${ACCOUNT_BORDER_TAB_CLASSNAME}`,
    )
    .forEach(button => {
      button.setAttribute(
        "uk-tooltip",
        "title: drag to add new account tab; pos: bottom;",
      );
    });

  document
    .querySelectorAll(
      `.flexlayout__border_button_right.${PORTFOLIO_BORDER_TAB_CLASSNAME}`,
    )
    .forEach(button => {
      button.setAttribute(
        "uk-tooltip",
        "title: drag to add new portfolio tab; pos: bottom;",
      );
    });

  document
    .querySelectorAll(
      `.flexlayout__border_button_right.${CHART_BORDER_TAB_CLASSNAME}`,
    )
    .forEach(button => {
      button.setAttribute(
        "uk-tooltip",
        "title: click to add new chart tab; pos: bottom;",
      );
    });

  document
    .querySelectorAll(
      `.flexlayout__border_button_right.${POSITIONS_BORDER_TAB_CLASSNAME}`,
    )
    .forEach(button => {
      button.setAttribute(
        "uk-tooltip",
        "title: drag button to add new positions tab; pos: bottom;",
      );
    });

  document
    .querySelectorAll(
      `.flexlayout__border_button_right.${ORDERS_BORDER_TAB_CLASSNAME}`,
    )
    .forEach(button => {
      button.setAttribute(
        "uk-tooltip",
        "title: drag button to add new orders tab; pos: bottom;",
      );
    });

  document
    .querySelectorAll(
      `.flexlayout__border_button_right.${TRADES_BORDER_TAB_CLASSNAME}`,
    )
    .forEach(button => {
      button.setAttribute(
        "uk-tooltip",
        "title: drag button to add new trades tab; pos: bottom;",
      );
    });

  document
    .querySelectorAll(
      `.flexlayout__border_button_right.${ACCOUNT_TRANSACTIONS_BORDER_TAB_CLASSNAME}`,
    )
    .forEach(button => {
      button.setAttribute(
        "uk-tooltip",
        "title: drag button to add new transactions tab; pos: bottom;",
      );
    });

  document
    .querySelectorAll(
      `.flexlayout__border_button_right.${RESET_BORDER_TAB_CLASSNAME}`,
    )
    .forEach(button => {
      button.setAttribute(
        "uk-tooltip",
        "title: click to reset layout; pos: bottom;",
      );
    });

  document
    .querySelectorAll(
      `.flexlayout__border_button_right.${CHAT_BORDER_TAB_CLASSNAME}`,
    )
    .forEach(button => {
      button.setAttribute(
        "uk-tooltip",
        "title: drag button to add chat tab; pos: bottom;",
      );
    });

  document.querySelectorAll(".flexlayout__tab_button_trailing").forEach(div => {
    if (!div.getAttribute("title")) {
      return;
    }
    div.removeAttribute("title");
    div.setAttribute("uk-tooltip", "title: close tab; pos: bottom;");
  });

  document.querySelectorAll(`.${NEW_CHART_TAB.className}`).forEach(div => {
    if (div.getAttribute("title")) {
      div.removeAttribute("title");
    }
    div.setAttribute("uk-tooltip", "title: add new chart; pos: bottom;");
  });
};

const changeResizeButtonClass = (
  tabset: string,
  newSize: number,
  threshold: number,
) => {
  if (document.getElementsByClassName(`${tabset}-resize`)[0]) {
    if (newSize > threshold) {
      document
        .getElementsByClassName(`${tabset}-resize`)[0]
        .classList.remove("minimised");
    } else {
      document
        .getElementsByClassName(`${tabset}-resize`)[0]
        .classList.add("minimised");
    }
  }
};

const getTabsetToResize = (
  currentTabset: string,
  node: TabSetNode | BorderNode,
) => {
  // If the parent node is root then the tabset is on its own
  // so my be resized as as is.
  // If it is not then it has had another tab added
  // so resize the parent node.
  return node?.getParent()?.getId() === ROOT_NODE_ID
    ? currentTabset
    : node.getParent()?.getId() || currentTabset;
};

export const resizeMarketsTabSetWidth = (
  model: Model,
  setModel: (model: Model) => void,
  setLayout: (layout: IJsonModel) => void,
  node: TabSetNode | BorderNode,
  hideOrShow?: "hide" | "show",
  shouldHideBuySellButtons?: boolean,
) => {
  const currentTabset = node?.getId();
  if (!currentTabset) {
    return;
  }
  const tabset = getTabsetToResize(currentTabset, node);
  if (!tabset) {
    return;
  }

  document.querySelectorAll(`.${MARKETS_CONTAINER_CLASSNAME}`).forEach(div => {
    const method = shouldHideBuySellButtons ? "add" : "remove";
    div.classList[method](HIDE_BUY_SELL_BUTTONS_CLASSNAME);
  });

  resizeTabSetWidth(model, setModel, setLayout, node, hideOrShow);
};

// Toggles or forces the trade or markets tabset
// between zero width or min. width.
export const resizeTabSetWidth = (
  model: Model,
  setModel: (model: Model) => void,
  setLayout: (layout: IJsonModel) => void,
  node: TabSetNode | BorderNode,
  hideOrShow?: "hide" | "show",
) => {
  const currentTabset = node?.getId();
  if (!currentTabset) {
    return;
  }
  const tabset = getTabsetToResize(currentTabset, node);
  if (!tabset) {
    return;
  }

  const tradeFrameTabsetClosedLs = tradeFrameTabsetClosedLocalStorage(tabset);
  const tradeFrameTabsetResizedLs = tradeFrameTabsetResizedLocalStorage(tabset);
  const hasTradeFrameTabsetBeenManuallyChanged =
    tradeFrameTabsetClosedLs.get() !== undefined ||
    tradeFrameTabsetResizedLs.get() !== undefined;
  // If this is an auto-hide because of screen width,
  // do nothing if the tabset has been manually opened/closed.
  if (hideOrShow === "hide" && hasTradeFrameTabsetBeenManuallyChanged) {
    return;
  }

  const currentWidth = node.getRect().width;
  const defaultWidth = getDefaultWidthById(currentTabset);
  const newWidth = () => {
    if (hideOrShow === "hide") {
      return MINIMISED_TABSET_WIDTH;
    }
    if (hideOrShow === "show") {
      return defaultWidth;
    }
    if (currentWidth > MINIMISED_TABSET_WIDTH) {
      return MINIMISED_TABSET_WIDTH;
    }
    return defaultWidth;
  };
  model.doAction(
    Actions.updateNodeAttributes(tabset, {
      width: newWidth(),
    }),
  );
  changeResizeButtonClass(currentTabset, newWidth(), MINIMISED_TABSET_WIDTH);
  const modelAsJson = model.toJson();
  setModel(Model.fromJson(modelAsJson));
  setLayout(modelAsJson);
  tradeFrameTabsetClosedLs.set(newWidth() === MINIMISED_TABSET_WIDTH);
};

export const resizePositionsTabSet = (
  model: Model,
  setModel: (model: Model) => void,
  setLayout: (layout: IJsonModel) => void,
  node: TabSetNode | BorderNode,
  hideOrShow?: "hide" | "show",
) => {
  const tabset = node?.getId();
  if (!tabset) {
    return;
  }

  const tradeFrameTabsetClosedLs = tradeFrameTabsetClosedLocalStorage(tabset);
  // If this is an auto-hide because of screen width,
  // do nothing if the tabset has been manually opened/closed.
  if (hideOrShow === "hide" && tradeFrameTabsetClosedLs.get() !== undefined) {
    return;
  }
  const currentHeight = node.getRect().height;
  const newHeight = () => {
    if (hideOrShow === "hide") {
      return MINIMISED_TABSET_HEIGHT;
    }
    if (hideOrShow === "show") {
      return STANDARD_POSITIONS_TABSET_HEIGHT;
    }
    if (currentHeight > MINIMISED_TABSET_HEIGHT) {
      return MINIMISED_TABSET_HEIGHT;
    }
    return STANDARD_POSITIONS_TABSET_HEIGHT;
  };
  model.doAction(
    Actions.updateNodeAttributes(tabset, {
      height: newHeight(),
    }),
  );
  changeResizeButtonClass(tabset, newHeight(), MINIMISED_TABSET_HEIGHT);
  const modelAsJson = model.toJson();
  setModel(Model.fromJson(modelAsJson));
  setLayout(modelAsJson);
  tradeFrameTabsetClosedLs.set(newHeight() === MINIMISED_TABSET_HEIGHT);
};

export const resetTabHeight = (
  model: Model,
  setModel: (model: Model) => void,
  setLayout: (layout: IJsonModel) => void,
  node: TabNode,
  height: number,
) => {
  const tab = node?.getId();
  if (!tab) {
    return;
  }

  model.doAction(
    Actions.updateNodeAttributes(tab, {
      height,
    }),
  );
  const modelAsJson = model.toJson();
  setModel(Model.fromJson(modelAsJson));
  setLayout(modelAsJson);
};

const getTabsetId = (component: string) => {
  switch (component) {
    case MARKETS_TAB_COMPONENT:
      return MARKETS_TABSET_ID;
    case FORM_TAB_COMPONENT:
      return FORM_TABSET_ID;
    case ACCOUNT_TAB_COMPONENT:
      return PORTFOLIO_TABSET_ID;
    case CHART_TAB_COMPONENT:
      return CHARTS_TABSET_ID;
    case CHAT_TAB_COMPONENT:
      return CHAT_TABSET_ID;
    case PORTFOLIO_TAB_COMPONENT:
      return PORTFOLIO_TABSET_ID;
    case POSITIONS_TAB_COMPONENT:
      return POSITIONS_TABSET_ID;
    case ACCOUNT_TRANSACTIONS_TAB_COMPONENT:
      return ACCOUNT_TABSET_ID;
    case TRADES_TAB_COMPONENT:
      return TRADES_TABSET_ID;
    default:
      return "";
  }
};

// Create/reinstate a tab(set) at the specified location.
export const dockTabToWindow = (
  model: Model,
  setModel: Dispatch<SetStateAction<Model>>,
  setLayout: Dispatch<SetStateAction<IJsonModel>>,
  layoutRef: MutableRefObject<Layout | null>,
  t: TranslationMap,
  component: string,
  location: string,
  toNode: string,
  move = false,
  fromNodeId?: string,
) => {
  const newModel = model;
  const newLocation = getNewLocation(location);
  const newComponent = component;
  const tabsetId = getTabsetId(newComponent);
  const isTabsetMarketsOrForm =
    tabsetId === MARKETS_TABSET_ID || tabsetId === FORM_TABSET_ID;

  // If clicking on markets or form button and
  // tab(set) already exists, don't create a new one.
  if (!move && isTabsetMarketsOrForm && doesTabsetExist(model, tabsetId)) {
    return;
  }

  // If moving tab(set),
  // delete original tab and
  // add to dragged location.
  if (move) {
    if (fromNodeId) {
      newModel.doAction(Actions.deleteTab(fromNodeId));
    }
    const newId = `${tabsetId}-${uniqueId(5)}`;
    const newNode = newModel.doAction(
      Actions.addNode(
        {
          type: "tab",
          id: newId,
          component: component,
          name: component,
          enableClose: ENABLE_TAB_CLOSE,
          enableFloat: ENABLE_FLOAT,
        },
        toNode,
        newLocation,
        0,
      ),
    );

    if (newNode) {
      // If the node is moved then the attributes
      // of the node or the relevant antecedent
      // need to be set to the correct dimensions.
      updateDraggedFrame(newModel, newId, newComponent, newNode);
    }

    const newModelAsJson = newModel.toJson();
    setModel(Model.fromJson(newModelAsJson));
    setLayout(newModelAsJson);
    return;
  }

  // Otherwise reinstate markets or form tabset
  // in original location.
  if (layoutRef?.current) {
    const modelAsJson = model.toJson();
    const newModelAsJson = modelAsJson;
    const children = newModelAsJson.layout.children;
    const newChildren: TabsetNode[] = [];
    if (newComponent === MARKETS_TAB_COMPONENT) {
      newChildren.push(MARKETS_TABSET(t));
    }
    newChildren.push(...children);
    if (newComponent === FORM_TAB_COMPONENT) {
      newChildren.push(FORM_TABSET(t, false));
    }
    newModelAsJson.layout.children = newChildren;
    setModel(Model.fromJson(newModelAsJson));
    setLayout(newModelAsJson);
  }
};

// Add tab to the dragged to tabset.
export const addTabToTabset = (
  model: Model,
  setModel: (model: Model) => void,
  setLayout: (layout: IJsonModel) => void,
  action: Action,
  t: TranslationMap,
) => {
  const newModel = model;
  const component = action.data.fromNode.split("-")[1];
  const newNode = newModel.doAction(
    Actions.addNode(
      {
        type: "tab",
        component: component,
        name: component === "trades" ? t.tradeHistory : component,
        enableClose: ENABLE_TAB_CLOSE,
        enableFloat: ENABLE_FLOAT,
      },
      action.data.toNode,
      DockLocation.CENTER,
      action.data.index,
    ),
  );
  const newComponent = component;
  const tabsetId = getTabsetId(newComponent);
  const defaultWidth = getDefaultWidth(newComponent);
  const isTabsetMarketsOrForm =
    tabsetId === MARKETS_TABSET_ID || tabsetId === FORM_TABSET_ID;
  if (newNode) {
    // If the node is portfolio dragged from the border
    // the we need to set it's parent tabset
    // to the correct dimensions.
    const parentId = newNode.getParent()?.getId();
    if (parentId) {
      if (isTabsetMarketsOrForm) {
        newModel.doAction(
          Actions.updateNodeAttributes(parentId, {
            width: defaultWidth,
            minWidth: defaultWidth,
          }),
        );
      }
    }
  }

  const newModelAsJson = newModel.toJson();
  setModel(Model.fromJson(newModelAsJson));
  setLayout(newModelAsJson);
};

export const getChartTabClassName = (pairString: string) =>
  `${pairString.replace("/", "-").toLowerCase()}-tab`;

export const isChartTab = (tabNode: string) => tabNode.split("_").length === 3;

export type CurrentChartPairs = {
  name: string;
  id: string;
}[];

export const findTab = (pairs: CurrentChartPairs, pair: string) =>
  pairs.find(tab => tab.name === pair);

export const getNewTabId = (pairs: CurrentChartPairs, pair: string) => {
  const tabsForPair = pairs.filter(
    tab =>
      tab.id.includes(pair.split("/")[0]) &&
      tab.id.includes(pair.split("/")[1]),
  );
  return `${pair.replace("/", "_")}_${tabsForPair.length + 1}`;
};

export const checkAndSetResizeTabsets = (node: TabSetNode) => {
  // If the parent node is root then use the tabset node.
  // If it is not then it contains other tab(s) so use the parent node.
  const parentTabset =
    node?.getParent()?.getId() === ROOT_NODE_ID
      ? node
      : node.getParent() || node;

  // Check if the tabset has been resized deliberately
  // so is non-default width (markets/form)
  // or non-standard height (positions)) and
  // set a resized LS var if so.
  const isMarketsOrFormTabset =
    node.getId() === MARKETS_TABSET_ID || node.getId() === FORM_TABSET_ID;
  if (isMarketsOrFormTabset) {
    const nextParentTabsetSize = parentTabset.getRect();
    const isDefaultWidth =
      (node.getId() === MARKETS_TABSET_ID &&
        nextParentTabsetSize?.width === DEFAULT_MARKETS_WIDTH) ||
      (node.getId() === FORM_TABSET_ID &&
        nextParentTabsetSize?.width === DEFAULT_FORM_WIDTH);
    if (!isDefaultWidth) {
      tradeFrameTabsetResizedLocalStorage(parentTabset.getId()).set(true);
    }
    return;
  }

  if (node.getId() !== POSITIONS_TABSET_ID) {
    return;
  }

  const tabsetHeight = node.getRect().height;
  const defaultPositionsTabsetHeight =
    tradeFrameTabsetDefaultHeightLocalStorage(POSITIONS_TABSET_ID)?.get();
  const isDefaultHeight =
    !defaultPositionsTabsetHeight ||
    (tabsetHeight >= defaultPositionsTabsetHeight - 1 &&
      tabsetHeight <= defaultPositionsTabsetHeight + 1);
  if (!isDefaultHeight) {
    tradeFrameTabsetResizedLocalStorage(node.getId()).set(true);
  }
};

// This explores up the frames tree to find the highest
// antecendent node that is not the root.
export const getMasterNode = (node: TabSetNode) => {
  const parentNode = node.getParent();
  if (parentNode?.getId() === ROOT_NODE_ID) {
    return node;
  }
  const grandparentNode = parentNode?.getParent();
  if (grandparentNode?.getId() === ROOT_NODE_ID) {
    return parentNode;
  }
  const greatGrandparentNode = grandparentNode?.getParent();
  if (greatGrandparentNode?.getId() === ROOT_NODE_ID) {
    return grandparentNode;
  }
  return greatGrandparentNode;
};

export const hasTabset = (id: string, node?: Node) => {
  return (
    node && node?.getChildren().findIndex(child => child.getId() === id) > -1
  );
};

type PortfolioFrameAttributesToUpdate = {
  id?: string;
  height: number;
  weight: number;
  minHeight: number;
  minWidth: number;
};

export const updatePortfolioFrameAttributes = (
  model: Model,
  id: string,
  shouldUpdateId?: boolean,
) => {
  const updates: PortfolioFrameAttributesToUpdate = {
    height: PORTFOLIO_TABSET_HEIGHT,
    weight: PORTFOLIO_TABSET_WEIGHT,
    minHeight: PORTFOLIO_TABSET_HEIGHT,
    minWidth: MIN_PORTFOLIO_TABSET_WIDTH,
  };
  if (shouldUpdateId && !model.getNodeById(PORTFOLIO_TABSET_ID)) {
    updates.id = PORTFOLIO_TABSET_ID;
  }
  model.doAction(Actions.updateNodeAttributes(id, updates));
};

export const updateMovedFrames = (
  model: Model,
  tabset: TabSetNode,
  hasKeyFrameChanged: boolean,
) => {
  const masterNode = getMasterNode(tabset);
  const isMarketsTabset = hasTabset(MARKETS_TABSET_ID, masterNode);
  const isFormTabset = hasTabset(FORM_TABSET_ID, masterNode);
  const isAccountTabset = hasTabset(ACCOUNT_TABSET_ID, masterNode);
  if (masterNode && (isMarketsTabset || isFormTabset || isAccountTabset)) {
    const tabsetToMimic = () => {
      if (isMarketsTabset) {
        return MARKETS_TABSET_ID;
      }
      if (isFormTabset) {
        return FORM_TABSET_ID;
      }
      if (isAccountTabset) {
        return ACCOUNT_TABSET_ID;
      }
      return masterNode.getId();
    };
    model.doAction(
      Actions.updateNodeAttributes(masterNode.getId(), {
        width: getDefaultWidthById(tabsetToMimic()),
        minWidth: getMinWidthById(tabsetToMimic()),
      }),
    );
  }

  // Caters for any pre-sized tab being moved
  // to ensure the tabset is set to the correct size.
  const changedComponent = (tabset.getChildren()[0] as TabNode).getComponent();
  if (
    hasKeyFrameChanged &&
    changedComponent &&
    KEY_TAB_COMPONENTS.includes(changedComponent)
  ) {
    model.doAction(
      Actions.updateNodeAttributes(tabset.getId(), {
        width: getDefaultWidth(changedComponent),
        minWidth: getMinWidth(changedComponent),
      }),
    );
  }
};

export const updateDraggedFrame = (
  model: Model,
  tabsetId: string,
  component: string,
  node: Node,
) => {
  const defaultWidth = getDefaultWidth(component);
  const isTabsetMarketsOrForm =
    tabsetId === MARKETS_TABSET_ID || tabsetId === FORM_TABSET_ID;
  const parentId = node.getParent()?.getId();
  if (!parentId) {
    return;
  }

  if (component === PORTFOLIO_TAB_COMPONENT) {
    updatePortfolioFrameAttributes(model, parentId);
  }

  if (isTabsetMarketsOrForm) {
    model.doAction(
      Actions.updateNodeAttributes(
        node.getParent()?.getParent()?.getId() ?? "",
        {
          width: defaultWidth,
          minWidth: defaultWidth,
        },
      ),
    );
  }

  if (KEY_TAB_COMPONENTS.includes(component)) {
    model.doAction(
      Actions.updateNodeAttributes(node.getParent()?.getId() ?? "", {
        width: defaultWidth,
        minWidth: defaultWidth,
      }),
    );
  }
};

export const getComponentFromId = (id: string, model: Model) => {
  return (
    (model.getNodeById(id) as TabNode)?.getComponent() ?? id.split("-")[1] ?? id
  );
};
