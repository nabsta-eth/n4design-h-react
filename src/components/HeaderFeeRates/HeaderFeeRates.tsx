import { AMOUNT_DECIMALS, TradePair } from "handle-sdk/dist/components/trade";
import { useTrade } from "../../context/Trade";
import classNames from "classnames";
import classes from "./HeaderFeeRates.module.scss";
import { bnToDisplayString } from "../../utils/format";
import { getRateTooltip } from "../../config/tooltips/trade";

type Props = {
  tradePair: TradePair;
};

const RATE_DISPLAY_DECIMALS = 4;

const HeaderFeeRates = (props: Props) => {
  const { protocol } = useTrade();
  const liquidityPool = protocol.getLiquidityPool(props.tradePair.id.lpId);
  const openInterest = liquidityPool.getOpenInterest(props.tradePair);
  const { long: longFundingRate, short: shortFundingRate } =
    props.tradePair.getFundingRate(openInterest);
  const { long: longBorrowRate, short: shortBorrowRate } =
    props.tradePair.getBorrowRate(openInterest);

  return (
    <div
      className={classNames(
        "uk-flex uk-flex-middle uk-flex-between",
        classes.rateContainer,
      )}
    >
      <div
        className={classNames(
          "uk-flex uk-flex-column uk-flex-bottom",
          classes.labelColumn,
        )}
      >
        <div
          className={classNames("uk-flex uk-flex-middle", classes.rateLabel)}
          uk-tooltip="title: 1h funding rate. calculated and charged or paid hourly; pos: bottom;"
        >
          <span className="uk-tooltip-content">f</span>
        </div>

        <div
          className={classNames("uk-flex uk-flex-middle", classes.rateLabel)}
          uk-tooltip="title: 1h borrow rate. calculated and charged hourly; pos: bottom;"
        >
          <span className="uk-tooltip-content">b</span>
        </div>
      </div>

      <div
        className={classNames(
          "uk-flex uk-flex-column uk-flex-bottom",
          classes.longColumn,
        )}
      >
        <div
          className={classNames(
            "uk-flex uk-flex-middle",
            classes.fundingRateAmount,
            classes.longFundingRateAmount,
            {
              [classes.fundingRatePositive]: longFundingRate.gt(0),
              [classes.fundingRateNegative]: longFundingRate.lt(0),
            },
          )}
          uk-tooltip={getRateTooltip("funding", "long", longFundingRate)}
        >
          <span className="uk-tooltip-content">
            {bnToDisplayString(
              longFundingRate.abs().mul(100),
              AMOUNT_DECIMALS,
              RATE_DISPLAY_DECIMALS,
            )}
            %
          </span>
        </div>

        <div
          className={classNames(
            "uk-flex uk-flex-middle",
            classes.borrowRateAmount,
            classes.longBorrowRateAmount,
            {
              [classes.borrowRatePositive]: longBorrowRate.gt(0),
              [classes.borrowRateNegative]: longBorrowRate.lt(0),
            },
          )}
          uk-tooltip={getRateTooltip("borrow", "long", longBorrowRate)}
        >
          <span className="uk-tooltip-content">
            {bnToDisplayString(
              longBorrowRate.abs().mul(100),
              AMOUNT_DECIMALS,
              RATE_DISPLAY_DECIMALS,
            )}
            %
          </span>
        </div>
      </div>

      <div
        className={classNames(
          "uk-flex uk-flex-column uk-flex-bottom",
          classes.shortColumn,
        )}
      >
        <div
          className={classNames(
            "uk-flex uk-flex-middle",
            classes.fundingRateAmount,
            classes.shortFundingRateAmount,
            {
              [classes.fundingRatePositive]: shortFundingRate.gt(0),
              [classes.fundingRateNegative]: shortFundingRate.lt(0),
            },
          )}
          uk-tooltip={getRateTooltip("funding", "short", shortFundingRate)}
        >
          <span className="uk-tooltip-content">
            {bnToDisplayString(
              shortFundingRate.abs().mul(100),
              AMOUNT_DECIMALS,
              RATE_DISPLAY_DECIMALS,
            )}
            %
          </span>
        </div>

        <div
          className={classNames(
            "uk-flex uk-flex-middle",
            classes.borrowRateAmount,
            classes.shortBorrowRateAmount,
            {
              [classes.borrowRatePositive]: shortBorrowRate.gt(0),
              [classes.borrowRateNegative]: shortBorrowRate.lt(0),
            },
          )}
          uk-tooltip={getRateTooltip("borrow", "short", shortBorrowRate)}
        >
          <span className="uk-tooltip-content">
            {bnToDisplayString(
              shortBorrowRate.abs().mul(100),
              AMOUNT_DECIMALS,
              RATE_DISPLAY_DECIMALS,
            )}
            %
          </span>
        </div>
      </div>
    </div>
  );
};

export default HeaderFeeRates;
