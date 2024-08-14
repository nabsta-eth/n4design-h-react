import * as React from "react";
import Modal from "@handle-fi/react-components/dist/components/Modal";
import { useUiStore } from "../../context/UserInterface";
import { TradingModeChooser } from "../TradingModeChooser/TradingModeChooser";

type Props = {
  open: boolean;
  onClose: () => void;
};

const OneClickTradingModal: React.FC<Props> = ({ open, onClose }) => {
  const { showChooseWalletModal } = useUiStore();
  return (
    <Modal
      show={open}
      onClose={onClose}
      showChooseWalletModal={showChooseWalletModal}
      width={500}
    >
      <TradingModeChooser onClose={onClose} isModal />
    </Modal>
  );
};

export default OneClickTradingModal;
