import { replaceWrappedSymbolForNative, stripFx } from "./general";
import { pairFromString } from "handle-sdk/dist/utils/general";
import { BigNumber } from "ethers";
import { PRICE_UNIT } from "./trade";
import { priceFeedRef } from "../context/PriceFeed";

/// Returns the fxToken USD price according to the H2SO oracle feed.
/// This throws if the H2SO feed isn't subscribed to the USD-quoted symbol.
export const getFxTokenPriceUsdH2so = (symbol: string): BigNumber => {
  symbol = replaceWrappedSymbolForNative(stripFx(symbol));
  const quote = "USD";
  if (symbol.toUpperCase() === quote) {
    return PRICE_UNIT;
  }
  return priceFeedRef.value.getLatestPrice(
    pairFromString(`${symbol}/${quote}`),
  );
};
