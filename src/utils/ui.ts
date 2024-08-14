import React from "react";
import handle from "../assets/styles/themes/handle.module.scss";
import handleBerg from "../assets/styles/themes/handleBerg.module.scss";
import handleView from "../assets/styles/themes/handleView.module.scss";
import handleX from "../assets/styles/themes/handleX.module.scss";
import handlePro from "../assets/styles/themes/handlePro.module.scss";
import handleModern from "../assets/styles/themes/handleModern.module.scss";
import handleBergModern from "../assets/styles/themes/handleBergModern.module.scss";
import handleViewModern from "../assets/styles/themes/handleViewModern.module.scss";
import handleXModern from "../assets/styles/themes/handleXModern.module.scss";
import handleProModern from "../assets/styles/themes/handleProModern.module.scss";
import { Theme } from "../types/theme";
import { getTradeChartContainerId } from "./trade/tv-chart/tradeChartContainerId";
import { DEFAULT_THEME } from "../config/constants";

export const useWindowSize = () => {
  const [size, setSize] = React.useState({
    windowWidth: 0,
    windowHeight: 0,
  });

  React.useLayoutEffect(() => {
    const updateSize = () => {
      setSize({
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
      });
    };

    window.addEventListener("resize", updateSize);
    updateSize();

    return () => window.removeEventListener("resize", updateSize);
  }, []);
  return size;
};

const theme = JSON.parse(
  window.localStorage.getItem("theme") ?? JSON.stringify(DEFAULT_THEME),
);
type Themes = { [key: string]: CSSModuleClasses };
const themes: Themes = {
  handle,
  handleModern,
  handlePro,
  handleProModern,
  handleBerg,
  handleBergModern,
  handleView,
  handleViewModern,
  handleX,
  handleXModern,
};

export const getThemeFile = (theme: Theme) => {
  return themes[theme];
};

export const themeFile = getThemeFile(theme ?? DEFAULT_THEME);

export type ColorName = "red" | "yellow" | "orange" | "green";
export const COLOR_NAME_TO_STYLE_VAR: Record<ColorName, string> = {
  red: themeFile.errorColor,
  yellow: themeFile.warningColor,
  orange: themeFile.orangeColor,
  green: themeFile.primaryColor,
};

// key pressed methods
export const isKeyPressedEnter = (e: React.KeyboardEvent) =>
  e.code === "Enter" || e.key === "Enter";
export const isKeyPressedSpace = (e: React.KeyboardEvent) => e.code === "Space";
export const isKeyPressedEnterOrSpace = (e: React.KeyboardEvent) =>
  isKeyPressedEnter(e) || isKeyPressedSpace(e);
export const isKeyPressedTabLeftNavigation = (e: React.KeyboardEvent) =>
  e.code === "ArrowLeft";
export const isKeyPressedTabRightNavigation = (e: React.KeyboardEvent) =>
  e.code === "ArrowRight";
export const isKeyPressedTabNavigation = (e: React.KeyboardEvent) =>
  isKeyPressedTabLeftNavigation(e) || isKeyPressedTabRightNavigation(e);

export type Browser =
  | "firefox"
  | "brave"
  | "safari"
  | "chrome"
  | "edge"
  | "other";

export const getBrowser = (): Browser => {
  const userAgent = navigator.userAgent;

  const isIosChrome = userAgent.indexOf("CriOS") > -1;
  const isMaybeChrome = userAgent.indexOf("Chrome") > -1;
  const isFirefox = userAgent.indexOf("Firefox") > -1;
  const isBrave = "brave" in navigator;
  const isSafari =
    userAgent.indexOf("Safari") > -1 && !isMaybeChrome && !isIosChrome;
  const isEdge = userAgent.indexOf("Edg") > -1;
  // As isChrome is the last return condition we can be sure
  // other browsers have been correctly identified so
  // isMaybeChrome may be safely used here.
  const isChrome = isMaybeChrome || isIosChrome;

  if (isFirefox) return "firefox";
  if (isBrave) return "brave";
  if (isSafari) return "safari";
  if (isEdge) return "edge";
  if (isChrome) return "chrome";
  return "other";
};

// Allows drag and drop functionality on an outer element.
// The element must contain a child with the dragClass assigned
// to be used as the drag handle.
export const activateDragCapability = (
  dragElement: HTMLDivElement,
  dragClass: string,
  chartId: string,
  chartWidth: number,
  padding: number,
) => {
  const chartContainerId = getTradeChartContainerId(chartId);
  let pos1 = 0;
  let pos2 = 0;
  let pos3 = 0;
  let pos4 = 0;

  const dragMouseDown = (e: MouseEvent) => {
    e.preventDefault();
    // Get the mouse cursor position at startup.
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // Call the function whenever the cursor moves.
    document.onmousemove = elementDrag;
  };

  const elementDrag = (e: MouseEvent) => {
    e.preventDefault();
    // Calculate the new cursor position.
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // Set the element's new position.
    const { width: elementWidth, height: elementHeight } =
      dragElement.getBoundingClientRect();
    const chartHeight =
      document.getElementById(chartContainerId)?.offsetHeight ?? 0;
    const newTop = dragElement.offsetTop - pos2;
    if (
      newTop < -padding ||
      newTop >= chartHeight - (elementHeight - padding)
    ) {
      return;
    }
    const newLeft = dragElement.offsetLeft - pos1;
    if (newLeft < 0 || newLeft >= chartWidth - elementWidth) {
      return;
    }
    dragElement.style.top = `${newTop}px`;
    dragElement.style.left = `${newLeft}px`;
    dragElement.style.right = "unset";
  };

  const closeDragElement = () => {
    // Stop moving when mouse button is released.
    document.onmouseup = null;
    document.onmousemove = null;
  };

  const dragHandle = getDragHandle(dragClass);
  if (dragHandle) {
    dragHandle.onmousedown = dragMouseDown;
  }
};

export const deactivateDragCapability = (dragClass: string) => {
  const dragHandle = getDragHandle(dragClass);
  if (dragHandle) {
    dragHandle.onmousedown = null;
  }
};

const getDragHandle = (dragClass: string) => {
  return document.getElementsByClassName(dragClass)[0] as HTMLDivElement;
};
