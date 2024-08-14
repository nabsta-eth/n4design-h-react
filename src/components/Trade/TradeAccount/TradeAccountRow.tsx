import classNames from "classnames";
import { RowProps } from "./TradeAccount";
import classes from "./TradeAccount.module.scss";

export const TradeAccountRow = (props: RowProps) => {
  const { tooltip, leftSide, rightSide, className } = props;
  const fullTooltip =
    typeof rightSide === "string" && tooltip
      ? `title: ${tooltip
          .join("<br/>")
          .replace("#value#", rightSide)}; pos: bottom-right;`
      : undefined;

  return (
    <div
      className={classNames(className, classes.row, "uk-flex uk-flex-between")}
    >
      <div className="uk-text-nowrap">{leftSide}</div>

      <div
        className="uk-text-right uk-flex uk-flex-middle"
        uk-tooltip={fullTooltip}
      >
        <span className={classNames({ "uk-tooltip-content": !!tooltip })}>
          {rightSide}
        </span>
      </div>
    </div>
  );
};
