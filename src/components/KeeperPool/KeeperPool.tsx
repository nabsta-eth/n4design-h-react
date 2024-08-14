import * as React from "react";
import {
  ButtonSmart,
  InputNumber,
  InputNumberWithBalance,
  EarnPoolBase,
  ClaimRewards,
  DisplayEarnPoolData,
} from "../";
import { useEarnStore, fxKeeperPoolSDK } from "../../context/Earn";
import useInputNumberState from "../../hooks/useInputNumberState";
import { bnToDisplayString } from "../../utils/format";
import {
  useConnectedAccount,
  useSigner,
  useUserWalletStore,
} from "@handle-fi/react-components/dist/context/UserWallet";
import { ethers } from "ethers";
import {
  Balance,
  useBalance,
  useUserBalanceStore,
} from "../../context/UserBalances";
import { Network, rewards } from "handle-sdk";
import useSendTransaction, {
  UseSendTransaction,
} from "../../hooks/useSendTransaction";
import useAllowance from "../../hooks/useAllowance";
import {
  getKeeperPoolUnStakeNotifications,
  getKeeperPoolStakeNotifications,
} from "../../config/notifications";
import { useToken } from "../../context/TokenManager";
import UnclaimedLiquidationGains from "./UnclaimedLiquidationGains";
import FxKeeperPool from "handle-sdk/dist/components/FxKeeperPool";
import { EarnTableData, formatExactAprRow } from "../../utils/earn";
import { useTermsAndConditions } from "../../context/TermsAndCondtions";
import { SIGN_TERMS_BUTTON_TEXT } from "../../config";

type Action = "deposit" | "withdraw" | "claim rewards";

type Props = {
  fxTokenSymbol: string;
  data: Pick<EarnTableData, "exactApr">;
};

const NETWORK: Network = "arbitrum";

const KeeperPool: React.FC<Props> = ({ fxTokenSymbol, data }) => {
  const {
    fxKeeperPools,
    rewardPoolData,
    fetchFxKeeperPools,
    fetchRewardPoolData,
  } = useEarnStore();
  const sendTransaction = useSendTransaction();
  const signer = useSigner();
  const connectedAccount = useConnectedAccount();
  const { refreshBalance } = useUserBalanceStore();
  const [action, setAction] = React.useState<Action>("deposit");
  const balance = useBalance({
    tokenSymbol: fxTokenSymbol,
    network: NETWORK,
  });
  const { isSigningDone, ensureTermsSigned } = useTermsAndConditions();
  const keeperPool = fxKeeperPools?.find(p => p.fxToken === fxTokenSymbol);
  const canClaimKeeper =
    keeperPool != null &&
    !!keeperPool.account?.rewards.collateralAmounts.find(amount =>
      amount.gt(0),
    );

  const refreshData = () =>
    Promise.all([
      refreshBalance(NETWORK),
      fetchFxKeeperPools(connectedAccount),
      fetchRewardPoolData(connectedAccount),
    ]);

  const claimRewardPool = async () => {
    if (!signer) throw new Error("No signer");

    if (!isSigningDone.current) {
      await ensureTermsSigned();
    }

    return rewards.claim(signer);
  };

  const claimKeeper = async () => {
    if (!signer) throw new Error("No signer");

    if (!isSigningDone.current) {
      await ensureTermsSigned();
    }

    return new FxKeeperPool().claim({ fxTokenSymbol }, signer);
  };

  return (
    <EarnPoolBase
      selectedTab={action}
      tabButtons={[
        { name: "deposit", disabled: false },
        { name: "withdraw", disabled: false },
        { name: "claim rewards", disabled: false },
      ]}
      onTabClick={setAction}
    >
      <React.Fragment>
        {action === "deposit" && (
          <Stake
            fxTokenSymbol={fxTokenSymbol}
            balance={balance}
            refreshData={refreshData}
            signer={signer}
            sendTransaction={sendTransaction}
          />
        )}
        {action === "withdraw" && (
          <Unstake
            fxTokenSymbol={fxTokenSymbol}
            staked={keeperPool?.account?.fxLocked}
            refreshData={refreshData}
            signer={signer}
            sendTransaction={sendTransaction}
          />
        )}
        {action === "claim rewards" && (
          <ClaimRewards
            claimableRewards={rewardPoolData?.account?.claimableRewards}
            onClaim={claimRewardPool}
            refreshData={refreshData}
            network={NETWORK}
          />
        )}
        {isSigningDone.current && action === "claim rewards" && (
          <div style={{ marginTop: "6px" }}></div>
        )}
        {isSigningDone.current && action === "claim rewards" && (
          <ClaimRewards
            enabled={canClaimKeeper}
            claimableRewards={undefined} // Omitting amount (multiple assets).
            onClaim={claimKeeper}
            refreshData={refreshData}
            network={NETWORK}
            text="claim liquidation gains"
          />
        )}
      </React.Fragment>

      <React.Fragment>
        <h4>
          deposit {fxTokenSymbol} to earn liquidation profits &amp; FOREX
          rewards
        </h4>
        <div>
          total deposited:{" "}
          {keeperPool && bnToDisplayString(keeperPool?.totalDeposited, 18, 2)}{" "}
          {fxTokenSymbol}
        </div>
        <DisplayEarnPoolData
          title="your deposited"
          data={
            keeperPool?.account?.fxLocked &&
            bnToDisplayString(keeperPool?.account?.fxLocked, 18, 2)
          }
          symbol={fxTokenSymbol}
        />
        <DisplayEarnPoolData
          title="your unclaimed rewards"
          data={
            rewardPoolData?.account?.claimableRewards &&
            bnToDisplayString(rewardPoolData?.account?.claimableRewards, 18, 2)
          }
          symbol="FOREX"
        />
        {formatExactAprRow(data.exactApr)}
        <UnclaimedLiquidationGains keeperPool={keeperPool} />
      </React.Fragment>
    </EarnPoolBase>
  );
};

