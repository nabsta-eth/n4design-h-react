import { Network } from "handle-sdk";
import Modal from "@handle-fi/react-components/dist/components/Modal";
import SharePosition from ".././SharePosition/SharePosition";
import { Position } from "handle-sdk/dist/components/trade/position";
import { useLanguageStore } from "../../context/Translation";
import { useUiStore } from "../../context/UserInterface";
import { useEffect } from "react";
import {
  getAnalyticsPositionId,
  sendAnalyticsEvent,
} from "../../utils/analytics";
import { usePosition } from "../../hooks/usePosition";

type Props = {
  position: Position;
  onClose: () => void;
  network?: Network;
};

const SharePositionModal = ({ position, onClose: onCloseExternal }: Props) => {
  const { t } = useLanguageStore();
  const { showChooseWalletModal } = useUiStore();
  const { markPriceDisplay, entryPriceDisplay, pnlPercentDisplay } =
    usePosition(position);
  const onClose = () => {
    onCloseExternal();
  };

  useEffect(() => {
    sendAnalyticsEvent("share", {
      content_type: "trade_position",
      item_id: getAnalyticsPositionId(position),
    });
  }, []);

  return (
    <Modal
      show={!!position}
      onClose={onClose}
      title={t.sharePosition}
      showChooseWalletModal={showChooseWalletModal}
    >
      <SharePosition
        pair={position.pairId.pair}
        isLong={position.isLong}
        entryPriceDisplay={entryPriceDisplay}
        markPriceDisplay={markPriceDisplay}
        pnlPercentDisplay={pnlPercentDisplay}
      />
    </Modal>
  );
};

export default SharePositionModal;
