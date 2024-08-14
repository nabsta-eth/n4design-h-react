import classNames from "classnames";
import classes from "./TradePortfolio.module.scss";
import TradeAccountValueTile from "./Tiles/TradeAccountValueTile";
import TradeAccountAvailableTile from "./Tiles/TradeAccountAvailableTile";
import OpenPnlTile from "./Tiles/OpenPnlTile";
import TotalMarginTile from "./Tiles/TotalMarginTile";
import TotalReturnTile from "./Tiles/TotalReturnTile";
import LiquidationRiskTile from "./Tiles/LiquidationRiskTile";
import FundsUntilLiquidationTile from "./Tiles/FundsUntilLiquidationTile";
import MarginUsageTile from "./Tiles/MarginUsageTile";
import AccountLeverageTile from "./Tiles/AccountLeverageTile";
import CustomiseTile from "./Tiles/CustomiseTile";
import { useLocalStorage } from "@handle-fi/react-components/dist/hooks/useLocalStorage";
import { Dropdown } from "@handle-fi/react-components/dist/components/handle_uikit/components/Dropdown";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import React from "react";
import { useLanguageStore } from "../../context/Translation";
import { uniqueId } from "../../utils/general";

export const availablePortfolioTiles = [
  "accountValue",
  "availableFunds",
  "openPnl",
  "totalReturn",
  "totalMargin",
  "liquidationRisk",
  "fundsUntilLiquidation",
  "marginUsage",
  "accountLeverage",
] as const;
type AvailablePortfolioTile = (typeof availablePortfolioTiles)[number];
type TradePortfolioTile = {
  tile: AvailablePortfolioTile;
  selected: boolean;
};

const availablePortfolioTilesToShow = availablePortfolioTiles.map(tile => {
  return {
    tile: tile,
    selected: true,
  };
});

const TradePortfolio = () => {
  const { t } = useLanguageStore();
  const [portfolioTiles, setPortfolioTiles] = useLocalStorage<
    TradePortfolioTile[]
  >("portfolioTiles", availablePortfolioTilesToShow);

  React.useEffect(() => {
    if (!portfolioTiles) setPortfolioTiles(availablePortfolioTilesToShow);
  }, []);
  const dropdownOffset = 4;

  const onClickTile = (tile: TradePortfolioTile) => {
    const newPortfolioTiles = [...portfolioTiles].map(t =>
      t.tile === tile.tile ? { ...t, selected: !t.selected } : t,
    );
    setPortfolioTiles(newPortfolioTiles);
  };

  const id = React.useMemo(() => {
    const id = uniqueId(5);
    return (v: string) => `portfolio-${id}-${v}`;
  }, []);

  const customiseTileId = id("customise-tile");
  const customiseDropdownId = id("dropdown");

  return (
    <React.Fragment>
      <div className={classNames("uk-flex", classes.tradePortfolioWrapper)}>
        {portfolioTiles.map(tile => {
          if (!tile.selected) return null;
          const tileProps = {
            className: classes.tile,
          };
          switch (tile.tile) {
            case "accountValue":
              return <TradeAccountValueTile key={tile.tile} {...tileProps} />;
            case "availableFunds":
              return (
                <TradeAccountAvailableTile key={tile.tile} {...tileProps} />
              );
            case "openPnl":
              return <OpenPnlTile key={tile.tile} {...tileProps} />;
            case "totalReturn":
              return <TotalReturnTile key={tile.tile} {...tileProps} />;
            case "totalMargin":
              return <TotalMarginTile key={tile.tile} {...tileProps} />;
            case "liquidationRisk":
              return <LiquidationRiskTile key={tile.tile} {...tileProps} />;
            case "fundsUntilLiquidation":
              return (
                <FundsUntilLiquidationTile key={tile.tile} {...tileProps} />
              );
            case "marginUsage":
              return <MarginUsageTile key={tile.tile} {...tileProps} />;
            case "accountLeverage":
              return <AccountLeverageTile key={tile.tile} {...tileProps} />;
            default:
              return null;
          }
        })}

        <CustomiseTile
          id={customiseTileId}
          dropdownId={customiseDropdownId}
          className={classNames(classes.tile, classes.customiseTile)}
        />
      </div>

      <Dropdown
        id={customiseDropdownId}
        className={classNames(classes.portfolioDropdown)}
        options={`mode: click; delay-hide: 0; pos: bottom-right; target: #${customiseTileId}; boundary: #${customiseTileId}; boundary-align: true; offset: ${dropdownOffset}; container: #handle;`}
      >
        <div className={classes.dropdownContent}>
          <div className={classes.dropdownTitle}>{t.accountDetails}</div>
          {portfolioTiles.map((tile, ix) => (
            <div
              key={tile.tile}
              className={classNames("uk-flex uk-flex-middle", {
                "uk-margin-small-bottom":
                  ix < availablePortfolioTiles.length - 1,
              })}
            >
              <span
                role="button"
                tabIndex={0}
                onClick={() => onClickTile(tile)}
                className={classNames("cursor-pointer", classes.checkbox)}
              >
                <FontAwesomeIcon
                  icon={["fal", `square${tile.selected ? "-check" : ""}`]}
                />
              </span>
              <span>{t[tile.tile]}</span>
            </div>
          ))}
        </div>
      </Dropdown>
    </React.Fragment>
  );
};

export default TradePortfolio;
