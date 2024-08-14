import * as React from "react";
import Modal from "@handle-fi/react-components/dist/components/Modal";
import LanguageChooser from "../LanguageChooser/LanguageChooser";
import { useUiStore } from "../../context/UserInterface";
import { STANDARD_MODAL_WIDTH } from "../../config/constants";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const LanguagesModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { showChooseWalletModal } = useUiStore();
  return (
    <Modal
      show={isOpen}
      onClose={onClose}
      width={STANDARD_MODAL_WIDTH}
      showChooseWalletModal={showChooseWalletModal}
    >
      <LanguageChooser onClose={onClose} />
    </Modal>
  );
};

export default LanguagesModal;
