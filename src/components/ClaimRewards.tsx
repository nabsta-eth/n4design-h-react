import { ContractTransaction, ethers } from "ethers";
import { Network } from "handle-sdk";
import { ButtonSmart } from ".";
import { SIGN_TERMS_BUTTON_TEXT } from "../config";
import { getClaimedRewardsNotification } from "../config/notifications";
import { useTermsAndConditions } from "../context/TermsAndCondtions";
import useSendTransaction from "../hooks/useSendTransaction";

type Props = {
  claimableRewards: ethers.BigNumber | undefined;
  /// Allows overriding the enable status. Useful when omitting the reward amount.
  enabled?: boolean;
  network: Network;
  onClaim: (options: ethers.Overrides) => Promise<ContractTransaction>;
  refreshData: () => Promise<void[]>;
  text?: string;
};

const ClaimRewards: React.FC<Props> = ({
  claimableRewards,
  network,
  onClaim,
  refreshData,
  text,
  enabled,
}) => {
  const sendTransaction = useSendTransaction();
  const { isSigningDone, ensureTermsSigned, isTermsModalOpen } =
    useTermsAndConditions();

  const onSubmit = async () => {
    if (!isSigningDone.current) {
      await ensureTermsSigned();
      return;
    }

    if (!enabled && !claimableRewards) return;
    await sendTransaction.sendTransaction(
      gasPrice => onClaim({ gasPrice }),
      getClaimedRewardsNotification({
        amount: claimableRewards,
      }),
      {
        callback: refreshData,
      },
    );
  };

  const canSubmit = enabled || (claimableRewards && claimableRewards.gt(0));
  const buttonText =
    canSubmit && !isSigningDone.current
      ? SIGN_TERMS_BUTTON_TEXT
      : text || "claim FOREX rewards";

  return (
    <form noValidate autoComplete="off">
      <ButtonSmart
        disabled={!canSubmit}
        loading={sendTransaction.sendingTransaction || isTermsModalOpen}
        onClick={onSubmit}
        network={network}
        expand={true}
      >
        {buttonText}
      </ButtonSmart>
    </form>
  );
};

export default ClaimRewards;
