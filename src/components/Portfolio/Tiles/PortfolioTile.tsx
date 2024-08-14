import classNames from "classnames";
import classes from "./PortfolioTile.module.scss";
import {
  Card,
  CardBody,
} from "@handle-fi/react-components/dist/components/handle_uikit/components/Card";
import Loader from "@handle-fi/react-components/dist/components/Loader";
import React from "react";
import { useUiStore } from "../../../context/UserInterface";
import { getThemeFile } from "../../../utils/ui";

export type TileProps = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLElement>,
  HTMLElement
> & {
  title?: string;
  titleElement?: JSX.Element;
  leftText?: string | JSX.Element;
  centreText?: string | JSX.Element;
  rightText?: string | JSX.Element;
  color?: "red" | "green" | "yellow" | "orange";
  noPadding?: boolean;
  isLoading?: boolean;
  hideCentreText?: boolean;
};

const PortfolioTile = ({
  title,
  titleElement,
  leftText,
  centreText,
  rightText,
  color,
  noPadding,
  isLoading,
  hideCentreText,
  children,
  ...rest
}: TileProps) => {
  const { activeTheme } = useUiStore();
  const showCentreText = !!centreText && !hideCentreText;
  const showRightText = !!rightText || showCentreText;
  return (
    <Card
      className={classNames(classes.tile, {
        "hfi-down": color === "red",
        "hfi-warning-color": color === "yellow",
        "hfi-warning": color === "orange",
      })}
      {...rest}
    >
      <CardBody
        className={classNames(
          "uk-flex uk-flex-column uk-width-expand uk-height-1-1 uk-flex-between",
          classes.tileBody,
          {
            [classes.noPadding]: noPadding,
          },
        )}
      >
        {title && <div>{title}</div>}
        {titleElement && (
          <div
            className={classNames({
              "hfi-up": color === "green",
              "hfi-down": color === "red",
            })}
          >
            {titleElement}
          </div>
        )}

        {isLoading ? (
          <div className={classes.loader}>
            <Loader color={getThemeFile(activeTheme).primaryColor} />
          </div>
        ) : (
          <React.Fragment>
            <div className="uk-flex uk-width-expand uk-flex-between uk-flex-bottom">
              <span className="uk-h4 uk-margin-remove">{leftText}</span>
              {showCentreText && (
                <span className="uk-h4 uk-margin-remove">{centreText}</span>
              )}
              {showRightText && (
                <span className="uk-h4 uk-margin-remove">{rightText}</span>
              )}
            </div>
            {children}
          </React.Fragment>
        )}
      </CardBody>
    </Card>
  );
};

export default PortfolioTile;
