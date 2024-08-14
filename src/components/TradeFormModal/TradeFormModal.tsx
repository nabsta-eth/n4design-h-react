import Modal from "@handle-fi/react-components/dist/components/Modal";
import { useLanguageStore } from "../../context/Translation";
import TradeForm from "../Trade/TradeForm/TradeForm";
import React from "react";
import classes from "./TradeFormModal.module.scss";
import classNames from "classnames";
import { useUiStore } from "../../context/UserInterface";
import { TradePair } from "handle-sdk/dist/components/trade";
import {
  WIDTH_OF_TRADE_CONFIRM_REDUCE_MODALS,
  WIDTH_OF_TRADE_MODAL,
} from "../../config/trade";
import { useTradeSize } from "../../context/TradeSize";
import { constants } from "ethers";

type Props = {
  pair: TradePair;
  isLong: boolean;
  onClose: () => void;
};

const TradeModal = ({ pair, isLong, onClose }: Props) => {
  const { t } = useLanguageStore();
  const { showChooseWalletModal } = useUiStore();
  const [confirmOpen, setConfirmOpen] = React.useState<boolean>(false);
  const onConfirmOpen = (open: boolean) => setConfirmOpen(open);
  const { setSize, setSizeLpc } = useTradeSize();

  const onCloseInternal = () => {
    setSize(constants.Zero);
    setSizeLpc(constants.Zero);
    onClose();
  };

  return (
    <Modal
      show={!!pair}
      onClose={onCloseInternal}
      title={t.trade}
      classes="trade-modal"
      width={
        confirmOpen
          ? WIDTH_OF_TRADE_CONFIRM_REDUCE_MODALS
          : WIDTH_OF_TRADE_MODAL
      }
      modalClasses={classNames({ [classes.confirmOpen]: confirmOpen })}
      showChooseWalletModal={showChooseWalletModal}
    >
      <TradeForm
        side={isLong ? "buy" : "sell"}
        modal
        closeModal={onCloseInternal}
        onConfirmOpen={(open: boolean) => onConfirmOpen(open)}
      />
    </Modal>
  );
};

export default TradeModal;
