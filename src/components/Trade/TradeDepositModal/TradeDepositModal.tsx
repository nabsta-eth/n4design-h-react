import classNames from "classnames";
import { useLanguageStore } from "../../../context/Translation";
import Deposit from "../TradeDeposit/TradeDeposit";
import classes from "./TradeDepositModal.module.scss";
import { useTrade } from "../../../context/Trade";
import Modal from "@handle-fi/react-components/dist/components/Modal";
import { useUiStore } from "../../../context/UserInterface";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";

export type TradeDepositModalProps = {
  onClose: () => void;
  show: boolean;
};

const TradeDepositModal = (props: TradeDepositModalProps) => {
  const { showChooseWalletModal } = useUiStore();
  const { account: tradeAccount } = useTrade();
  const { t } = useLanguageStore();
  return (
    <Modal
      show={props.show}
      onClose={props.onClose}
      title={
        <div
          className={classNames(
            "uk-margin-xsmall-bottom uk-flex uk-flex-between",
            classes.modalHeader,
          )}
        >
          <span>
            <FontAwesomeIcon
              className="uk-margin-small-right"
              icon={["far", "arrow-down-to-bracket"]}
            />
            {t.deposit}
          </span>

          <span className="uk-padding-right">
            {tradeAccount?.id
              ? `account: ${tradeAccount?.id}`
              : "create account"}
          </span>
        </div>
      }
      classes="account-deposit-modal"
      showChooseWalletModal={showChooseWalletModal}
    >
      <Deposit {...props} />
    </Modal>
  );
};

export default TradeDepositModal;
