import ClosePosition from "../ClosePosition/ClosePosition";
import Modal from "@handle-fi/react-components/dist/components/Modal";
import { useLanguageStore } from "../../context/Translation";
import classNames from "classnames";
import classes from "./ClosePositionModal.module.scss";
import { useUiStore } from "../../context/UserInterface";
import { Position } from "handle-sdk/dist/components/trade/position";
import { WIDTH_OF_TRADE_CONFIRM_REDUCE_MODALS } from "../../config/trade";
import { useEffect, useState } from "react";
type Props = {
  position: Position;
  onClose: () => void;
};

const ClosePositionModal = ({ position, onClose: onCloseExternal }: Props) => {
  const { t } = useLanguageStore();
  const { showChooseWalletModal } = useUiStore();

  const [title, setTitle] = useState(t.reduceOrClosePosition);
  const [sliderPercentage, setSliderPercentage] = useState(0);

  const onClose = () => {
    onCloseExternal();
  };

  const onUpdateSliderPercentage = (newPercentage: number) => {
    setSliderPercentage(newPercentage);
  };

  useEffect(() => {
    const title = sliderPercentage === 100 ? t.closePosition : t.reducePosition;
    setTitle(title);
  }, [sliderPercentage]);

  return (
    <Modal
      show={!!position}
      onClose={onClose}
      title={title}
      classes={classNames("close-position-modal", classes.modal)}
      showChooseWalletModal={showChooseWalletModal}
      width={WIDTH_OF_TRADE_CONFIRM_REDUCE_MODALS}
    >
      <ClosePosition
        position={position}
        onClose={onClose}
        onUpdateSliderPercentage={onUpdateSliderPercentage}
      />
    </Modal>
  );
};

export default ClosePositionModal;
