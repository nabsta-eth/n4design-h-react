import PortfolioTile, { TileProps } from "./PortfolioTile";
import { useTradePrices } from "../../../context/TradePrices";
import { DisplayAmount } from "../DisplayAmount";
import { useLanguageStore } from "../../../context/Translation";
import { useTradeAccountDisplay } from "../../../context/TradeAccountDisplay";

const TradeAccountAvailableTile = ({
  isLoading,
  title,
  leftText,
  children,
  ...rest
}: TileProps) => {
  useTradePrices();
  const { t } = useLanguageStore();
  const { currentAccountDisplay } = useTradeAccountDisplay(true);
  const { availableEquityDisplay } = currentAccountDisplay;

  return (
    <PortfolioTile
      key="account"
      isLoading={isLoading}
      title={t.availableFunds}
      leftText={<DisplayAmount amount={availableEquityDisplay} />}
      {...rest}
    />
  );
};

export default TradeAccountAvailableTile;
