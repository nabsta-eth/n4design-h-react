import { Instrument } from "handle-sdk/dist/components/trade";
import { useTrade } from "../../context/Trade";

export const useInstrumentOrThrow = (pair: string): Instrument => {
  const { instruments } = useTrade();
  const instrument = instruments.find(instrument => instrument.pair === pair);
  if (!instrument) {
    throw new Error(`Instrument not found for pair: ${pair}`);
  }
  return instrument;
};
