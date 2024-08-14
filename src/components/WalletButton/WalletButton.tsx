import {
  useConnectedAccount,
  useConnectedNetwork,
  useUserWalletStore,
} from "@handle-fi/react-components/dist/context/UserWallet";
import "./walletbutton.scss";
import { Dropdown } from "@handle-fi/react-components/dist/components/handle_uikit/components/Dropdown";
import React from "react";
import { truncateAddress } from "../../utils/format";
import QRCode from "react-qr-code";
import { getThemeFile, themeFile } from "../../utils/ui";
import WalletActions from "../WalletActions/WalletActions";
import Button from "../Button";
import UIkit from "uikit";
import classNames from "classnames";
import { useLanguageStore } from "../../context/Translation";
import { useUiStore } from "../../context/UserInterface";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import { NETWORK_NAME_TO_LOGO_URL } from "@handle-fi/react-components";
import { networkNameToShow } from "@handle-fi/react-components/dist/utils/general";

type Props = {
  id?: string;
  text?: string;
  className?: string;
  onChooseWallet: () => void;
  disabled?: boolean;
};

const dropdownOffset = 0;

const WalletButton: React.FC<Props> = props => {
  const { children, ...rest } = props;
  const { disconnectWallet, connection } = useUserWalletStore();
  const connectedAccount = useConnectedAccount();
  const network = useConnectedNetwork();
  const { showChooseWalletModal, activeTheme } = useUiStore();
  const { t } = useLanguageStore();

  const id = props.id || "wallet-button";

  const buttonDisconnectedText = props.text ? props.text : t.connect;
  const buttonText =
    showChooseWalletModal || connection.user.isConnecting
      ? `${t.connecting}...`
      : connectedAccount ?? buttonDisconnectedText;

  return (
    <>
      <Button
        id={id}
        type="secondary"
        size="small"
        className={classNames(
          "uk-flex uk-flex-center uk-flex-middle uk-flex-nowrap",
          {
            "hfi-metamask-button": !props.text,
          },
        )}
        disabled={props.disabled}
        onClick={
          connectedAccount && !props.disabled
            ? () => UIkit.dropdown(".wallet-dropdown").show()
            : props.onChooseWallet
        }
        loading={connection.user.isConnecting}
        style={{
          height: `${
            30 + 2 * Number(themeFile.borderWidth.replace("px", ""))
          }px`,
        }}
        {...rest}
      >
        <FontAwesomeIcon
          icon={["far", "wallet"]}
          className="uk-margin-small-right"
        />

        {connectedAccount ? `${truncateAddress(buttonText)}` : buttonText}
      </Button>

      {connectedAccount && (
        <Dropdown
          className="uk-text-center wallet-dropdown"
          style={{ minWidth: "127px" }}
          options={`mode: click; delay-hide: 0; pos: bottom-justify; boundary: #${id}; boundary-align: true; offset: ${dropdownOffset};`}
        >
          <div className="uk-margin-small-top uk-text-small">
            <img
              className="uk-margin-small-right"
              height="16"
              width="16"
              src={network && NETWORK_NAME_TO_LOGO_URL[network]}
              alt={network}
            />
            {networkNameToShow(network)}
          </div>

          <QRCode
            className="uk-margin-small"
            style={{ maxWidth: "90%" }}
            uk-tooltip={`title: ${t.headerWalletButtonQrCodeTooltip}; pos: bottom;`}
            value={connectedAccount}
            size={100}
            fgColor={getThemeFile(activeTheme).primaryColor}
            bgColor={"transparent"}
          />

          <div className="uk-width-1-1">
            <WalletActions />
          </div>

          <Button
            size="small"
            className="uk-margin-small-top hfi-wallet-button"
            expand={true}
            onClick={disconnectWallet}
          >
            <FontAwesomeIcon
              icon={["fal", "sign-out"]}
              className="uk-margin-small-right"
            />
            {t.disconnect}
          </Button>
        </Dropdown>
      )}
    </>
  );
};

export default WalletButton;
