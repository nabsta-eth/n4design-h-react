import classNames from "classnames";
import { ReactNode } from "react";

export const PositionRow = ({
  left,
  right,
  rightElement,
  className,
}: {
  left: string | JSX.Element;
  right?: string | JSX.Element;
  rightElement?: ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={classNames(
        "uk-flex uk-flex-between uk-flex-middle",
        className,
      )}
    >
      <div>{left}</div>
      {right && <div>{right}</div>}
      {rightElement && <div>{rightElement}</div>}
    </div>
  );
};
