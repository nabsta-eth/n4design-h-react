import PortfolioTile, { TileProps } from "./PortfolioTile";
import { useTrade } from "../../../context/Trade";
import { DisplayAmount } from "../DisplayAmount";
import { useLanguageStore } from "../../../context/Translation";
import { useTradeAccountDisplay } from "../../../context/TradeAccountDisplay";

const MarginUsageTile = ({
  isLoading,
  title,
  leftText,
  children,
  ...rest
}: TileProps) => {
  const { account, protocol } = useTrade();
  const { t } = useLanguageStore();
  const { currentAccountDisplay } = useTradeAccountDisplay(true);
  const { marginUsageDisplay } = currentAccountDisplay;

  return (
    <PortfolioTile
      key="marginUsage"
      isLoading={isLoading}
      title={t.marginUsage}
      leftText={<DisplayAmount amount={marginUsageDisplay} />}
      {...rest}
    />
  );
};

export default MarginUsageTile;
