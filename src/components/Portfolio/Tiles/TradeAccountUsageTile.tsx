import PortfolioTile, { TileProps } from "./PortfolioTile";
import classNames from "classnames";
import classes from "./PortfolioTiles.module.scss";
import { DisplayAmount } from "../DisplayAmount";
import { useTradeAccountDisplay } from "../../../context/TradeAccountDisplay";

const TradeAccountUsageTile = ({
  isLoading,
  title,
  leftText,
  children,
  ...rest
}: TileProps) => {
  const { currentAccountDisplay } = useTradeAccountDisplay(true);
  const { marginUsageDisplay, leverageDisplay } = currentAccountDisplay;

  return (
    <PortfolioTile
      key="accountUtilisation"
      isLoading={isLoading}
      title={`trade account utilisation`}
      leftText={
        <span className="uk-flex uk-flex-column">
          <span className={classNames(classes.caption)}>margin usage</span>
          <DisplayAmount amount={marginUsageDisplay} />
        </span>
      }
      rightText={
        <span className="uk-flex uk-flex-column uk-flex-bottom">
          <span className={classNames(classes.caption)}>leverage</span>
          <DisplayAmount amount={leverageDisplay} />
        </span>
      }
      {...rest}
    />
  );
};

export default TradeAccountUsageTile;
