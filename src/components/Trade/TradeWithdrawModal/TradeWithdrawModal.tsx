import TradeWithdraw from "../TradeWithdraw/TradeWithdraw";
import { useLanguageStore } from "../../../context/Translation";
import classNames from "classnames";
import classes from "./TradeWithdrawModal.module.scss";
import { useTrade } from "../../../context/Trade";
import Modal from "@handle-fi/react-components/dist/components/Modal";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import { useUiStore } from "../../../context/UserInterface";

export type TradeWithdrawModalProps = {
  onClose: () => void;
  show: boolean;
};

const TradeWithdrawModal = (props: TradeWithdrawModalProps) => {
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
              icon={["far", "arrow-up-from-bracket"]}
            />
            {t.withdraw}
          </span>
          <span className="uk-padding-right">
            {"acct: "}
            {tradeAccount?.id}
          </span>
        </div>
      }
      classes="account-withdraw-modal"
      showChooseWalletModal={showChooseWalletModal}
    >
      <TradeWithdraw {...props} />
    </Modal>
  );
};

export default TradeWithdrawModal;
