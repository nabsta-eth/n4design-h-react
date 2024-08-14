import classNames from "classnames";
import { RowProps } from "./TradeForm";

export const TradeFormRow = (props: RowProps) => {
  const { id, className, tooltip, leftSide, rightSide } = props;
  const fullTooltip =
    typeof rightSide === "string" && tooltip
      ? `title: ${tooltip
          .join("<br/>")
          .replace("#value#", rightSide)}; pos: bottom-right;`
      : undefined;

  return (
    <div id={id} className={classNames(className, "uk-flex uk-flex-between")}>
      <div>{leftSide}</div>

      <div uk-tooltip={fullTooltip}>
        <span className={classNames({ "uk-tooltip-content": !!tooltip })}>
          {rightSide}
        </span>
      </div>
    </div>
  );
};
