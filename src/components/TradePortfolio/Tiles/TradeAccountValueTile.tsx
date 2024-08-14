import PortfolioTile, { TileProps } from "./PortfolioTile";
import { useTradePrices } from "../../../context/TradePrices";
import { DisplayAmount } from "../DisplayAmount";
import { useLanguageStore } from "../../../context/Translation";
import { useTradeAccountDisplay } from "../../../context/TradeAccountDisplay";

const TradeAccountValueTile = ({
  isLoading,
  title,
  leftText,
  children,
  ...rest
}: TileProps) => {
  useTradePrices();
  const { t } = useLanguageStore();
  const { currentAccountDisplay } = useTradeAccountDisplay(true);
  const { accountValueDisplay } = currentAccountDisplay;

  return (
    <PortfolioTile
      isLoading={isLoading}
      title={t.accountValue}
      leftText={<DisplayAmount amount={accountValueDisplay} />}
      {...rest}
    />
  );
};

export default TradeAccountValueTile;
