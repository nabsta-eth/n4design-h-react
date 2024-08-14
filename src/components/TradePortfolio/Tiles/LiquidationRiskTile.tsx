import PortfolioTile, { TileProps } from "./PortfolioTile";
import classNames from "classnames";
import classes from "./PortfolioTiles.module.scss";
import ColouredStatusBar from "@handle-fi/react-components/dist/components/ColouredStatusBar";
import { getLiqRiskProps } from "../../../utils/trade/getLiqRiskProps";
import { useUiStore } from "../../../context/UserInterface";
import { getThemeFile } from "../../../utils/ui";
import { useLanguageStore } from "../../../context/Translation";
import { digits } from "../../../utils/general";
import { useTradeAccountDisplay } from "../../../context/TradeAccountDisplay";

const LiquidationRiskTile = ({
  isLoading,
  title,
  leftText,
  children,
  ...rest
}: TileProps) => {
  const { t } = useLanguageStore();
  const { activeTheme } = useUiStore();
  const { currentAccountDisplay } = useTradeAccountDisplay(true);
  const { accountValue, maintenanceEquity } = currentAccountDisplay;
  const { liqRiskBarValue, liqRiskTooltip, liqRiskBarTooltip, liqRiskClass } =
    getLiqRiskProps(accountValue, maintenanceEquity);

  return (
    <PortfolioTile
      key="liquidationRisk"
      id="tradeAccountLiquidationRiskTile"
      isLoading={isLoading}
      titleElement={
        <span
          className={classNames(
            liqRiskClass,
            "cursor-pointer",
            classes.caption,
          )}
          uk-tooltip={liqRiskTooltip}
        >
          {t.liqRisk}
          <span
            className={classNames(
              liqRiskClass,
              "uk-tooltip-content",
              classes.reduced,
              "uk-margin-xsmall-left",
            )}
          >
            {`(${(liqRiskBarValue * 100).toLocaleString(
              undefined,
              digits(2),
            )}%)`}
          </span>
        </span>
      }
      leftText={
        <span
          className={classNames("uk-width-1-1", classes.barWrapper)}
          uk-tooltip={liqRiskBarTooltip}
        >
          <ColouredStatusBar
            id={"liq-risk-tile"}
            valueFraction={liqRiskBarValue}
            themeFile={getThemeFile(activeTheme)}
            outerBarClasses={classes.outerBar}
            innerBarClasses={classes.innerBar}
          />
        </span>
      }
      {...rest}
    />
  );
};

export default LiquidationRiskTile;
