import Modal from "@handle-fi/react-components/dist/components/Modal";
import "./Convert/ReviewConvertModal.scss";
import ReviewConvert, { ReviewConvertProps } from "./ReviewConvert";
import { useUiStore } from "../context/UserInterface";

type ReviewConvertModalProps = ReviewConvertProps & {
  show: boolean;
  onClose: () => void;
};

const ReviewConvertModal = ({
  show,
  onClose,
  fromToken,
  toToken,
  onConvert,
  quote,
}: ReviewConvertModalProps) => {
  const { showChooseWalletModal } = useUiStore();
  return (
    <Modal
      show={show}
      onClose={onClose}
      title={"confirm details"}
      classes="review-convert-modal"
      showChooseWalletModal={showChooseWalletModal}
    >
      <ReviewConvert
        fromToken={fromToken}
        toToken={toToken}
        onConvert={onConvert}
        quote={quote}
      />
    </Modal>
  );
};

export default ReviewConvertModal;
