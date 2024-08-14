import classNames from "classnames";
import { CSSProperties } from "react";
import ChartLoader from "../ChartLoader";

type Props = {
  className?: string;
  style?: CSSProperties;
};

const TradeChartLoader = (props: Props) => {
  return (
    <div
      style={props.style ? props.style : undefined}
      className={classNames(
        props.className,
        "uk-flex uk-flex-center uk-flex-middle uk-width-expand hfi-background uk-flex-column uk-height-1-1",
      )}
    >
      <ChartLoader />
    </div>
  );
};

export default TradeChartLoader;
