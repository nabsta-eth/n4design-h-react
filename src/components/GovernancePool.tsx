import * as React from "react";
import {
  ButtonSmart,
  EarnPoolBase,
  InputNumberWithBalance,
  DisplayEarnPoolData,
} from ".";
import { SECONDS_IN_A_WEEK } from "../config/constants";
import { useEarnStore } from "../context/Earn";
import useInputNumberState from "../hooks/useInputNumberState";
import {
  bnToDisplayString,
  getDurationTextFromWeekNumber,
} from "../utils/format";
import { Button } from "@handle-fi/react-components/dist/components/handle_uikit/components/Button";
import {
  useConnectedAccount,
  useSigner,
} from "@handle-fi/react-components/dist/context/UserWallet";
import { ethers } from "ethers";
import {
  Balance,
  useBalance,
  useUserBalanceStore,
} from "../context/UserBalances";
import {
  GovernanceLockData,
  Network,
  rewards,
  config as sdkConfig,
  governance,
} from "handle-sdk";
import useSendTransaction, {
  UseSendTransaction,
} from "../hooks/useSendTransaction";
import useAllowance from "../hooks/useAllowance";
import { ClaimRewards } from "./";
import {
  DEFAULT_NOTIFICATIONS,
  getCreateGovernanceLockNotifications,
  getIncreaseGovernanceLockAmountNotifications,
  getIncreaseGovernanceLockDurationNotifications,
} from "../config/notifications";
import { EarnTableData, formatExactAprRow } from "../utils/earn";
import { daysToSeconds } from "../utils/general";
import { useTermsAndConditions } from "../context/TermsAndCondtions";
import { SIGN_TERMS_BUTTON_TEXT } from "../config";

type Props = {
  data: Pick<EarnTableData, "exactApr">;
};

type LockPeriod =
  | "1 week"
  | "1 month"
  | "3 months"
  | "6 months"
  | "9 months"
  | "1 year";

const LOCK_PERIODS_TO_SECONDS: { [key in LockPeriod]: number } = {
  "1 week": daysToSeconds(7),
  "1 month": daysToSeconds(30),
  "3 months": daysToSeconds(90),
  "6 months": daysToSeconds(183),
  "9 months": daysToSeconds(273),
  "1 year": daysToSeconds(365),
};

type Action = "lock" | "withdraw" | "claim rewards";

const NETWORK: Network = "arbitrum";
export const LOCK_TOKEN_SYMBOL = "20fxUSD-80FOREX";

const GovernancePool: React.FC<Props> = ({ data }) => {
  const {
    rewardPoolData,
    governanceLockData,
    fetchGovernanceLockData,
    fetchRewardPoolData,
  } = useEarnStore();
  const sendTransaction = useSendTransaction();
  const signer = useSigner();
  const connectedAccount = useConnectedAccount();
  const { refreshBalance } = useUserBalanceStore();

  const [action, setAction] = React.useState<Action>("lock");

  const tokenBalance = useBalance({
    tokenSymbol: LOCK_TOKEN_SYMBOL,
    network: NETWORK,
  });

  const unlocksAt = governanceLockData?.account?.unlocksAt;
  const lockEndTime = unlocksAt && unlocksAt.toNumber() * 1000;
  const timeUntilUnlock = lockEndTime && lockEndTime - Date.now();
  const remainingWeeks =
    timeUntilUnlock && timeUntilUnlock / (SECONDS_IN_A_WEEK * 1000);

  const hasExpired = !!remainingWeeks && remainingWeeks <= 0;

  const displayUnlocksAt = governanceLockData?.account
    ? !remainingWeeks || !lockEndTime
      ? "now"
      : hasExpired
      ? "lock expired"
      : getDurationTextFromWeekNumber(remainingWeeks)
    : undefined;

  const refreshData = () =>
    Promise.all([
      refreshBalance(NETWORK),
      fetchGovernanceLockData(connectedAccount),
      fetchRewardPoolData(connectedAccount),
    ]);

  const onClaimRewards = () => {
    if (!signer) {
      throw new Error("No signer");
    }
    return rewards.claim(signer);
  };

  return (
    <EarnPoolBase
      selectedTab={action}
      tabButtons={[
        { name: "lock", disabled: false },
        { name: "withdraw", disabled: false },
        { name: "claim rewards", disabled: false },
      ]}
      onTabClick={setAction}
    >
      <React.Fragment>
        {action === "lock" && (
          <Lock
            tokenBalance={tokenBalance}
            governanceLockData={governanceLockData}
            hasExpired={hasExpired}
            signer={signer}
            sendTransaction={sendTransaction}
            refreshData={refreshData}
          />
        )}
        {action === "withdraw" && (
          <Unlock
            governanceLockData={governanceLockData}
            signer={signer}
            sendTransaction={sendTransaction}
            refreshData={refreshData}
          />
        )}
        {action === "claim rewards" && (
          <ClaimRewards
            claimableRewards={rewardPoolData?.account?.claimableRewards}
            onClaim={onClaimRewards}
            refreshData={refreshData}
            network={NETWORK}
          />
        )}
      </React.Fragment>

      <React.Fragment>
        <h4>
          stake &amp; lock {LOCK_TOKEN_SYMBOL} for rewards, boosts &amp;
          governance
        </h4>
        <div>
          total locked:{" "}
          {governanceLockData?.totalForexLocked &&
            bnToDisplayString(governanceLockData?.totalForexLocked, 18, 2)}{" "}
          {LOCK_TOKEN_SYMBOL}
        </div>
        <DisplayEarnPoolData
          title="your locked"
          data={
            governanceLockData?.account?.forexLocked &&
            bnToDisplayString(governanceLockData?.account?.forexLocked, 18, 2)
          }
          symbol={LOCK_TOKEN_SYMBOL}
        />
        <DisplayEarnPoolData
          title="your bal"
          data={
            governanceLockData?.account?.veForexBalance &&
            bnToDisplayString(
              governanceLockData?.account?.veForexBalance,
              18,
              2,
            )
          }
          symbol="veFOREX"
        />
        <DisplayEarnPoolData
          title={`your ${LOCK_TOKEN_SYMBOL} unlocks at`}
          data={displayUnlocksAt}
          symbol=""
        />
        <DisplayEarnPoolData
          title="your unclaimed rewards"
          data={
            rewardPoolData?.account?.claimableRewards &&
            bnToDisplayString(rewardPoolData?.account?.claimableRewards, 18, 2)
          }
          symbol={"FOREX"}
        />
        {formatExactAprRow(data.exactApr)}
        {hasExpired && (
          <p className="hfi-warning">lock has expired. withdraw your tokens</p>
        )}
      </React.Fragment>
    </EarnPoolBase>
  );
};

