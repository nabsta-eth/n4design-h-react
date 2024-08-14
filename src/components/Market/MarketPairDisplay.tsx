import PairDisplay from "@handle-fi/react-components/dist/components/PairDisplay/PairDisplay";
import classes from "./MarketPairDisplay.module.scss";
import { bnToDisplayString } from "../../utils/format";
import { AMOUNT_UNIT } from "handle-sdk/dist/components/trade/reader";
import { TradePairOrViewOnlyInstrument } from "../../types/trade";
import { Instrument, TradePair } from "handle-sdk/dist/components/trade";
import { ViewOnlyInstrument } from "../../config/viewOnlyInstruments";

type Props = {
  tradePairOrViewOnlyInstrument: TradePairOrViewOnlyInstrument;
  showLeverage?: boolean;
  instrument: Instrument;
};

export const MarketPairDisplay = ({
  tradePairOrViewOnlyInstrument,
  showLeverage,
  instrument,
}: Props) => {
  const isViewOnlyMarket = ViewOnlyInstrument.isViewOnlyInstrument(
    tradePairOrViewOnlyInstrument,
  );
  const showLeverageDisplay = showLeverage && !isViewOnlyMarket;
  const maxLeverageDisplay = isViewOnlyMarket
    ? undefined
    : `${bnToDisplayString(
        AMOUNT_UNIT.div(
          (tradePairOrViewOnlyInstrument as TradePair).initialMarginFraction,
        ),
        0,
        0,
      )}x`;

  return (
    <>
      <PairDisplay
        pair={tradePairOrViewOnlyInstrument.pair}
        size="26"
        instrument={instrument}
      />
      {showLeverageDisplay && (
        <div className={classes.maxLeverage}>{maxLeverageDisplay}</div>
      )}
    </>
  );
};
