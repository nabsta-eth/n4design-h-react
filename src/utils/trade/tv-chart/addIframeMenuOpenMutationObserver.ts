import { CHART_ID_ATTRIBUTE } from "../../../components/TradeChart/TradeChart";
import { getTradingViewIframes } from "./getTradingViewIframes";

// Pop-up menus are added to a div with this id
// when clicking buttons or right-clicking on the chart.
const MUTATION_OBSERVER_TARGET_ID = "overlap-manager-root";
// This div is added to the body when the first pop-up menu is opened
// so we may be looking for it to be added or its children.
const MUTATION_OBSERVER_BODY_CONFIG = {
  childList: true,
  subtree: true,
};
const MUTATION_OBSERVER_TARGET_CONFIG = {
  childList: true,
};

export const addIframeMenuOpenMutationObserver = (
  pair: string | undefined,
  chartId: string,
  setIframeMenuIsOpen: (isOpen: boolean) => void,
) => {
  const tradingViewIframes = getTradingViewIframes(pair);
  const chartIframe = tradingViewIframes.find(
    iframe => iframe.getAttribute(CHART_ID_ATTRIBUTE) === chartId,
  );
  if (!chartIframe) {
    return;
  }

  const iframeBody = chartIframe.contentWindow?.document.body;

  const mutationCallbackBody: MutationCallback = (mutationList, observer) => {
    for (const mutation of mutationList) {
      // The div is added upon opening the first pop-up menu
      // so this should trigger a second observer to be added to the div.
      if (
        mutation.type === "childList" &&
        mutation.addedNodes.length > 0 &&
        mutation.addedNodes[0].parentElement?.id === MUTATION_OBSERVER_TARGET_ID
      ) {
        // Remove the body observer because the target has been added
        // and add a new observer to the target div being the parent of the new menu.
        observer.disconnect();
        const targetDivObserver = new MutationObserver(
          mutationCallbackTargetDiv,
        );
        setIframeMenuIsOpen(true);
        const targetDivElement = mutation.addedNodes[0].parentElement;
        targetDivObserver.observe(
          targetDivElement,
          MUTATION_OBSERVER_TARGET_CONFIG,
        );
      }
    }
  };

  const mutationCallbackTargetDiv: MutationCallback = (mutationList, _) => {
    const targetElement = chartIframe.contentWindow?.document.getElementById(
      MUTATION_OBSERVER_TARGET_ID,
    );
    for (const mutation of mutationList) {
      if (
        mutation.type === "childList" &&
        !!targetElement?.childNodes.length &&
        targetElement?.childNodes.length > 0
      ) {
        return setIframeMenuIsOpen(true);
      }
      if (
        mutation.type === "childList" &&
        targetElement?.childNodes.length === 0
      ) {
        setIframeMenuIsOpen(false);
      }
    }
  };

  if (iframeBody) {
    const bodyObserver = new MutationObserver(mutationCallbackBody);
    bodyObserver.observe(iframeBody, MUTATION_OBSERVER_BODY_CONFIG);
  }
};
