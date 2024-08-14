import classNames from "classnames";
import classes from "./PowerTile.module.scss";
import { useUiStore } from "../../context/UserInterface";
import { Dropdown } from "@handle-fi/react-components/dist/components/handle_uikit/components/Dropdown";
import {
  useConnectedAccount,
  useConnectedNetwork,
  useUserWalletStore,
} from "@handle-fi/react-components/dist/context/UserWallet";
import Blockies from "react-blockies";
import { getThemeFile } from "../../utils/ui";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import { Button } from "@handle-fi/react-components/dist/components/handle_uikit/components/Button";
import { OctButton } from "../OctButton/OctButton";
import SelectNetwork from "../SelectNetwork";
import { Network } from "handle-sdk";
import UIkit from "uikit";
import { truncateAddress } from "../../utils/format";
import copy from "copy-to-clipboard";
import { getExplorerMetadata } from "@handle-fi/react-components/dist/utils/general";
import { useLanguageStore } from "../../context/Translation";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { QrCode } from "./QrCode";
import { TradingModeChooser } from "../TradingModeChooser/TradingModeChooser";
import { usePowerTileStore } from "@handle-fi/react-components/dist/context/PowerTile";
import {
  WALLET_BUTTON_GROUP_ID,
  WALLET_BUTTON_ID,
} from "../../config/constants";
import { getNetworkToBeDisplayed } from "../Header/RightHeaderComponents";
import { WALLET_DROPDOWN_ID } from "@handle-fi/react-components";

type PowerTileProps = {
  mainContent?: JSX.Element;
};

export const PowerTile = ({ mainContent }: PowerTileProps) => {
  const { isMobile, setShowChooseWalletModal, swipe } = useUiStore();
  const { disconnectWallet } = useUserWalletStore();
  const connectedAccount = useConnectedAccount();
  const { isPowerTileOpen, setIsPowerTileOpen } = usePowerTileStore();
  const walletButtonId = `${isMobile ? "mobile" : WALLET_BUTTON_ID}`;
  const walletButtonBoundaryId = `${
    isMobile ? "mobile" : "desktop"
  }-${WALLET_BUTTON_GROUP_ID}`;
  const walletDropdownId = `${
    isMobile ? "mobile" : "desktop"
  }-${WALLET_DROPDOWN_ID}`;
  const dropdownBoundaryString = isMobile
    ? ""
    : ` boundary: #${walletButtonBoundaryId}; boundary-align: true; offset: -32;`;

  const isConnectedAddress = connectedAccount;

  useEffect(() => {
    if (swipe.swipeDirection !== "none" && isPowerTileOpen) {
      onCloseInternal();
    }
  }, [swipe]);

  const onCloseInternal = () => {
    setShowQrCode(false);
    setShowOct(false);
    setIsPowerTileOpen(false);
    UIkit.dropdown(`#${walletDropdownId}`).hide();
  };

  const onClickDisconnectInternal = () => {
    setShowChooseWalletModal(false);
    setShowQrCode(false);
    disconnectWallet();
  };

  const [showQrCode, setShowQrCode] = useState(false);
  const onClickQrCodeButton = () => {
    setIsPowerTileOpen(true);
    setShowQrCode(current => !current);
  };

  const [showOct, setShowOct] = useState(false);
  const onClickOctButton = () => {
    setShowQrCode(false);
    setShowOct(open => !open);
  };

  const showMainContent = !showOct;

  const onCloseOct = () => {
    setShowOct(false);
  };

  return (
    <>
      <div
        className={classNames(classes.backdrop, {
          [classes.show]: isPowerTileOpen,
        })}
        onClick={onCloseInternal}
      />
      <Dropdown
        id={walletDropdownId}
        options={`mode: click; toggle: #${walletButtonId}; delay-hide: 0; pos: bottom-right;${dropdownBoundaryString}`}
        className={classNames("uk-dropdown", classes.dropdown, {
          [classes.mobile]: isMobile,
          "uk-open": isPowerTileOpen,
        })}
      >
        {isMobile && showQrCode && isConnectedAddress && (
          <div className={classes.qrCodeWrapper}>
            <QrCode />
          </div>
        )}

        <div className={classNames(classes.powerTile)}>
          <div className={classNames(classes.content)}>
            <Button
              icon
              type="default"
              className={classNames(
                classes.closeButton,
                "uk-modal-close-default uk-button-no-hover",
              )}
              onClick={onCloseInternal}
            >
              <FontAwesomeIcon
                icon={["far", isMobile ? "chevron-down" : "times"]}
              />
            </Button>

            <div
              className={classNames("uk-margin-xsmall-bottom", classes.header)}
            >
              <WalletAddressDisplay />

              <AddressButtons
                showQrCode={showQrCode}
                setShowQrCode={setShowQrCode}
                onClickQrCodeButton={onClickQrCodeButton}
              />

              <WalletButtons
                showOct={showOct}
                onClickOctButton={onClickOctButton}
                onCloseInternal={onCloseInternal}
              />

              <DisconnectButton
                onClickDisconnectInternal={onClickDisconnectInternal}
              />
            </div>

            {showMainContent && !!mainContent && mainContent}

            {showOct && <TradingModeChooser onClose={onCloseOct} />}
          </div>
        </div>

        {!isMobile && showQrCode && isConnectedAddress && (
          <div className={classes.qrCodeWrapper}>
            <QrCode />
          </div>
        )}
      </Dropdown>
    </>
  );
};

