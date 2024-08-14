import classNames from "classnames";

export const TradeDepositRow = ({
  left,
  right,
  classes,
}: {
  left: string | JSX.Element;
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
