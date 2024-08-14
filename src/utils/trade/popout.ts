import { TabSetNode, BorderNode, TabNode } from "flexlayout-react";
import {
  ACCOUNT_TABSET_ID,
  CHARTS_TABSET_ID,
  CHAT_TABSET_ID,
  DEFAULT_FORM_WIDTH,
  DEFAULT_MARKETS_WIDTH,
  FORM_TABSET_ID,
  MARKETS_TABSET_ID,
  MIN_CHAT_WIDTH,
  POSITIONS_TABSET_ID,
} from "../../config/trade";
import { uniqueId } from "../general";
import { getTradeChartPeriodLocalStorage } from "../local-storage";

const popoutWidth = (nodeId: string) => {
  switch (nodeId) {
    case MARKETS_TABSET_ID:
      return DEFAULT_MARKETS_WIDTH;
    case FORM_TABSET_ID:
      return DEFAULT_FORM_WIDTH;
    case CHAT_TABSET_ID:
      return MIN_CHAT_WIDTH;
    case POSITIONS_TABSET_ID:
      return 780;
    case CHARTS_TABSET_ID:
      return 1000;
    default:
      return 500;
  }
};

const popoutHeight = (nodeId: string, isDev?: boolean) => {
  switch (nodeId) {
    case FORM_TABSET_ID:
      return isDev ? 660 : 610;
    case MARKETS_TABSET_ID:
      return 539;
    case POSITIONS_TABSET_ID:
      return 290;
    case ACCOUNT_TABSET_ID:
      return 269;
    default:
      return 500;
  }
};

export const popout = (node: TabSetNode | BorderNode, isDev?: boolean) => {
  const nodeId = node.getId();
  const width = popoutWidth(nodeId);
  const height = popoutHeight(nodeId, isDev);

  // Get the active/selected child tab or extraData.chartId
  // to determine what is to be popped out.
  const tabNode = node.getChildren().find(n => n.isVisible()) as TabNode;
  const extraData = tabNode.getExtraData().data;
  const isChartTab = !!extraData?.chartId;
  const queryParms = isChartTab
    ? `?id=${extraData.chartId}&period=${getTradeChartPeriodLocalStorage(
        extraData.chartId,
      )}&tabSet=${nodeId}`
    : "";
  const left = (window.innerWidth - width) / 2;
  const popoutFramePath = isChartTab ? CHARTS_TABSET_ID : tabNode.getName();
  window.open(
    `${window.location.origin}/popout/${popoutFramePath}${queryParms}`,
    `${popoutFramePath}-${uniqueId(5)}`,
    `width=${width}, height=${height}, left=${left}, top=86, titlebar=no, toolbar=no, menubar=no`,
  );
};
