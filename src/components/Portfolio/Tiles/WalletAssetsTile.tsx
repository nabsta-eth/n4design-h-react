import { constants, ethers } from "ethers";
import {
  bnToDisplayString,
  fxTokenSymbolToCurrency,
} from "../../../utils/format";
import PortfolioTile, { TileProps } from "./PortfolioTile";
import { expandDecimals } from "../../../utils/trade";
import { sumBn } from "../../../utils/general";
import { TokenWithBalanceAndPrice } from "../../../types/tokenInfo";
import { DisplayAmount } from "../DisplayAmount";
import { useLanguageStore } from "../../../context/Translation";
import { useConnectedNetwork } from "@handle-fi/react-components/dist/context/UserWallet";
import { DEFAULT_HLP_NETWORK } from "handle-sdk/dist/components/trade/platforms/hlp/config";
import ButtonSmart from "../../../components/ButtonSmart/ButtonSmart";
import classes from "./PortfolioTile.module.scss";
import { memo } from "react";
import { useSelectedOrConnectedAccount } from "../../../hooks/useSelectedOrConnectedAccount";
import { deepEquals } from "@handle-fi/react-components/dist/utils/general";

type Props = TileProps & {
  assets: TokenWithBalanceAndPrice[] | undefined;
  areLoading?: boolean;
  currency?: string;
};

const WalletAssetsTile = memo(
  ({
    assets,
    areLoading,
    currency,
    title,
    leftText,
    children,
    ...rest
  }: Props) => {
    const { t } = useLanguageStore();
    const connectedOrSelectedAccount = useSelectedOrConnectedAccount();
    const totalWalletAssets =
      assets && !areLoading
        ? sumBn(
            assets.map(t =>
              t.price && t.balance
                ? t.balance.mul(t.price).div(expandDecimals(1, t.decimals))
                : constants.Zero,
            ),
          )
        : ethers.constants.Zero;
    const totalWalletAssetsToDisplay = `${bnToDisplayString(
      totalWalletAssets,
      18,
      2,
    )} ${currency ? fxTokenSymbolToCurrency(currency) : "USD"}`;

    return (
      <PortfolioTile
        key="walletAssets"
        isLoading={!!connectedOrSelectedAccount && areLoading}
        title={t.walletAssets}
        leftText={
          <TileLeftText
            totalWalletAssetsToDisplay={totalWalletAssetsToDisplay}
          />
        }
        {...rest}
      />
    );
  },
  deepEquals,
);

type TileLeftTextProps = {
  totalWalletAssetsToDisplay: string;
};

const TileLeftText = ({ totalWalletAssetsToDisplay }: TileLeftTextProps) => {
  const connectedOrSelectedAccount = useSelectedOrConnectedAccount();
  const network = useConnectedNetwork() ?? DEFAULT_HLP_NETWORK;
  if (connectedOrSelectedAccount)
    return <DisplayAmount amount={totalWalletAssetsToDisplay} />;
  return (
    <ButtonSmart
      id="dashboard-assets-tile-connect-wallet-button"
      className={classes.connectButton}
      size="small"
      network={network}
    />
  );
};

export default WalletAssetsTile;
