import classNames from "classnames";
import { formatNumber } from "../../utils/format";
import classes from "./DisplayValue.module.scss";

export type DisplayValueProps = {
  value: number;
  decimals?: number;
  currency?: string;
  parentheses?: boolean;
  minDecimals?: number;
};

const DisplayValue: React.FC<DisplayValueProps> = props => {
  return (
    <span className={classNames(classes.value)}>
      {props.parentheses && "("}~
      {formatNumber(
        props.value,
        props.decimals || 2,
        props.minDecimals ?? (props.decimals || 2),
      )}
      <sub>{props.currency ?? "USD"}</sub>
      {props.parentheses && ")"}
    </span>
  );
};

export default DisplayValue;