export default GovernancePool;

type LockProps = {
  tokenBalance: Balance;
  governanceLockData: GovernanceLockData | undefined;
  hasExpired: boolean;
  signer: ethers.Signer | undefined;
  sendTransaction: UseSendTransaction;
  refreshData: () => Promise<void[]>;
};

const Lock: React.FC<LockProps> = ({
  governanceLockData,
  tokenBalance,
  hasExpired,
  sendTransaction,
  signer,
  refreshData,
}) => {
  const amountState = useInputNumberState();
  const [lockAction, setLockAction] = React.useState<
    "create-extend" | "increase"
  >();
  const [lockPeriod, setLockPeriod] = React.useState<LockPeriod>("1 week");
  const { allowance, updatingAllowance, updateAllowance } = useAllowance(
    "20fxUSD-80FOREX",
    sdkConfig.protocol.arbitrum.protocol.governanceLock,
    NETWORK,
  );

  const amountLocked = governanceLockData?.account?.forexLocked;
  const unlocksAt = governanceLockData?.account?.unlocksAt;
  const hasLocked = amountLocked && amountLocked?.gt(0);

  const onShiftLockingPeriod = (direction: "up" | "down") => {
    const options = Object.keys(LOCK_PERIODS_TO_SECONDS) as LockPeriod[];

    const currentIndex = options.indexOf(lockPeriod);
    const newIndex = direction === "up" ? currentIndex + 1 : currentIndex - 1;
    setLockPeriod(options[newIndex]);
  };

  const increaseLockedAmount = async () => {
    if (!signer || !allowance) {
      return;
    }

    if (!isSigningDone.current) {
      await ensureTermsSigned();
      return;
    }

    setLockAction("increase");

    if (allowance.lte(amountState.value.bn)) {
      await updateAllowance(ethers.constants.MaxUint256);
    }

    await sendTransaction.sendTransaction(
      gasPrice =>
        governance.increaseLockedAmount(amountState.value.bn, signer, {
          gasPrice,
        }),
      getIncreaseGovernanceLockAmountNotifications({
        amount: amountState.value.bn,
      }),
      {
        callback: refreshData,
      },
    );

    amountState.reset();
    setLockAction(undefined);
  };

  const onLockOrExtendLock = async () => {
    if (!signer || !amountLocked || !unlocksAt || !allowance) {
      return;
    }

    if (!isSigningDone.current) {
      await ensureTermsSigned();
      return;
    }

    setLockAction("create-extend");

    const durationInSeconds = LOCK_PERIODS_TO_SECONDS[lockPeriod];
    const unlockDate = new Date(
      Date.now() + durationInSeconds * 1000,
    ).toLocaleDateString();
    const durationString = `${lockPeriod}, unlocking at ${unlockDate}`;

    if (!hasLocked) {
      if (allowance.lte(amountState.value.bn)) {
        await updateAllowance(ethers.constants.MaxUint256);
      }
      await sendTransaction.sendTransaction(
        gasPrice =>
          governance.createLock(
            {
              forexAmount: amountState.value.bn,
              durationInSeconds,
            },
            signer,
            { gasPrice },
          ),
        getCreateGovernanceLockNotifications({
          amount: amountState.value.bn,
          durationString,
        }),
        {
          callback: refreshData,
        },
      );
    } else {
      await sendTransaction.sendTransaction(
        gasPrice =>
          governance.increaseLockDurationBy(
            {
              increaseDurationByInSeconds: durationInSeconds,
              currentUnlocksAt: unlocksAt,
            },
            signer,
            { gasPrice },
          ),
        getIncreaseGovernanceLockDurationNotifications({
          durationString: lockPeriod,
        }),
        {
          callback: refreshData,
        },
      );
    }

    amountState.reset();
    setLockAction(undefined);
  };

  const canSubmitIncrease =
    lockAction !== "create-extend" &&
    !hasExpired &&
    hasLocked &&
    tokenBalance &&
    !amountState.value.bn.isZero() &&
    tokenBalance.balance?.gte(amountState.value.bn);

  const canSubmitLockOrExtend =
    lockAction !== "increase" &&
    !hasExpired &&
    ((!hasLocked &&
      tokenBalance &&
      !amountState.value.bn.isZero() &&
      tokenBalance.balance?.gte(amountState.value.bn)) ||
      (hasLocked && amountState.value.bn.isZero()));

  const { isSigningDone, ensureTermsSigned, isTermsModalOpen } =
    useTermsAndConditions();
  const hasLockedText = hasLocked ? "extend lock" : "lock";
  const lockButtonText =
    !isSigningDone.current && canSubmitLockOrExtend
      ? SIGN_TERMS_BUTTON_TEXT
      : hasLockedText;
  const increaseLockedAmountButtonText =
    !isSigningDone.current && canSubmitIncrease
      ? SIGN_TERMS_BUTTON_TEXT
      : "increase locked amount";

  return (
    <form noValidate autoComplete="off">
      <InputNumberWithBalance
        id="amount"
        label="amount"
        placeholder="amount to lock"
        value={amountState.value}
        onChange={amountState.onChange}
        disabled={hasExpired || sendTransaction.sendingTransaction}
        tokenSymbol={LOCK_TOKEN_SYMBOL}
        network={NETWORK}
      />

      {hasLocked && (
        <ButtonSmart
          disabled={!canSubmitIncrease}
          loading={
            ((sendTransaction.sendingTransaction || updatingAllowance) &&
              lockAction === "increase") ||
            isTermsModalOpen
          }
          onClick={increaseLockedAmount}
          network={NETWORK}
          className="uk-margin-top"
          expand={true}
        >
          {increaseLockedAmountButtonText}
        </ButtonSmart>
      )}

      <div
        className="uk-margin-top uk-flex uk-flex-between"
        style={{ marginBottom: "-8px" }}
      >
        <div>lock duration</div>
        <div className="uk-flex uk-width-expand uk-flex-right">
          <Button
            icon={true}
            onClick={() => onShiftLockingPeriod("down")}
            disabled={lockPeriod === "1 week"}
          >
            -
          </Button>
          <div className="uk-width-1-3 uk-flex uk-flex-center">
            {lockPeriod}
          </div>
          <Button
            icon={true}
            onClick={() => onShiftLockingPeriod("up")}
            disabled={lockPeriod === "1 year"}
          >
            +
          </Button>
        </div>
      </div>

      <ButtonSmart
        disabled={!canSubmitLockOrExtend}
        loading={
          (sendTransaction.sendingTransaction || updatingAllowance) &&
          lockAction === "create-extend"
        }
        onClick={onLockOrExtendLock}
        network={NETWORK}
        className="uk-margin-top"
        expand={true}
      >
        {lockButtonText}
      </ButtonSmart>
    </form>
  );
};

