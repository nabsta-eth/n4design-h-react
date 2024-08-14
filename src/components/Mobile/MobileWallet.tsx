import {
  useConnectedAccount,
  useUserWalletStore,
} from "@handle-fi/react-components/dist/context/UserWallet";
import { Button } from "..";
import React from "react";
import { truncateAddress } from "../../utils/format";
import QRCode from "react-qr-code";
import { Container } from "@handle-fi/react-components/dist/components/handle_uikit/components/Container";
import { useNavigate } from "react-router-dom";
import WalletActions from "../WalletActions/WalletActions";
import Blockies from "react-blockies";
import { getThemeFile } from "../../utils/ui";
import { useLanguageStore } from "../../context/Translation";
import classNames from "classnames";
import classes from "./MobileWallet.module.scss";
import { useUiStore } from "../../context/UserInterface";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import { useUiMobileStore } from "../../context/UserInterfaceMobile";
import NetworkDisplay from "../NetworkDisplay";

const MobileWallet: React.FC = () => {
  const { setWalletChoice, connection, disconnectWallet } =
    useUserWalletStore();
  const { t } = useLanguageStore();
  const { activeTheme } = useUiStore();
  const theme = getThemeFile(activeTheme);
  const { activeMenuItemTitle } = useUiMobileStore();
  const connectedAccount = useConnectedAccount();
  React.useEffect(() => {
    if (!connection.user.isConnected) {
      setWalletChoice({ walletName: "dynamic", dynamicWalletType: undefined });
      navigate("/");
    }
  }, [connection.user]);
  const navigate = useNavigate();
  const internalDisconnectWallet = () => {
    disconnectWallet();
    navigate("/");
  };
  return (
    <div className="uk-width-expand uk-height-1-1 uk-flex uk-flex-column">
      <div
        className={classNames(
          "uk-flex uk-flex-between uk-flex-middle uk-width-1-1",
          classes.walletHeader,
        )}
      >
        <div className="uk-flex uk-flex-middle">
          <Button
            className="uk-button-text"
            onClick={() => navigate(`/${activeMenuItemTitle}`)}
          >
            <FontAwesomeIcon
              icon={["far", "chevron-left"]}
              className="uk-margin-small-right"
            />
          </Button>

          {connectedAccount && (
            <div className="uk-flex uk-flex-center uk-flex-middle">
              <Blockies
                seed={connectedAccount}
                bg={theme.primaryColor}
                fg={theme.backgroundColor}
                spotColor={theme.errorColor}
                size={6}
                className={classNames(
                  "uk-margin-small-right",
                  classes.identiconBorder,
                )}
              />

              <div className="uk-margin-small-right uk-h5 uk-margin-remove-vertical">
                {truncateAddress(connectedAccount)}
              </div>
            </div>
          )}
        </div>

        <NetworkDisplay showNetworkName />
      </div>

      <Container
        size="large"
        className={classNames(
          "uk-flex uk-flex-wrap uk-flex-middle uk-flex-center uk-width-1-1",
          classes.walletContainer,
        )}
      >
        <div>
          {connectedAccount && (
            <>
              <WalletActions className="uk-margin-small-bottom" />

              <QRCode
                className={classNames("uk-width-1-1", classes.qrCode)}
                width={200}
                value={connectedAccount}
                fgColor={theme.primaryColor}
                bgColor={"transparent"}
              />
            </>
          )}

          <Button
            type="secondary"
            className="uk-margin-top uk-width-1-1 uk-margin-bottom"
            expand={true}
            onClick={internalDisconnectWallet}
          >
            <FontAwesomeIcon
              icon={["fal", "sign-out"]}
              className="uk-margin-small-right"
            />
            {t.disconnect}
          </Button>
        </div>
      </Container>
    </div>
  );
};

export default MobileWallet;
