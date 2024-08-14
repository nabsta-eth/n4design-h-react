import PortfolioTile, { TileProps } from "./PortfolioTile";
import classNames from "classnames";
import { bnToDisplayString } from "../../../utils/format";
import { AMOUNT_DECIMALS } from "handle-sdk/dist/components/trade";
import { USD_DISPLAY_DECIMALS, expandDecimals } from "../../../utils/trade";
import { DisplayAmount } from "../DisplayAmount";
import { useLanguageStore } from "../../../context/Translation";
import { useTradeAccountDisplay } from "../../../context/TradeAccountDisplay";

const TotalReturnTile = ({
  isLoading,
  title,
  leftText,
  children,
  ...rest
}: TileProps) => {
  const { t } = useLanguageStore();
  const { currentAccountDisplay } = useTradeAccountDisplay(true);
  const { unrealisedEquity, reservedEquity } = currentAccountDisplay;
  const totalPnlDisplay = reservedEquity.gt(0)
    ? `${bnToDisplayString(
        unrealisedEquity
          .mul(expandDecimals(1, AMOUNT_DECIMALS))
          .mul(100)
          .div(reservedEquity),
        AMOUNT_DECIMALS,
        USD_DISPLAY_DECIMALS,
      )}%`
    : "0.00%";

  return (
    <PortfolioTile
      key="totalReturn"
      title={t.totalReturn}
      isLoading={isLoading}
      leftText={
        <span
          className={classNames({
            "hfi-up": unrealisedEquity.gt(0),
            "hfi-down": unrealisedEquity.lt(0),
          })}
        >
          <DisplayAmount amount={totalPnlDisplay} />
        </span>
      }
      {...rest}
    />
  );
};

export default TotalReturnTile;
