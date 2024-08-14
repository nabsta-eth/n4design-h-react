import classNames from "classnames";
import { Network } from "handle-sdk";
import { SIGN_TERMS_BUTTON_TEXT } from "../../config";
import { useTermsAndConditions } from "../../context/TermsAndCondtions";
import { getUkTooltip } from "../../utils/general";
import ButtonSmart from "../ButtonSmart/ButtonSmart";
import classes from "./ConvertButtons.module.scss";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";

type Props = {
  connectedAccount?: string;
  isMobile: boolean;
  isUnsupportedNetwork: boolean;
  shouldShowLoadingSequence: boolean;
  reviewConvert: () => void;
  convertButtonDisabled: boolean;
  showAlert: boolean;
  connectedNetwork: Network | undefined;
  convertNetwork: Network;
  highEstimatedImpact: boolean;
  convertButtonTooltip?: string;
  reviewText: string;
};

export const ConvertButtons: React.FC<Props> = props => {
  const {
    shouldShowLoadingSequence,
    reviewConvert,
    convertButtonDisabled,
    showAlert,
    connectedNetwork,
    convertNetwork,
    highEstimatedImpact,
    convertButtonTooltip,
    reviewText,
  } = props;

  const { isSigningDone, isTermsModalOpen } = useTermsAndConditions();

  if (!shouldShowLoadingSequence && convertNetwork !== connectedNetwork) {
    return (
      <ButtonSmart
        expand
        network={convertNetwork}
        className="uk-margin-small-top"
      >
        switch to {convertNetwork}
      </ButtonSmart>
    );
  }

  const buttonText =
    !convertButtonDisabled && !isSigningDone.current
      ? SIGN_TERMS_BUTTON_TEXT
      : reviewText;

  return (
    <ButtonSmart
      expand
      onClick={reviewConvert}
      disabled={convertButtonDisabled}
      loading={
        isTermsModalOpen ||
        (shouldShowLoadingSequence && !convertButtonDisabled && !showAlert)
      }
      alert={showAlert}
      network={connectedNetwork}
      className={classNames("uk-margin-small-top", {
        "hfi-orange-button": highEstimatedImpact,
      })}
    >
      {highEstimatedImpact && (
        <FontAwesomeIcon
          icon={["far", "exclamation-triangle"]}
          className="uk-margin-small-right"
        />
      )}
      <span
        uk-tooltip={
          convertButtonTooltip
            ? getUkTooltip({
                position: "top",
                title: convertButtonTooltip,
              })
            : undefined
        }
      >
        <span
          className={classNames(classes.tooltip, {
            "uk-tooltip-content": convertButtonTooltip,
          })}
        >
          {buttonText}
        </span>
      </span>
    </ButtonSmart>
  );
};
