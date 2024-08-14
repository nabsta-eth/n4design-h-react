import { BigNumber } from "ethers";
import { Pair } from "handle-sdk/dist/types/trade";
import { OrderType } from "./orders";
import { formatPrice } from ".";
import { stripFx } from "../general";

export const getPriceDisplays = (
  markPrice: BigNumber,
  triggerPrice: BigNumber,
  currentPrice: BigNumber,
  orderType: OrderType,
  pair: Pair,
  displayDecimals: number,
) => {
  const markPriceDisplay = formatPrice(
    markPrice,
    displayDecimals,
    stripFx(pair.quoteSymbol),
  );
  const currentPriceDisplay = formatPrice(
    currentPrice,
    displayDecimals,
    stripFx(pair.quoteSymbol),
  );
  const entryPriceDisplay =
    orderType === OrderType.Market
      ? markPriceDisplay
      : formatPrice(triggerPrice, displayDecimals, stripFx(pair.quoteSymbol));
  return { markPriceDisplay, entryPriceDisplay, currentPriceDisplay };
};