type UnlockProps = {
  governanceLockData: GovernanceLockData | undefined;
  signer: ethers.Signer | undefined;
  sendTransaction: UseSendTransaction;
  refreshData: () => Promise<void[]>;
};

const Unlock: React.FC<UnlockProps> = ({
  governanceLockData,
  sendTransaction,
  signer,
  refreshData,
}) => {
  const { isSigningDone, ensureTermsSigned, isTermsModalOpen } =
    useTermsAndConditions();

  const onSubmit = async () => {
    if (!isSigningDone.current) {
      await ensureTermsSigned();
      return;
    }

    if (!signer) {
      return;
    }
    await sendTransaction.sendTransaction(
      gasPrice => governance.withdraw(signer, { gasPrice }),
      DEFAULT_NOTIFICATIONS,
      {
        callback: refreshData,
      },
    );
  };

  const canSubmit =
    governanceLockData?.account && governanceLockData.account.forexLocked.gt(0); //&&
  //governanceLockData.account.unlocksAt.lte(Math.floor(Date.now() / 1000));

  const withdrawButtonText =
    canSubmit && !isSigningDone.current
      ? SIGN_TERMS_BUTTON_TEXT
      : `withdraw ${LOCK_TOKEN_SYMBOL}`;

  return (
    <form noValidate autoComplete="off">
      <ButtonSmart
        disabled={!canSubmit}
        loading={sendTransaction.sendingTransaction || isTermsModalOpen}
        onClick={onSubmit}
        network={NETWORK}
        expand={true}
      >
        {withdrawButtonText}
      </ButtonSmart>
    </form>
  );
};