export default KeeperPool;

type StakeProps = {
  fxTokenSymbol: string;
  balance: Balance;
  signer: ethers.Signer | undefined;
  sendTransaction: UseSendTransaction;
  refreshData: () => Promise<void[]>;
};

const Stake: React.FC<StakeProps> = ({
  fxTokenSymbol,
  balance,
  signer,
  sendTransaction,
  refreshData,
}) => {
  const amountState = useInputNumberState();
  const { connection } = useUserWalletStore();
  const fxTokenExtended = useToken(fxTokenSymbol, NETWORK);
  const { allowance, updatingAllowance, updateAllowance } = useAllowance(
    fxTokenSymbol,
    fxKeeperPoolSDK.config.protocolAddresses.fxKeeperPool,
    NETWORK,
  );
  const { isSigningDone, isTermsModalOpen, ensureTermsSigned } =
    useTermsAndConditions();

  const onSubmit = async () => {
    if (
      !signer ||
      !allowance ||
      !connection.chain.isConnected ||
      !connection.chain.isSupportedNetwork ||
      !fxTokenExtended
    ) {
      return;
    }
    if (NETWORK != connection.chain.network) {
      console.warn("network not supported for keeper pool");
      return;
    }

    if (!isSigningDone.current) {
      await ensureTermsSigned();
      return;
    }

    if (allowance.lt(amountState.value.bn)) {
      await updateAllowance(ethers.constants.MaxUint256);
    }

    await sendTransaction.sendTransaction(
      gasPrice =>
        fxKeeperPoolSDK.stake(
          { amount: amountState.value.bn, fxTokenSymbol },
          signer,
          { gasPrice },
        ),
      getKeeperPoolStakeNotifications({
        amount: amountState.value.bn,
        token: fxTokenExtended,
      }),
      {
        callback: refreshData,
      },
    );

    amountState.reset();
  };

  const canSubmit =
    !amountState.value.bn.isZero() &&
    balance.balance &&
    amountState.value.bn.lte(balance.balance);

  const depositButtonText =
    canSubmit && !isSigningDone.current ? SIGN_TERMS_BUTTON_TEXT : "deposit";

  return (
    <form noValidate autoComplete="off">
      <InputNumberWithBalance
        id="amount"
        label="amount"
        placeholder="amount to deposit"
        value={amountState.value}
        onChange={amountState.onChange}
        tokenSymbol={fxTokenSymbol}
        network={NETWORK}
      />
      <ButtonSmart
        disabled={!canSubmit}
        loading={
          sendTransaction.sendingTransaction ||
          updatingAllowance ||
          (signer && !balance.balance) ||
          isTermsModalOpen
        }
        onClick={onSubmit}
        network={NETWORK}
        expand={true}
        className="uk-margin-top"
      >
        {depositButtonText}
      </ButtonSmart>
    </form>
  );
};

type UnstakeProps = {
  fxTokenSymbol: string;
  staked: ethers.BigNumber | undefined;
  signer: ethers.Signer | undefined;
  sendTransaction: UseSendTransaction;
  refreshData: () => Promise<void[]>;
};

const Unstake: React.FC<UnstakeProps> = ({
  fxTokenSymbol,
  staked,
  signer,
  sendTransaction,
  refreshData,
}) => {
  const amountState = useInputNumberState();

  const { connection } = useUserWalletStore();
  const fxTokenExtended = useToken(fxTokenSymbol, NETWORK);

  const { isSigningDone, isTermsModalOpen, ensureTermsSigned } =
    useTermsAndConditions();

  const onSubmit = async () => {
    if (
      !signer ||
      !connection.chain.isConnected ||
      !connection.chain.isSupportedNetwork ||
      !fxTokenExtended
    ) {
      return;
    }
    if (NETWORK != connection.chain.network) {
      console.warn("network not supported for keeper pool");
      return;
    }

    if (!isSigningDone.current) {
      await ensureTermsSigned();
      return;
    }

    await sendTransaction.sendTransaction(
      gasPrice =>
        fxKeeperPoolSDK.unstake(
          { amount: amountState.value.bn, fxTokenSymbol },
          signer,
          { gasPrice },
        ),
      getKeeperPoolUnStakeNotifications({
        amount: amountState.value.bn,
        token: fxTokenExtended,
      }),
      {
        callback: refreshData,
      },
    );

    amountState.reset();
  };

  const canSubmit =
    staked &&
    staked.gt(0) &&
    !amountState.value.bn.isZero() &&
    amountState.value.bn.lte(staked);

  const withdrawButtonText =
    canSubmit && !isSigningDone.current ? SIGN_TERMS_BUTTON_TEXT : "withdraw";

  return (
    <form noValidate autoComplete="off">
      <InputNumber
        id="amount"
        label="amount"
        placeholder="amount to withdraw"
        rightLabel={staked ? `avail: ${bnToDisplayString(staked, 18, 4)}` : ""}
        value={amountState.value}
        onChange={amountState.onChange}
        decimals={18}
        alert={staked && amountState.value.bn.gt(staked)}
        max={staked}
      />
      <ButtonSmart
        disabled={!canSubmit}
        loading={sendTransaction.sendingTransaction || isTermsModalOpen}
        onClick={onSubmit}
        network={NETWORK}
        expand={true}
        className="uk-margin-top"
      >
        {withdrawButtonText}
      </ButtonSmart>
    </form>
  );
};
