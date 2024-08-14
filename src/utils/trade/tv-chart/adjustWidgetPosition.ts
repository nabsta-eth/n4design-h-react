import {
  AMOUNT_TO_MOVE_RIGHT_IF_TOOLBAR_OPENED,
  DEFAULT_POSITION_WITH_DRAWING_TOOLBAR_OPEN,
} from "../../../config/trade";
import { getDragHandleClass } from "../../../utils/general";

const getWidgetElement = (chartId: string) =>
  document.getElementsByClassName(getDragHandleClass(chartId))[0].parentElement;

export const adjustWidgetPosition = (
  chartId: string,
  headerWidth: number,
  iframeDrawingToolbarIsOpen: boolean,
) => {
  const widget = getWidgetElement(chartId);
  const widgetStyle = widget?.getAttribute("style");
  let widgetStyleLeftValue = 20;
  if (widgetStyle) {
    const widgetStyleParts = widgetStyle.replaceAll("px", "").split(" ");
    const leftStyleAttributeValueIx =
      widgetStyleParts.findIndex(part => part.includes("left:")) + 1;
    widgetStyleLeftValue = +widgetStyleParts[leftStyleAttributeValueIx].replace(
      ";",
      "",
    );
  }
  const shouldMoveRight =
    iframeDrawingToolbarIsOpen &&
    widgetStyleLeftValue &&
    widgetStyleLeftValue < DEFAULT_POSITION_WITH_DRAWING_TOOLBAR_OPEN;
  const shouldMoveLeft =
    !shouldMoveRight &&
    !iframeDrawingToolbarIsOpen &&
    widget &&
    widgetStyleLeftValue <
      DEFAULT_POSITION_WITH_DRAWING_TOOLBAR_OPEN +
        AMOUNT_TO_MOVE_RIGHT_IF_TOOLBAR_OPENED &&
    widgetStyleLeftValue >= DEFAULT_POSITION_WITH_DRAWING_TOOLBAR_OPEN;
  const newMoveLeftValue = shouldMoveLeft
    ? widgetStyleLeftValue - AMOUNT_TO_MOVE_RIGHT_IF_TOOLBAR_OPENED
    : widgetStyleLeftValue;
  const newLeftValue = shouldMoveRight ? 67 : newMoveLeftValue;
  if (newLeftValue !== widgetStyleLeftValue && widget) {
    const newWidgetStyle = widgetStyle
      ? widgetStyle.replace(/left: \d+px;/, `left: ${newLeftValue}px;`)
      : `left: ${newLeftValue}px;`;
    widget.setAttribute("style", newWidgetStyle);
  }
};

export const resetWidgetPosition = (chartId: string) => {
  const widget = getWidgetElement(chartId);
  if (!widget) {
    return;
  }
  widget.setAttribute("style", "");
};
