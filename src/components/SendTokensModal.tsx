import * as React from "react";
import Modal from "@handle-fi/react-components/dist/components/Modal";
import SendTokens from "./SendTokens/SendTokens";
import { TokenWithBalanceAndPrice } from "../types/tokenInfo";
import { useUiStore } from "../context/UserInterface";
import { SpritesheetIcon } from "@handle-fi/react-components/dist/components/SpritesheetIcon/SpritesheetIcon";
import { config } from "../config";
import { networkNameToShow } from "@handle-fi/react-components/dist/utils/general";
import { NETWORK_NAME_TO_LOGO_URL } from "@handle-fi/react-components";
import { Network } from "handle-sdk";

type Props = {
  token: TokenWithBalanceAndPrice;
  network: Network;
  onClose: (areSent?: boolean) => void;
};

const SendTokensModal: React.FC<Props> = ({ token, network, onClose }) => {
  const { showChooseWalletModal } = useUiStore();
  if (!token) {
    console.debug("No token provided to SendTokensModal");
    return null;
  }
  const modalTitle = (
    <div className="uk-flex uk-flex-middle">
      send
      <SpritesheetIcon
        iconName={token.symbol}
        sizePx={22}
        style={{ marginTop: 0 }}
        className="uk-margin-small-left uk-margin-xsmall-right"
        fallbackSrc={token.logoURI ?? config.tokenIconPlaceholderUrl}
      />
      {token.symbol} on
      <img
        src={NETWORK_NAME_TO_LOGO_URL[network]}
        alt={network}
        width="22"
        className="uk-margin-small-left uk-margin-xsmall-right"
      />
      {networkNameToShow(network)}
    </div>
  );
  return (
    <Modal
      modalClasses={`${token.symbol}-send-modal`}
      title={modalTitle}
      show={!!token}
      onClose={() => onClose(false)}
      showChooseWalletModal={showChooseWalletModal}
    >
      <SendTokens token={token} network={network} onClose={onClose} />
    </Modal>
  );
};

export default SendTokensModal;
