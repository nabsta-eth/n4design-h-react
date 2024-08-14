import { Button } from ".";
import Modal from "@handle-fi/react-components/dist/components/Modal";
import "./Convert/ReviewConvertModal.scss";
import { useTermsAndConditions } from "../context/TermsAndCondtions";
import React, { useEffect, useMemo, useRef, useState } from "react";
import ColouredScrollbars from "./ColouredScrollbars";
import { positionValues } from "react-custom-scrollbars-2";
import { showNotification } from "@handle-fi/react-components/dist/utils/notifications";
import { useUiStore } from "../context/UserInterface";

const TermsAndConditionsModal = () => {
  const {
    termsAndConditions,
    accountSignature,
    signTermsAndConditions,
    closeTermsModal,
    isTermsModalOpen,
  } = useTermsAndConditions();
  const { showChooseWalletModal } = useUiStore();
  const content = useMemo(() => {
    if (!termsAndConditions) {
      return <></>;
    }
    return termsAndConditions.content.split("\n").map((paragraph, i) => (
      // Index as key is fine here.
      <p key={i}>{paragraph}</p>
    ));
  }, [termsAndConditions]);

  const contentRef = useRef<HTMLDivElement | null>(null);
  const [scrollValue, setScrollValue] = useState<positionValues>();
  const [hasScrolledToBottom, setHasScrolledToBottom] =
    useState<boolean>(false);
  useEffect(() => {
    if (!scrollValue || hasScrolledToBottom) {
      return;
    }

    if (
      scrollValue.scrollTop + scrollValue.clientHeight >
      scrollValue.scrollHeight - 10
    )
      setHasScrolledToBottom(true);
  }, [contentRef, scrollValue]);

  const [isProcessing, setIsProcessing] = useState(false);
  const buttonText = useMemo(
    () =>
      hasScrolledToBottom
        ? "I have read and agree to the handle.fi Terms of Use"
        : "please read to the bottom",
    [hasScrolledToBottom],
  );

  if (
    !termsAndConditions ||
    !accountSignature ||
    !signTermsAndConditions ||
    !closeTermsModal ||
    !isTermsModalOpen
  ) {
    return <></>;
  }

  const onAgreement = async () => {
    setIsProcessing(true);
    try {
      await signTermsAndConditions();
      showNotification({
        status: "success",
        message: "terms signed successfully",
      });
    } catch {
      showNotification({ status: "error", message: "error signing terms" });
    } finally {
      closeTermsModal();
      setIsProcessing(false);
      setHasScrolledToBottom(false);
    }
  };

  return (
    <Modal
      show={true}
      onClose={() => {
        closeTermsModal();
        setHasScrolledToBottom(false);
      }}
      title={"terms of use"}
      classes="terms-of-use-modal"
      style={{
        zIndex: 1337,
      }}
      showChooseWalletModal={showChooseWalletModal}
    >
      <ColouredScrollbars style={{ height: "30rem" }} onUpdate={setScrollValue}>
        <div className={"tou-content"} ref={contentRef}>
          {content}
        </div>
      </ColouredScrollbars>
      <div>
        <Button
          onClick={onAgreement}
          disabled={!hasScrolledToBottom || isProcessing}
          className="uk-width-expand uk-padding-remove-horizontal tou-button"
        >
          {buttonText}
        </Button>
      </div>
    </Modal>
  );
};

export default TermsAndConditionsModal;
