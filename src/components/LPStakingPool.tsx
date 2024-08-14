import * as React from "react";
import {
  ButtonSmart,
  InputNumber,
  InputNumberWithBalance,
  EarnPoolBase,
  ClaimRewards,
  DisplayEarnPoolData,
} from ".";
import { lpStakingSDK, useEarnStore } from "../context/Earn";
import useInputNumberState from "../hooks/useInputNumberState";
import { bnToDisplayString } from "../utils/format";
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
import { LpStakingData, LpStakingName, Network } from "handle-sdk";
import useSendTransaction, {
  UseSendTransaction,
} from "../hooks/useSendTransaction";
import useAllowance from "../hooks/useAllowance";
import {
  getLPStakeNotifications,
  getLPUnstakeNotifications,
} from "../config/notifications";
import { useToken } from "../context/TokenManager";

type Action = "deposit" | "withdraw" | "claim rewards";

type Props = {
  pool: LpStakingData;
};

const NETWORK: Network = "arbitrum";

const LPPool: React.FC<Props> = ({ pool }) => {
  const { fetchLpStakingPools, fetchRewardPools } = useEarnStore();
  const { refreshBalance } = useUserBalanceStore();

  const sendTransaction = useSendTransaction();
  const signer = useSigner();
  const connectedAccount = useConnectedAccount();
  const [action, setAction] = React.useState<Action>("deposit");

  const balance = useBalance({
    tokenSymbol: pool.lpToken.symbol,
    network: NETWORK,
  });

  const refreshData = () =>
    Promise.all([
      refreshBalance(NETWORK),
      fetchLpStakingPools(connectedAccount),
      fetchRewardPools(),
    ]);

  const onClaimRewards = () => {
    if (!signer) {
      throw new Error("No signer");
    }

    return lpStakingSDK.claim(pool.name as LpStakingName, signer);
  };

  const isDeprecated = pool.name === "sushiWethForex";

  React.useEffect(() => {
    if (isDeprecated) setAction("withdraw");
  }, [isDeprecated]);

  return (
    <EarnPoolBase
      selectedTab={action}
      tabButtons={[
        {
          name: "deposit",
          disabled: isDeprecated,
          hide: isDeprecated,
        },
        { name: "withdraw", disabled: false },
        { name: "claim rewards", disabled: false },
      ]}
      onTabClick={setAction}
    >
      <React.Fragment>
        {action === "deposit" && (
          <Stake
            stakingPool={pool}
            balance={balance}
            refreshData={refreshData}
            signer={signer}
            sendTransaction={sendTransaction}
          />
        )}
        {action === "withdraw" && (
          <Unstake
            stakingPool={pool}
            staked={pool?.account?.deposited}
            refreshData={refreshData}
            signer={signer}
            sendTransaction={sendTransaction}
          />
        )}
        {action === "claim rewards" && (
          <ClaimRewards
            claimableRewards={pool?.account?.claimableRewards}
            onClaim={onClaimRewards}
            refreshData={refreshData}
            network={NETWORK}
          />
        )}
      </React.Fragment>

      <React.Fragment>
        <h4>
          {isDeprecated
            ? "this pool is no longer active. please claim any rewards and withdraw any deposited funds."
            : `deposit in ${pool.platform}, receive LP tokens & stake them to earn FOREX rewards`}
        </h4>

        <div>
          total staked: {bnToDisplayString(pool.totalDeposited, 18, 2)}{" "}
          {pool.lpToken.symbol}
        </div>

        <DisplayEarnPoolData
          title="your staked"
          data={
            pool.account && bnToDisplayString(pool.account?.deposited, 18, 2)
          }
          symbol={pool.lpToken.symbol}
        />
        <DisplayEarnPoolData
          title="your unclaimed rewards"
          data={
            pool.account &&
            bnToDisplayString(pool.account?.claimableRewards, 18, 2)
          }
          symbol="FOREX"
        />
      </React.Fragment>
    </EarnPoolBase>
  );
};

export default LPPool;

type StakeProps = {
  stakingPool: LpStakingData;
  balance: Balance;
  signer: ethers.Signer | undefined;
  sendTransaction: UseSendTransaction;
  refreshData: () => Promise<void[]>;
};

const Stake: React.FC<StakeProps> = ({
  stakingPool,
  balance,
  signer,
  sendTransaction,
  refreshData,
}) => {
  const amountState = useInputNumberState();

  const { allowance, updatingAllowance, updateAllowance } = useAllowance(
    stakingPool.lpToken.symbol,
    stakingPool.address,
    NETWORK,
  );

  const tokenExtended = useToken(stakingPool.lpToken.symbol, NETWORK);

  const onSubmit = async () => {
    if (!signer || !allowance || !tokenExtended) {
      return;
    }

    if (allowance.lt(amountState.value.bn)) {
      await updateAllowance(ethers.constants.MaxUint256);
    }

    await sendTransaction.sendTransaction(
      gasPrice =>
        lpStakingSDK.stake(
          { poolName: stakingPool.name, amount: amountState.value.bn },
          signer,
          { gasPrice },
        ),
      getLPStakeNotifications({
        amount: amountState.value.bn,
        token: tokenExtended,
        poolName: stakingPool.name,
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

  return (
    <form noValidate autoComplete="off">
      <InputNumberWithBalance
        id="amount"
        label="amount"
        placeholder="amount to deposit"
        value={amountState.value}
        onChange={amountState.onChange}
        tokenSymbol={stakingPool.lpToken.symbol}
        network={NETWORK}
      />
      <ButtonSmart
        disabled={!canSubmit}
        loading={
          sendTransaction.sendingTransaction ||
          updatingAllowance ||
          (signer && !balance.balance)
        }
        onClick={onSubmit}
        network={NETWORK}
        expand={true}
        className="uk-margin-top"
      >
        deposit
      </ButtonSmart>
    </form>
  );
};

type UnstakeProps = {
  stakingPool: LpStakingData;
  staked: ethers.BigNumber | undefined;
  signer: ethers.Signer | undefined;
  sendTransaction: UseSendTransaction;
  refreshData: () => Promise<void[]>;
};

const Unstake: React.FC<UnstakeProps> = ({
  stakingPool,
  staked,
  signer,
  sendTransaction,
  refreshData,
}) => {
  const amountState = useInputNumberState();

  const tokenExtended = useToken(stakingPool.lpToken.symbol, NETWORK);

  const onSubmit = async () => {
    if (!signer || !tokenExtended) {
      return;
    }

    await sendTransaction.sendTransaction(
      gasPrice =>
        lpStakingSDK.unstake(
          { poolName: stakingPool.name, amount: amountState.value.bn },
          signer,
          { gasPrice },
        ),
      getLPUnstakeNotifications({
        amount: amountState.value.bn,
        token: tokenExtended,
        poolName: stakingPool.name,
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

  const onMaxUnstake = () => {
    amountState.onChange({
      bn: staked || ethers.constants.Zero,
      string: (staked && bnToDisplayString(staked, 18, 4)) || "0",
    });
  };

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
        max={staked}
        onMax={onMaxUnstake}
        alert={staked && amountState.value.bn.gt(staked)}
      />
      <ButtonSmart
        disabled={!canSubmit}
        loading={sendTransaction.sendingTransaction}
        onClick={onSubmit}
        network={NETWORK}
        expand={true}
        className="uk-margin-top"
      >
        withdraw
      </ButtonSmart>
    </form>
  );
};
