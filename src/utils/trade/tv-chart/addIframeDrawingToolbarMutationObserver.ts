import { CHART_ID_ATTRIBUTE } from "../../../components/TradeChart/TradeChart";
import { getTradingViewIframes } from "./getTradingViewIframes";

// Pop-up menus are added to a div with this id
// when clicking buttons or right-clicking on the chart.
const MUTATION_OBSERVER_TARGET_ID = "drawing-toolbar";
// This div is added to the body when the first pop-up menu is opened
// so we may be looking for it to be added or its children.
const MUTATION_OBSERVER_BODY_CONFIG = {
  attributes: true,
};

export const addIframeDrawingToolbarMutationObserver = (
  pair: string | undefined,
  chartId: string,
  setIframeDrawingToolbarIsOpen: (isOpen: boolean) => void,
) => {
  const tradingViewIframes = getTradingViewIframes(pair);
  const chartIframe = tradingViewIframes.find(
    iframe => iframe.getAttribute(CHART_ID_ATTRIBUTE) === chartId,
  );
  if (!chartIframe) {
    return;
  }

  const iframeDrawingToolbar =
    chartIframe.contentWindow?.document.getElementById(
      MUTATION_OBSERVER_TARGET_ID,
    );

  const mutationCallbackBody: MutationCallback = (mutationList, observer) => {
    for (const mutation of mutationList) {
      if (
        mutation.type === "attributes" &&
        mutation.attributeName === "class"
      ) {
        if (iframeDrawingToolbar) {
          setIframeDrawingToolbarIsOpen(
            !iframeDrawingToolbar.className.includes("isHidden"),
          );
        }
      }
    }
  };

  if (iframeDrawingToolbar) {
    const iframeDrawingToolbarObserver = new MutationObserver(
      mutationCallbackBody,
    );
    iframeDrawingToolbarObserver.observe(
      iframeDrawingToolbar,
      MUTATION_OBSERVER_BODY_CONFIG,
    );
  }
};
