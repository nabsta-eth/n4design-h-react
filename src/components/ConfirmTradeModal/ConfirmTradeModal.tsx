import Modal from "@handle-fi/react-components/dist/components/Modal";
import { useLanguageStore } from "../../context/Translation";
import ConfirmTrade, { ConfirmTradeProps } from "../ConfirmTrade/ConfirmTrade";
import "./ConfirmTradeModal.scss";
import { useUiStore } from "../../context/UserInterface";
import { WIDTH_OF_TRADE_CONFIRM_REDUCE_MODALS } from "../../config/trade";

export type ConfirmTradeModalProps = ConfirmTradeProps & {
  show: boolean;
};

const ConfirmTradeModal = (props: ConfirmTradeModalProps) => {
  const { showChooseWalletModal } = useUiStore();
  const { t } = useLanguageStore();
  const title = t.confirmTrade;
  return (
    <Modal
      show={props.show}
      onClose={props.onClose}
      width={WIDTH_OF_TRADE_CONFIRM_REDUCE_MODALS}
      title={title}
      classes="confirm-trade-modal"
      showChooseWalletModal={showChooseWalletModal}
    >
      <ConfirmTrade {...props} />
    </Modal>
  );
};

export default ConfirmTradeModal;
