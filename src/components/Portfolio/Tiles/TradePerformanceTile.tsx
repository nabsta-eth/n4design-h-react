import PortfolioTile, { TileProps } from "./PortfolioTile";
import { ethers } from "ethers";
import { formatPrice } from "../../../utils/trade";
import { DashboardPortfolioHookValue } from "src/hooks/useDashboard/useDashboardPortfolio";
import classNames from "classnames";
import classes from "./PortfolioTiles.module.scss";

type Props = TileProps & {
  portfolio: DashboardPortfolioHookValue;
};

const TradePerformance = ({
  portfolio,
  isLoading,
  title,
  leftText,
  children,
  ...rest
}: Props) => {
  const closedCollateral =
    portfolio.closed?.collateral || ethers.constants.Zero;
  const closedPnl = portfolio.closed?.pnl || ethers.constants.Zero;
  const closedWinLoss = `${portfolio.closed?.wins || 0}/${
    portfolio.closed?.losses || 0
  }`;
  const winsGtLosses =
    (portfolio.closed?.wins || 0) > (portfolio.closed?.losses || 0);
  const closedPnlToDisplay = `${formatPrice(closedPnl, 2)}%`;

  return (
    <PortfolioTile
      key="tradePerformance"
      isLoading={isLoading}
      title="trade performance"
      leftText={
        <span className="uk-flex uk-flex-column">
          <span className={classNames(classes.caption)}>collateral</span>
          {formatPrice(closedCollateral, 2)} USD
        </span>
      }
      centreText={
        <span className="uk-flex uk-flex-column uk-flex-middle">
          <span className={classNames(classes.caption)}>win/loss</span>
          <span className={winsGtLosses ? "hfi-up" : " hfi-down"}>
            {closedWinLoss}
          </span>
        </span>
      }
      rightText={
        <span className="uk-flex uk-flex-column uk-flex-bottom">
          <span className={classNames(classes.caption)}>pnl</span>
          <span className={closedPnl.gt(0) ? "hfi-up" : " hfi-down"}>
            {closedPnl.gt(0) ? "+" : ""}
            {closedPnlToDisplay}
          </span>
        </span>
      }
      color={closedPnl.gte(0) ? undefined : "red"}
      {...rest}
    />
  );
};

export default TradePerformance;
