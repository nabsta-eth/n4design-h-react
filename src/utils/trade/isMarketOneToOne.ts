import { Pair } from "handle-sdk/dist/types/trade";

const parse = (s: string) => {
  if (s === "WETH") return "ETH";
  if (s === "USD") return "fxUSD";
  return s;
};

export const isMarketOneToOne = (pair: Pair) => {
  return parse(pair.baseSymbol) === parse(pair.quoteSymbol);
};
