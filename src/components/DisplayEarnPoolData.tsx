import classNames from "classnames";

export type Props = {
  title: string;
  symbol: string;
  data: string | undefined;
};

const DisplayEarnPoolData = (props: Props) => {
  return (
    <div
      className={classNames({
        "disabled-opacity": !props.data,
      })}
    >
      {props.title}: {props.data ? `${props.data} ${props.symbol}` : "-"}
    </div>
  );
};

export default DisplayEarnPoolData;
