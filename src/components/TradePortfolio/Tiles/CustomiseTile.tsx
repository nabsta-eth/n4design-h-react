import PortfolioTile, { TileProps } from "./PortfolioTile";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import classNames from "classnames";
import classes from "./PortfolioTile.module.scss";
import UIkit from "uikit";
import { useLanguageStore } from "../../../context/Translation";

type CustomiseTileProps = TileProps & {
  dropdownId: string;
};
const CustomiseTile = ({
  isLoading,
  title,
  leftText,
  dropdownId,
  children,
  ...rest
}: CustomiseTileProps) => {
  const { t } = useLanguageStore();
  const onClickCustomise = () => {
    UIkit.dropdown(`#${dropdownId}`).show();
  };
  return (
    <PortfolioTile
      key="customise"
      titleElement={
        <div
          className={classNames(classes.customiseButton, "cursor-pointer")}
          uk-tooltip={`title: ${t.selectTiles}; pos: left;`}
          role="button"
          onClick={onClickCustomise}
          draggable={true}
          tabIndex={0}
        >
          <FontAwesomeIcon icon={["fal", "cog"]} />
        </div>
      }
      titleElementClassName="uk-flex uk-flex-middle uk-height-1-1"
      {...rest}
    />
  );
};

export default CustomiseTile;
