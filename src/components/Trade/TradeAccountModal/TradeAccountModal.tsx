import Modal from "@handle-fi/react-components/dist/components/Modal";
import { useTrade } from "../../../context/Trade";
import Account from "../TradeAccount/TradeAccount";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import { useUiStore } from "../../../context/UserInterface";
import { STANDARD_MODAL_WIDTH } from "../../../config/constants";

export type TradeAccountModalProps = {
  onClose: () => void;
  show: boolean;
};

const TradeAccountModal = (props: TradeAccountModalProps) => {
  const { showChooseWalletModal } = useUiStore();
  const { account } = useTrade();
  return (
    <Modal
      show={props.show}
      onClose={props.onClose}
      title={
        <div className="uk-margin-xsmall-bottom uk-flex uk-flex-between">
          <span>
            <FontAwesomeIcon
              className="uk-margin-small-right"
              icon={["far", "database"]}
            />
            {"account"}
          </span>
          <span id={"modal-account-id"}>{account?.id}</span>
        </div>
      }
      classes="trade-account-modal"
      width={STANDARD_MODAL_WIDTH}
      showChooseWalletModal={showChooseWalletModal}
    >
      <Account modal />
    </Modal>
  );
};

export default TradeAccountModal;
