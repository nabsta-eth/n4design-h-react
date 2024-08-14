import { Pair } from "handle-sdk/dist/types/trade";
import { pairFromString } from "handle-sdk/dist/utils/general";
import { InstrumentWithTradeableIndicator } from "../context/Trade";

export const getViewOnlyInstruments = (
  instruments: InstrumentWithTradeableIndicator[],
): ViewOnlyInstrument[] => {
  const viewOnlyInstruments = instruments
    .filter(instrument => !instrument.isTradeable)
    .map(instrument => ViewOnlyInstrument.fromInstrument(instrument));
  return viewOnlyInstruments;
};

// TODO: replace this class - https://github.com/handle-fi/handle-react/issues/3964.
export class ViewOnlyInstrument {
  /**
   * @param pair the pair of the form {baseSymbol, quoteSymbol}.
   * @param instrument the instrument object.
   **/
  constructor(
    public pair: Pair,
    public instrument: InstrumentWithTradeableIndicator,
  ) {}
  public static fromInstrument(
    instrument: InstrumentWithTradeableIndicator,
  ): ViewOnlyInstrument {
    return new ViewOnlyInstrument(pairFromString(instrument.pair), instrument);
  }
  public static isViewOnlyInstrument(a: unknown): a is ViewOnlyInstrument {
    return a instanceof ViewOnlyInstrument;
  }
}
