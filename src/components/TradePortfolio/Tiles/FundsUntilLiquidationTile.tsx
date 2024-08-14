import PortfolioTile, { TileProps } from "./PortfolioTile";
import { DisplayAmount } from "../DisplayAmount";
import { useLanguageStore } from "../../../context/Translation";
import { useTradeAccountDisplay } from "../../../context/TradeAccountDisplay";

const FundsUntilLiquidationTile = ({
  isLoading,
  title,
  leftText,
  children,
  ...rest
}: TileProps) => {
  const { t } = useLanguageStore();
  const { currentAccountDisplay } = useTradeAccountDisplay(true);
  const { fundsUntilLiquidationDisplay } = currentAccountDisplay;

  return (
    <PortfolioTile
      key="fundsUntilLiquidation"
      isLoading={isLoading}
      title={t.fundsUntilLiquidation}
      leftText={<DisplayAmount amount={fundsUntilLiquidationDisplay} />}
      {...rest}
    />
  );
};

export default FundsUntilLiquidationTile;
