export const getTradingViewIframes = (pair?: string) => {
  const tradingViewIframes = [];
  const iframes = document.getElementsByTagName("iframe");
  for (let iframe of iframes) {
    // Ignore any non-tv iframes.
    if (!iframe.id.includes("tradingview")) {
      continue;
    }
    tradingViewIframes.push(iframe);
  }
  if (pair) {
    return tradingViewIframes.filter(iframe => isPairIframe(iframe, pair));
  }
  return tradingViewIframes;
};

const isPairIframe = (iframe: HTMLIFrameElement, pair: string) => {
  const pairSymbols = pair.split("/");
  // Each TV iframe has a "data-widget-options" attribute that contains the pair symbols.
  // Check that this matches the passed pair.
  return (
    iframe.getAttribute("data-widget-options")?.includes(pairSymbols[0]) &&
    iframe.getAttribute("data-widget-options")?.includes(pairSymbols[1])
  );
};
