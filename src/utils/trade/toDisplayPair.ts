import { Pair } from "handle-sdk/dist/types/trade";
import { isFxTokenSymbol } from "handle-sdk/dist/utils/fxToken";
import { HandleTokenManagerInstance } from "handle-sdk/dist/components/token-manager/HandleTokenManager";
import { pairFromString } from "handle-sdk/dist/utils/general";
import { Instrument } from "handle-sdk/dist/components/trade";

const hlpTokenSymbols = HandleTokenManagerInstance.getHlpTokens("arbitrum").map(
  s => s.symbol,
);

export const pairToDisplayString = ({
  baseSymbol,
  quoteSymbol,
}: Pair): string =>
  `${formatDisplaySymbol(baseSymbol)}/${formatDisplaySymbol(quoteSymbol)}`;

export const pairToHyphenatedDisplayString = ({
  baseSymbol,
  quoteSymbol,
}: Pair): string =>
  `${formatDisplaySymbol(baseSymbol)}-${formatDisplaySymbol(quoteSymbol)}`;

export const pairToLowercaseHyphenatedDisplayString = ({
  baseSymbol,
  quoteSymbol,
}: Pair): string =>
  pairToHyphenatedDisplayString({ baseSymbol, quoteSymbol }).toLowerCase();

export const pairToDisplayTokens = ({
  baseSymbol,
  quoteSymbol,
}: Pair): Pair => {
  return {
    baseSymbol: formatDisplaySymbol(baseSymbol),
    quoteSymbol: formatDisplaySymbol(quoteSymbol),
  };
};

export const formatDisplaySymbol = (symbol: string) => {
  if (symbol === "WETH") return "ETH";
  if (isPair(symbol)) {
    return pairFromString(symbol).baseSymbol;
  }
  return symbol;
};

/**
 * @returns whether the string can be parsed as a pair.
 */
export const isPair = (symbol: string) => {
  return symbol.split("/").length === 2;
};

/**
 * Returns an fxToken symbol if the symbol is a fiat currency symbol for an
 * existing fxToken, otherwise returns the input unchanged.
 */
export const tryConvertSymbolToFxTokenSymbol = (symbol: string) => {
  const fxSymbol = `fx${symbol}`;
  if (isFxTokenSymbol(fxSymbol) && hlpTokenSymbols.includes(fxSymbol)) {
    return fxSymbol;
  }
  return symbol;
};

// TODO: https://github.com/handle-fi/handle-react/issues/3960 - move to react-components
export type DisplayPair = {
  baseSymbol: string;
  quoteSymbol: string | undefined;
};
export const getDisplayPair = (
  pair: Pair,
  instrument: Instrument,
): DisplayPair => {
  const displayPair =
    !instrument.chartSymbol && !instrument.hideQuoteSymbol
      ? pair
      : { baseSymbol: pair.baseSymbol, quoteSymbol: undefined };
  return displayPair;
};
