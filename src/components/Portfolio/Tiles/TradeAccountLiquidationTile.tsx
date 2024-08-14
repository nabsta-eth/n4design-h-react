import PortfolioTile, { TileProps } from "./PortfolioTile";
import classNames from "classnames";
import classes from "./PortfolioTiles.module.scss";
import { DisplayAmount } from "../DisplayAmount";
import ColouredStatusBar from "@handle-fi/react-components/dist/components/ColouredStatusBar";
import { getLiqRiskProps } from "../../../utils/trade/getLiqRiskProps";
import { useUiStore } from "../../../context/UserInterface";
import { getThemeFile } from "../../../utils/ui";
import { useLanguageStore } from "../../../context/Translation";
import { digits } from "../../../utils/general";
import { useTradeAccountDisplay } from "../../../context/TradeAccountDisplay";

const TradeAccountLiquidationTile = ({
  isLoading,
  title,
  leftText,
  children,
  ...rest
}: TileProps) => {
  const { t } = useLanguageStore();
  const { activeTheme } = useUiStore();
  const { currentAccountDisplay } = useTradeAccountDisplay(true);
  const { accountValue, maintenanceEquity, fundsUntilLiquidationDisplay } =
    currentAccountDisplay;
  const { liqRiskBarValue, liqRiskTooltip, liqRiskBarTooltip, liqRiskClass } =
    getLiqRiskProps(accountValue, maintenanceEquity);

  return (
    <PortfolioTile
      key="accountLiquidation"
      isLoading={isLoading}
      title={`trade account liq. health`}
      leftText={
        <span className="uk-flex uk-flex-column">
          <span
            className={classNames(liqRiskClass, classes.caption)}
            uk-tooltip={liqRiskTooltip}
          >
            <span className={classNames(liqRiskClass, "uk-tooltip-content")}>
              {`${t.liqRisk} (${(liqRiskBarValue * 100).toLocaleString(
                undefined,
                digits(2),
              )}%)`}
            </span>
          </span>
          <span className={classes.barWrapper} uk-tooltip={liqRiskBarTooltip}>
            <ColouredStatusBar
              id={"liq-risk-tile"}
              valueFraction={liqRiskBarValue}
              themeFile={getThemeFile(activeTheme)}
              outerBarClasses={classes.outerBar}
              innerBarClasses={classes.innerBar}
            />
          </span>
        </span>
      }
      rightText={
        <span className="uk-flex uk-flex-column uk-flex-bottom">
          <span className={classNames(classes.caption)}>
            {t.fundsUntilLiquidation}
          </span>
          <DisplayAmount amount={fundsUntilLiquidationDisplay} />
        </span>
      }
      {...rest}
    />
  );
};

export default TradeAccountLiquidationTile;
