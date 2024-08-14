import { Quote } from "handle-sdk";
import { bnToDisplayString } from "../format";
import { calculatePriceFromQuote } from "./calculatePriceFromQuote";

export const getTokenRatioDisplay = (
  quote: Quote,
  fromTokenDecimals: number,
  toTokenDecimals: number,
  reverse?: boolean,
) => {
  return bnToDisplayString(
    calculatePriceFromQuote(quote, fromTokenDecimals, toTokenDecimals, reverse),
    18,
    4,
  );
};
