import * as React from "react";
import {
  useConnectedAccount,
  useConnectedNetwork,
} from "@handle-fi/react-components/dist/context/UserWallet";
import { useNavigate } from "react-router-dom";
import { DEFAULT_ACCOUNT } from "../../config";
import classes from "./MobileDashboard.module.scss";
import { useLanguageStore } from "../../context/Translation";
import { DEFAULT_HLP_NETWORK } from "handle-sdk/dist/components/trade/platforms/hlp/config";
import TradeAccountTile from "../Portfolio/Tiles/TradeAccountTile";
import WalletAssetsTile from "../Portfolio/Tiles/WalletAssetsTile";
import { useSelectedOrConnectedAccount } from "../../hooks/useSelectedOrConnectedAccount";
import useDashboard from "../../hooks/useDashboard";
import TradeAccountUsageTile from "../Portfolio/Tiles/TradeAccountUsageTile";
import TradeAccountLiquidationTile from "../Portfolio/Tiles/TradeAccountLiquidationTile";
import PositionPerformanceTile from "../Portfolio/Tiles/PositionPerformanceTile";
import { mobileMenu } from "./MobileMenu";
import { useUiMobileStore } from "../../context/UserInterfaceMobile";

const MobileDashboard: React.FC = () => {
  const { t } = useLanguageStore();
  const navigate = useNavigate();
  const connectedAccount = useConnectedAccount();
  const account = useSelectedOrConnectedAccount();
  const network = useConnectedNetwork() ?? DEFAULT_HLP_NETWORK;
  const dashboardData = useDashboard({
    account: account ?? DEFAULT_ACCOUNT,
    network: network,
  });
  const { assets } = dashboardData;
  const { setActiveMenuItem } = useUiMobileStore();

  const onClickAssetsTile = () =>
    connectedAccount ? navigate("/assets") : undefined;
  const onClickAccountTile = () => navigate("/account");
  const onClickAccountUsageTile = () => navigate("/account");
  const onClickAccountLiqTile = () => navigate("/account");
  const onClickPositionPerfTile = () => {
    navigate("/positions");
    const activeMenuItemIx = mobileMenu.findIndex(
      menuItem => menuItem.title === "positions",
    );
    setActiveMenuItem(activeMenuItemIx);
  };

  return (
    <div className={classes.portfolioContainer}>
      <div className="uk-h4 uk-margin-xsmall-bottom">{t.dashboard}</div>
      <div className={classes.tileWrapper}>
        <div className="wallet-assets" onClick={onClickAssetsTile}>
          <WalletAssetsTile
            assets={assets.wallet?.assets}
            areLoading={assets.wallet?.areLoading}
            className={classes.tile}
          />
        </div>
        <div onClick={onClickAccountTile}>
          <TradeAccountTile className={classes.tile} />
        </div>
        <div onClick={onClickPositionPerfTile}>
          <PositionPerformanceTile hideCentreText className={classes.tile} />
        </div>
        <div onClick={onClickAccountUsageTile}>
          <TradeAccountUsageTile className={classes.tile} />
        </div>
        <div onClick={onClickAccountLiqTile}>
          <TradeAccountLiquidationTile
            id="tradeAccountLiquidation"
            className={classes.tile}
          />
        </div>
      </div>
    </div>
  );
};

export default MobileDashboard;
