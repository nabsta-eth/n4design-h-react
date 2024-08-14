import classNames from "classnames";
import { Network, trade } from "handle-sdk";
import { PositionRow } from "../PositionRow";
import PositionPairDisplay from "../PositionPairDisplay/PositionPairDisplay";
import { Position } from "handle-sdk/dist/components/trade/position";
import { usePosition } from "../../hooks/usePosition";
import FlashingNumber from "../FlashingNumber/FlashingNumber";
import PriceDisplayExtended from "../PriceDisplayExtended/PriceDisplayExtended";
import { useLanguageStore } from "../../context/Translation";
import classes from "./ShowPosition.module.scss";
import { bnToDisplayString } from "../../utils/format";
import { useInstrumentOrThrow } from "../../hooks/trade/useInstrumentOrThrow";
import { pairToString } from "handle-sdk/dist/utils/general";

type Props = {
  position: Position;
  onClose: () => void;
  network?: Network;
  className?: string;
};

const ShowPosition = ({ position }: Props) => {
  const { t } = useLanguageStore();
  const {
    sizeInUsdDisplay,
    entryPriceDisplay,
    markPrice,
    initialMarginDisplay,
    pnlDisplay,
    pnlPercent,
    pnlPercentDisplay,
    totalPositionFees,
    totalPositionFeesDisplay: fundingFees,
  } = usePosition(position);
  const instrument = useInstrumentOrThrow(pairToString(position.pairId.pair));
  const displayDecimalsExtended = instrument.getDisplayDecimals(
    markPrice,
    true,
  );

  const markPriceDisplay = bnToDisplayString(
    markPrice,
    trade.PRICE_DECIMALS,
    displayDecimalsExtended,
    displayDecimalsExtended,
  );

  const marketClosed = false; // correct code but not implemented - !liquidityPool.getPairAvailability({pair: position?.pairId.pair}).isAvailable;

  return (
    <div className="uk-flex uk-flex-column uk-width-expand uk-margin-small-top">
      <PositionPairDisplay
        pair={position.pairId.pair}
        isLong={position.isLong}
      />

      <div className="uk-margin-small-top">
        <PositionRow
          left="mark price"
          right={
            <FlashingNumber
              className={classNames(
                "uk-width-expand uk-flex uk-flex-middle uk-flex-right",
                classes.flashing,
              )}
              value={+(markPrice.toString() ?? "0")}
              disabled={marketClosed}
            >
              {!marketClosed ? (
                <PriceDisplayExtended price={markPriceDisplay} />
              ) : (
                t.closed
              )}
            </FlashingNumber>
          }
        />
        <PositionRow left="entry price" right={entryPriceDisplay} />
        <PositionRow left="position size" right={sizeInUsdDisplay} />
        <PositionRow left="init. margin" right={initialMarginDisplay} />
        <PositionRow
          className={classNames({
            "hfi-up": pnlPercent.gt("0") && !marketClosed,
            "hfi-down": pnlPercent.lt("0") && !marketClosed,
            "disabled-opacity": marketClosed,
          })}
          left="pnl"
          right={pnlDisplay}
        />
        <PositionRow
          className={classNames({
            "hfi-up": pnlPercent.gt("0") && !marketClosed,
            "hfi-down": pnlPercent.lt("0") && !marketClosed,
            "disabled-opacity": marketClosed,
          })}
          left="return"
          right={`${pnlPercentDisplay}%`}
        />
        <PositionRow
          className={classNames({
            "hfi-down": totalPositionFees.gt("0"),
            "hfi-up": totalPositionFees.lt("0"),
          })}
          left={
            <div uk-tooltip={`title: ${t.fundingTooltip}; pos: right;`}>
              <span
                className={classNames("uk-tooltip-content", {
                  "hfi-down": totalPositionFees.gt("0"),
                  "hfi-up": totalPositionFees.lt("0"),
                })}
              >
                {t.funding}
              </span>
            </div>
          }
          right={fundingFees}
        />
      </div>
    </div>
  );
};

export default ShowPosition;
