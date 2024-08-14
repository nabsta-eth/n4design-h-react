import { BigNumber } from "ethers";
import { Pair } from "handle-sdk/dist/types/trade";
import { pairToString } from "handle-sdk/dist/utils/general";
import { formatPrice } from ".";
import { toParsedDatafeedPair } from "handle-sdk/dist/components/h2so/toParsedDatafeedPair";
import { PRICE_DECIMALS } from "handle-sdk/dist/components/trade";

export const getDocumentPriceTitle = (
  price: BigNumber,
  pair: Pair,
  displayDecimals: number,
  decimals = PRICE_DECIMALS,
) => {
  pair = toParsedDatafeedPair(pair);
  const displayPrice = formatPrice(price, displayDecimals, undefined, decimals);
  const metatagPriceDisplay = price.gt(0) ? displayPrice : "";
  const pairDisplay = pairToString(pair).replace("/", "");

  return `${metatagPriceDisplay} | ${pairDisplay} | handle.fi`;
};
