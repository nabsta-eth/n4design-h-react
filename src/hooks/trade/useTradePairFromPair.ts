import { Pair } from "handle-sdk/dist/types/trade";
import { useTrade } from "../../context/Trade";
import { isSamePair, pairToString } from "handle-sdk/dist/utils/general";

export const useTradePairFromPair = (pair: Pair) => {
  const { pairs, viewOnlyInstruments } = useTrade();
  const tradePair =
    pairs.find(({ pair: p }) => isSamePair(p, pair)) ||
    viewOnlyInstruments.find(({ pair: p }) => isSamePair(p, pair));
  if (!tradePair) {
    throw new Error(
      `Could not find pair ${pairToString(pair)} from list of pairs ${pairs
        .map(({ pair }) => pairToString(pair))
        .join(", ")}`,
    );
  }
  return tradePair;
};
