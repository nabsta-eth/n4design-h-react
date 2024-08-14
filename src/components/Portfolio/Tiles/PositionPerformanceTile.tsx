import PortfolioTile, { TileProps } from "./PortfolioTile";
import classNames from "classnames";
import classes from "./PortfolioTiles.module.scss";
import { bnToDisplayString } from "../../../utils/format";
import { AMOUNT_DECIMALS } from "handle-sdk/dist/components/trade";
import { USD_DISPLAY_DECIMALS, expandDecimals } from "../../../utils/trade";
import { DisplayAmount } from "../DisplayAmount";
import { useTradeAccountDisplay } from "../../../context/TradeAccountDisplay";

const PositionPerformanceTile = ({
  isLoading,
  title,
  leftText,
  children,
  ...rest
}: TileProps) => {
  const { currentAccountDisplay } = useTradeAccountDisplay(true);
  const {
    unrealisedEquity,
    unrealisedEquityDisplay,
    reservedEquity,
    reservedEquityDisplay,
  } = currentAccountDisplay;
  const totalPnlDisplay = reservedEquity.gt(0)
    ? `${bnToDisplayString(
        unrealisedEquity
          .mul(expandDecimals(1, AMOUNT_DECIMALS))
          .mul(100)
          .div(reservedEquity),
        AMOUNT_DECIMALS,
        USD_DISPLAY_DECIMALS,
      )}%`
    : "0.00%";

  return (
    <PortfolioTile
      key="positionPerformance"
      title={`open trade performance`}
      isLoading={isLoading}
      leftText={
        <span
          className={classNames("uk-flex uk-flex-column uk-flex-top", {
            "hfi-up": unrealisedEquity.gt(0),
            "hfi-down": unrealisedEquity.lt(0),
          })}
        >
          <span className={classNames(classes.caption)}>open pnl</span>
          <DisplayAmount amount={unrealisedEquityDisplay} />
        </span>
      }
      centreText={
        <span className="uk-flex uk-flex-column uk-flex-middle">
          <span className={classNames(classes.caption)}>total margin</span>
          <DisplayAmount amount={reservedEquityDisplay} />
        </span>
      }
      rightText={
        <span
          className={classNames("uk-flex uk-flex-column uk-flex-bottom", {
            "hfi-up": unrealisedEquity.gt(0),
            "hfi-down": unrealisedEquity.lt(0),
          })}
        >
          <span className={classNames(classes.caption)}>total return</span>
          <DisplayAmount amount={totalPnlDisplay} />
        </span>
      }
      {...rest}
    />
  );
};

export default PositionPerformanceTile;
