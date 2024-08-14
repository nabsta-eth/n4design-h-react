import classNames from "classnames";
import { useLanguageStore } from "../../context/Translation";
import classes from "./PositionSkewIndicator.module.scss";
import { useTrade } from "../../context/Trade";
import { AMOUNT_DECIMALS, TradePair } from "handle-sdk/dist/components/trade";
import { BigNumber, ethers } from "ethers";
import { expandDecimals } from "../../utils/trade";
import { bnToDisplayString } from "../../utils/format";

type Props = {
  tradePair: TradePair;
};

const MIN_SKEW_DISPLAY_PRECISION = 0;
const MAX_SKEW_DISPLAY_PRECISION = 1;

const PositionSkewIndicator = (props: Props) => {
  const { t } = useLanguageStore();
  const { protocol } = useTrade();
  const liquidityPool = protocol.getLiquidityPool(props.tradePair.id.lpId);
  const openInterest = liquidityPool.getOpenInterest(props.tradePair);
  const isOpenInterest =
    !!openInterest &&
    !(openInterest.long.isZero() && openInterest.short.isZero());

  const calculatePercentDisplay = (amount: BigNumber, total: BigNumber) => {
    const openPercent = total.isZero()
      ? ethers.constants.Zero
      : amount.mul(expandDecimals(1, AMOUNT_DECIMALS)).div(total).mul("100");
    return `${bnToDisplayString(
      openPercent,
      AMOUNT_DECIMALS,
      MIN_SKEW_DISPLAY_PRECISION,
      MAX_SKEW_DISPLAY_PRECISION,
    )}%`;
  };

  const totalPositions = openInterest.long.add(openInterest.short);
  const longOpenPercentDisplay = isOpenInterest
    ? calculatePercentDisplay(openInterest.long, totalPositions)
    : "0%";
  const longDisplayWidth = isOpenInterest ? longOpenPercentDisplay : "50%";
  const shortOpenPercentDisplay = isOpenInterest
    ? calculatePercentDisplay(openInterest.short, totalPositions)
    : "0%";
  const shortDisplayWidth = isOpenInterest ? shortOpenPercentDisplay : "50%";

  return (
    <div className="uk-flex uk-flex-middle">
      <div
        className={classNames(
          "uk-flex uk-flex-column uk-flex-center",
          classes.skewContainer,
        )}
      >
        <div
          className={classNames(
            "uk-flex uk-width-1-1 uk-text-center uk-flex-center",
            classes.label,
          )}
        >
          {t.tradeChartHeaderOpenInterestLabel}
        </div>

        <div
          className={classNames(
            "uk-flex uk-flex-between",
            classes.overlayLabels,
          )}
        >
          <span className={classes.longLabelOverlay}>
            {longOpenPercentDisplay}
          </span>

          <span className={classes.shortLabelOverlay}>
            {shortOpenPercentDisplay}
          </span>
        </div>

        <div className={classNames("uk-flex", classes.skewBar)}>
          <div
            className={classes.longSkewBar}
            style={{ width: longDisplayWidth }}
          ></div>

          <div
            className={classes.shortSkewBar}
            style={{ width: shortDisplayWidth }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default PositionSkewIndicator;
