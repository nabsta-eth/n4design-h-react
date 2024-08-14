import React from "react";
import { getLocaleNumberSeparators } from "../../utils/general";
import classes from "./DisplayAmount.module.scss";

export const DisplayAmount = (props: { amount: string }) => {
  const decimalSeparator = getLocaleNumberSeparators().decimalSeparator;
  const [integer, remainder] = props.amount.split(decimalSeparator);
  return (
    <span>
      {integer}
      {remainder && (
        <span className={classes.subscript}>
          {decimalSeparator}
          {remainder}
        </span>
      )}
    </span>
  );
};
