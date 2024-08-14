import { pairToString } from "handle-sdk/dist/utils/general";
import { COLLATERAL_LIST_ORDER } from "../../config/trade";
import { TokenInfo } from "handle-sdk";
import { TradePairOrViewOnlyInstrument } from "../../types/trade";
import { Instrument } from "handle-sdk/dist/components/trade";

export const sortMarketPairs = (
  instruments: Instrument[],
  markets: TradePairOrViewOnlyInstrument[],
): TradePairOrViewOnlyInstrument[] =>
  getSorted(
    markets,
    market => pairToString(market.pair),
    instruments.map(i => i.pair),
  );

export const sortCollateralTokens = (tokens: TokenInfo[]): TokenInfo[] =>
  getSorted(tokens, token => token.symbol, COLLATERAL_LIST_ORDER);

export const sortCollateralSymbols = (symbols: string[]): string[] =>
  getSorted(symbols, symbol => symbol, COLLATERAL_LIST_ORDER);

const getSorted = <T>(
  values: T[],
  sortValueGetter: (value: T) => string,
  priorityList: string[],
): T[] =>
  values.sort((a, b) => {
    const indexA = priorityList.indexOf(sortValueGetter(a));
    const indexB = priorityList.indexOf(sortValueGetter(b));
    if (indexA < 0) return 1;
    if (indexB < 0) return -1;
    return indexA - indexB;
  });
