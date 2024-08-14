import PortfolioTile, { TileProps } from "./PortfolioTile";
import { useTradePrices } from "../../../context/TradePrices";
import { DisplayAmount } from "../DisplayAmount";
import { useLanguageStore } from "../../../context/Translation";
import useDashboard from "../../../hooks/useDashboard";
import { DEFAULT_ACCOUNT } from "../../../config";
import {
  useConnectedAccount,
  useConnectedNetwork,
} from "@handle-fi/react-components/dist/context/UserWallet";
import { DEFAULT_NETWORK } from "@handle-fi/react-components/dist/utils/web3";
import { constants } from "ethers";
import { expandDecimals } from "../../../utils/trade";
import { bnToDisplayString } from "../../../utils/format";
import { sumBn } from "../../../utils/general";
import { TRADE_LP_DEFAULT_CURRENCY_SYMBOL } from "@handle-fi/react-components";

const WalletAssetsTile = ({
  isLoading,
  leftText,
  children,
  ...rest
}: TileProps) => {
  useTradePrices();
  const { t } = useLanguageStore();
  const connectedAccount = useConnectedAccount();
  const connectedNetwork = useConnectedNetwork();
  const dashboardData = useDashboard({
    account: connectedAccount ?? DEFAULT_ACCOUNT,
    network: connectedNetwork ?? DEFAULT_NETWORK,
  });
  const { assets } = dashboardData;
  const walletAssets = assets?.wallet;
  const totalWalletAssets =
    walletAssets?.assets && !walletAssets?.areLoading
      ? sumBn(
          walletAssets.assets.map(t =>
            t.price && t.balance
              ? t.balance.mul(t.price).div(expandDecimals(1, t.decimals))
              : constants.Zero,
          ),
        )
      : constants.Zero;
  const totalWalletAssetsToDisplay = `${bnToDisplayString(
    totalWalletAssets,
    18,
    2,
  )} ${TRADE_LP_DEFAULT_CURRENCY_SYMBOL}`;

  return (
    <PortfolioTile
      isLoading={isLoading}
      title={t.walletAssets}
      leftText={<DisplayAmount amount={totalWalletAssetsToDisplay} />}
      {...rest}
    />
  );
};

export default WalletAssetsTile;
