import PortfolioTile, { TileProps } from "./PortfolioTile";
import classNames from "classnames";
import { DisplayAmount } from "../DisplayAmount";
import { useTradeAccountDisplay } from "../../../context/TradeAccountDisplay";

const OpenPnlTile = ({
  isLoading,
  title,
  leftText,
  children,
  ...rest
}: TileProps) => {
  const { currentAccountDisplay } = useTradeAccountDisplay(true);
  const { unrealisedEquity, unrealisedEquityDisplay } = currentAccountDisplay;

  return (
    <PortfolioTile
      key="openPnl"
      title={`open pnl`}
      isLoading={isLoading}
      leftText={
        <span
          className={classNames({
            "hfi-up": unrealisedEquity.gt(0),
            "hfi-down": unrealisedEquity.lt(0),
          })}
        >
          <DisplayAmount amount={unrealisedEquityDisplay} />
        </span>
      }
      {...rest}
    />
  );
};

export default OpenPnlTile;
