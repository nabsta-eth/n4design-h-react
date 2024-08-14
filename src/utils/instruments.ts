import { Instrument } from "handle-sdk/dist/components/trade";
import { pairToDisplayString } from "./trade/toDisplayPair";
import { Pair } from "handle-sdk/dist/types/trade";

export const getInstrument = (
  instruments: Instrument[],
  pair: Pair,
): Instrument => {
  const instrument = instruments.find(
    i => i.pair === pairToDisplayString(pair),
  );
  if (!instrument) {
    throw new Error(
      `Instrument not found for pair: ${pairToDisplayString(pair)}`,
    );
  }
  return instrument;
};