const WalletAddressDisplay = () => {
  const connectedAccount = useConnectedAccount();
  const { activeTheme } = useUiStore();
  if (!connectedAccount) {
    console.warn("No connected account");
    return null;
  }
  const themeFile = getThemeFile(activeTheme);
  return (
    <>
      <Blockies
        seed={connectedAccount}
        bg={themeFile.primaryColor}
        fg={themeFile.backgroundColor}
        spotColor={themeFile.errorColor}
        size={6}
        className={classNames(classes.identicon)}
      />
      <span className={classes.address}>
        {truncateAddress(connectedAccount, 5, 4)}
      </span>
    </>
  );
};

const AddressButtons = ({
  showQrCode,
  setShowQrCode,
  onClickQrCodeButton,
}: {
  showQrCode: boolean;
  setShowQrCode: Dispatch<SetStateAction<boolean>>;
  onClickQrCodeButton: () => void;
}) => {
  const { isMobile } = useUiStore();
  const { t } = useLanguageStore();
  const connectedAccount = useConnectedAccount();
  const connectedNetwork = useConnectedNetwork();
  if (!connectedAccount) {
    console.warn("No connected account");
    return null;
  }

  const explorerMetadata =
    connectedAccount && connectedNetwork
      ? getExplorerMetadata(connectedAccount, "address", connectedNetwork)
      : undefined;
  const copyToClipboard = () => {
    setShowQrCode(false);
    copy(connectedAccount);
  };
  return (
    <div
      className={classNames("hfi-button-collection", classes.addressButtons)}
    >
      <Button
        icon
        type="secondary"
        className="hfi-powertile-button"
        onClick={copyToClipboard}
        tooltip={
          isMobile
            ? undefined
            : {
                text: t.copyToClipboard,
                position: "bottom",
              }
        }
      >
        <FontAwesomeIcon icon={["far", "copy"]} />
      </Button>

      <Button
        icon
        type="secondary"
        className={classNames(classes.linkButton, "hfi-powertile-button")}
        href={explorerMetadata?.url || "#"}
        tooltip={
          isMobile
            ? undefined
            : {
                text: t.viewAddressOnBlockExplorer,
                position: "bottom",
              }
        }
      >
        <FontAwesomeIcon icon={["far", "external-link-square"]} />
      </Button>

      <Button
        icon
        type="secondary"
        className={classNames("hfi-powertile-button", classes.qrCodeButton, {
          "uk-active": showQrCode,
        })}
        onClick={onClickQrCodeButton}
        tooltip={
          isMobile
            ? undefined
            : {
                text: t.toggleQrCode,
                position: "bottom",
              }
        }
      >
        <FontAwesomeIcon icon={["far", "qrcode"]} />
      </Button>
    </div>
  );
};

const WalletButtons = ({
  showOct,
  onClickOctButton,
  onCloseInternal,
}: {
  showOct: boolean;
  onClickOctButton: () => void;
  onCloseInternal: () => void;
}) => {
  const { isMobile } = useUiStore();
  const { connection, switchNetwork } = useUserWalletStore();
  const networkToBeDisplayed = getNetworkToBeDisplayed(connection);

  const onSwitchNetwork = (newNetwork: Network) => {
    onCloseInternal();
    switchNetwork(newNetwork).catch(console.error);
  };

  return (
    <div className={classNames("hfi-button-collection", classes.walletButtons)}>
      <OctButton show={showOct} onClick={onClickOctButton} />

      <SelectNetwork
        id="powertile-select-network"
        containerId={isMobile ? "mobile-bottom-taskbar" : "header"}
        dropdownClassName={classes.networkDropdown}
        wrapperClassName={classNames(
          "hfi-powertile-button",
          classes.networkSelect,
        )}
        value={networkToBeDisplayed}
        onChange={onSwitchNetwork}
        showIconRight
        showIconButton
        dropdownOffset="4"
        dropdownPosition="bottom-right"
      />
    </div>
  );
};

const DisconnectButton = ({
  onClickDisconnectInternal,
}: {
  onClickDisconnectInternal: () => void;
}) => {
  const { isMobile } = useUiStore();
  const { t } = useLanguageStore();
  return (
    <div
      className={classNames("hfi-button-collection", classes.disconnectButton)}
    >
      <Button
        icon
        type="secondary"
        className="hfi-powertile-button"
        onClick={onClickDisconnectInternal}
        tooltip={
          isMobile
            ? undefined
            : {
                text: t.disconnectWallet,
                position: "bottom",
              }
        }
      >
        <FontAwesomeIcon icon={["far", "plug-circle-xmark"]} />
      </Button>
    </div>
  );
};
