import { getTradingViewIframes } from "./getTradingViewIframes";

export const setCssFiles = (
  activeThemeName: string,
  isMobile: boolean,
  isModernTheme: boolean,
) => {
  // iframes being rebuilt so add in the relevant CSS files
  const tradingViewIframes = getTradingViewIframes();
  tradingViewIframes.forEach(iframe => {
    iframe.contentWindow?.document.body.classList.add(activeThemeName);
    iframe.contentWindow?.document.body.classList.add(
      isMobile ? "mobile" : "desktop",
    );
    iframe.contentWindow?.document.body.classList.add(
      isModernTheme ? "modern" : "classic",
    );
  });
};
