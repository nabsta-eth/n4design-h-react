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
  alignText?: "left" | "right" | "center";
  titleElementClassName?: string;
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
  alignText,
  titleElementClassName,
  children,
  ...rest
}: TileProps) => {
  const { activeTheme } = useUiStore();
  const showCentreText = !!centreText && !hideCentreText;
  const showRightText = !!rightText || showCentreText;
  const textAlign = alignText ?? "right";
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
          "uk-flex uk-flex-column uk-height-1-1 uk-flex-between",
          classes.tileBody,
          {
            [classes.noPadding]: noPadding,
          },
        )}
      >
        {title && <div className={classes.tileTitle}>{title}</div>}
        {titleElement && (
          <div
            className={classNames(
              classes.tileTitleElement,
              titleElementClassName,
              {
                "hfi-up": color === "green",
                "hfi-down": color === "red",
              },
            )}
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
            <div
              className={classNames(
                classes.tileDetail,
                "uk-flex uk-flex-between uk-flex-bottom",
              )}
            >
              <span
                className={`uk-h4 uk-flex uk-flex-${textAlign} uk-text-${textAlign} uk-margin-remove uk-width-expand`}
              >
                {leftText}
              </span>
              {showCentreText && (
                <span
                  className={`uk-h4 uk-flex uk-flex-${textAlign} uk-text-${textAlign} uk-margin-remove`}
                >
                  {centreText}
                </span>
              )}
              {showRightText && (
                <span
                  className={`uk-h4 uk-flex uk-flex-${textAlign} uk-text-${textAlign} uk-margin-remove`}
                >
                  {rightText}
                </span>
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
