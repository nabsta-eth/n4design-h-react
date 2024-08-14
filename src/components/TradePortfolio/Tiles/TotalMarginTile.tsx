import PortfolioTile, { TileProps } from "./PortfolioTile";
import { DisplayAmount } from "../DisplayAmount";
import { useLanguageStore } from "../../../context/Translation";
import { useTradeAccountDisplay } from "../../../context/TradeAccountDisplay";

const TotalMarginTile = ({
  isLoading,
  title,
  leftText,
  children,
  ...rest
}: TileProps) => {
  const { t } = useLanguageStore();
  const { currentAccountDisplay } = useTradeAccountDisplay(true);
  const { reservedEquityDisplay } = currentAccountDisplay;

  return (
    <PortfolioTile
      key="totalMargin"
      title={t.totalMargin}
      isLoading={isLoading}
      leftText={<DisplayAmount amount={reservedEquityDisplay} />}
      {...rest}
    />
  );
};

export default TotalMarginTile;
