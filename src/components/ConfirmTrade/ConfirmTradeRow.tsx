import classNames from "classnames";
import React from "react";

export const Row = ({
  left,
  right,
  classes,
}: {
  left: string;
  right: string | JSX.Element;
  classes?: string;
}) => {
  return (
    <div className={classNames("uk-flex uk-flex-between", classes)}>
      <div>{left}</div>
      <div>{right}</div>
    </div>
  );
};
