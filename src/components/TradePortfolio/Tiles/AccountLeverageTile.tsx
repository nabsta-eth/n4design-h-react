import PortfolioTile, { TileProps } from "./PortfolioTile";
import { useTrade } from "../../../context/Trade";
import { DisplayAmount } from "../DisplayAmount";
import { useLanguageStore } from "../../../context/Translation";
import { useTradeAccountDisplay } from "../../../context/TradeAccountDisplay";

const AccountLeverageTile = ({
  isLoading,
  title,
  leftText,
  children,
  ...rest
}: TileProps) => {
  const { account, protocol } = useTrade();
  const { t } = useLanguageStore();
  const { currentAccountDisplay } = useTradeAccountDisplay(true);
  const { leverageDisplay } = currentAccountDisplay;

  return (
    <PortfolioTile
      key="accountLeverage"
      isLoading={isLoading}
      title={t.accountLeverage}
      leftText={<DisplayAmount amount={leverageDisplay} />}
      {...rest}
    />
  );
};

export default AccountLeverageTile;
