import classNames from "classnames";
import { Checkbox } from "@handle-fi/react-components/dist/components/handle_uikit/components/Form/Checkbox";
import PortfolioTile, { TileProps } from "./PortfolioTile";
import classes from "./PositionEquityTile.module.scss";
import { Position } from "handle-sdk/dist/components/trade/position";
import { useTradeAccountDisplay } from "../../../context/TradeAccountDisplay";

type Props = TileProps & {
  positions: Position[];
  onChangeIncludeInAssets: () => void;
  includeInAssets?: boolean;
};

const PositionEquityTile = ({
  positions,
  isLoading,
  onChangeIncludeInAssets,
  includeInAssets,
  title,
  leftText,
  children,
  ...rest
}: Props) => {
  const { currentAccountDisplay } = useTradeAccountDisplay(true);
  const { accountEquity, leverageDisplay, reservedEquityDisplay } =
    currentAccountDisplay;

  const titleToDisplay = (
    <div className="uk-flex uk-flex-middle">
      <span className="uk-margin-small-right">position equity</span>
      <span uk-tooltip="title: check to include equity in nett position; pos: bottom;">
        <Checkbox
          checked={includeInAssets}
          onChange={onChangeIncludeInAssets}
          className={classNames(
            "uk-display-block uk-tooltip-content",
            classes.tooltip,
            {
              "hfi-down": accountEquity.lt(0),
            },
          )}
        />
      </span>
    </div>
  );

  return (
    <PortfolioTile
      key="totalPositionEquity"
      isLoading={isLoading}
      titleElement={titleToDisplay}
      leftText={reservedEquityDisplay}
      rightText={leverageDisplay}
      color={accountEquity.gte(0) ? undefined : "red"}
      {...rest}
    />
  );
};

export default PositionEquityTile;
