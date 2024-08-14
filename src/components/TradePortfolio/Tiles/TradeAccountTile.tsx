import PortfolioTile, { TileProps } from "./PortfolioTile";
import { useTradePrices } from "../../../context/TradePrices";
import { DisplayAmount } from "../DisplayAmount";
import { useLanguageStore } from "../../../context/Translation";
import { useTradeAccountDisplay } from "../../../context/TradeAccountDisplay";
import { useTrade } from "../../../context/Trade";

const TradeAccountTile = ({
  isLoading,
  leftText,
  children,
  ...rest
}: TileProps) => {
  useTradePrices();
  const { t } = useLanguageStore();
  const { account } = useTrade();
  const { currentAccountDisplay } = useTradeAccountDisplay(true);
  const { accountValueDisplay } = currentAccountDisplay;
  const title = `${t.tradeAccount}${account?.id ? ": " : ""}${
    account?.id ? account.id : ""
  }`;

  return (
    <PortfolioTile
      isLoading={isLoading}
      title={title}
      leftText={<DisplayAmount amount={accountValueDisplay} />}
      {...rest}
    />
  );
};

export default TradeAccountTile;
