import * as React from "react";
import { useEarnStore } from "../../context/Earn";
import {
  ButtonSmart,
  InputNumber,
  InputNumberWithBalance,
  Loader,
  PageTitle,
} from "../index";
import { LpStakingData, Network } from "handle-sdk";
import { useSigner } from "@handle-fi/react-components/dist/context/UserWallet";
import useInputNumberState from "../../hooks/useInputNumberState";
import useSendTransaction from "../../hooks/useSendTransaction";
import { HandleLpstaking__factory } from "../../contracts";
import { ADMIN_NOTIFICATIONS } from "../../config/notifications";
import { ethers } from "ethers";
import { SECONDS_IN_A_DAY } from "../../config/constants";
import { bnToDisplayString } from "../../utils/format";
import {
  Table,
  TableBody,
  TableData,
  TableRow,
} from "@handle-fi/react-components/dist/components/handle_uikit/components/Table";
import { GovernanceRoute } from "../../navigation/Governance";
import { useUiStore } from "../../context/UserInterface";
import { getThemeFile } from "../../utils/ui";

const LPStakingPoolManagement: React.FC = () => {
  const { fetchLpStakingPools, lpStakingPools } = useEarnStore();
  const { activeTheme } = useUiStore();

  React.useEffect(() => {
    fetchLpStakingPools(undefined);
  }, [fetchLpStakingPools]);

  return (
    <div>
      <PageTitle text="lp staking pools" />
      <span>starting a rewards period</span>
      <ul>
        <li>send rewards to the pool address</li>
        <li>change the duration if required</li>
        <li>
          enter the amount rewards to be emited during the period and click
          "start new period"
        </li>
      </ul>
      <span>notes</span>
      <ul>
        <li>can't change duration when active</li>
        <li>can't start a period if there arent enough rewards in the pool</li>
        <li>
          can't decrease rewards duration a period but you can increase. When
          increaing enter the additional rewards (currently disabled)
        </li>
      </ul>
      {!lpStakingPools && (
        <Loader color={getThemeFile(activeTheme).primaryColor} />
      )}
      {lpStakingPools?.map(pool => (
        <LPPool key={pool.address} pool={pool} />
      ))}
    </div>
  );
};

const LPPool: React.FC<{ pool: LpStakingData }> = ({ pool }) => {
  const NETWORK: Network = "arbitrum";
  const signer = useSigner();

  const rewardState = useInputNumberState();
  const durationState = useInputNumberState();
  const { sendTransaction, sendingTransaction } = useSendTransaction();
  const { fetchLpStakingPools } = useEarnStore();

  const activePeriod =
    pool.distributionPeriodEnds.toNumber() * 1000 > Date.now();

  const refresh = () => {
    rewardState.reset();
    durationState.reset();
    return fetchLpStakingPools(undefined);
  };

  const onStartPeriod = async () => {
    if (!signer) {
      return;
    }

    const contract = HandleLpstaking__factory.connect(pool.address, signer);

    await sendTransaction(
      gasPrice =>
        contract.notifyRewardAmount(rewardState.value.bn, { gasPrice }),
      ADMIN_NOTIFICATIONS,
      {
        callback: refresh,
      },
    );
  };

  const onSetDuration = async () => {
    if (!signer) {
      return;
    }

    const contract = HandleLpstaking__factory.connect(pool.address, signer);
    const duration =
      Number(ethers.utils.formatUnits(durationState.value.bn, 2)) *
      SECONDS_IN_A_DAY;

    await sendTransaction(
      gasPrice => contract.setRewardsDuration(duration, { gasPrice }),
      ADMIN_NOTIFICATIONS,
      {
        callback: refresh,
      },
    );
  };

  const rows = [
    { title: "address", value: pool.address },
    {
      title: "forex balance",
      value: `${bnToDisplayString(pool.rewardsBalance, 18, 2)} FOREX`,
    },
    {
      title: "period duration",
      value: `${(
        pool.distributionDuration.toNumber() / SECONDS_IN_A_DAY
      ).toFixed(2)} days`,
    },
    {
      title: "current period ends",
      value: new Date(pool.distributionPeriodEnds.toNumber() * 1000).toString(),
    },
    {
      title: "current period emissions",
      value: `${bnToDisplayString(
        pool.distributionDuration.mul(pool.distributionRate),
        18,
        2,
      )} FOREX`,
    },
  ];

  return (
    <div className="hfi-border uk-padding-small uk-margin-small-bottom">
      <h4>{pool.title}</h4>
      <Table size="xs" style={{ border: "none" }}>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={i}>
              <TableData>{row.title}</TableData>
              <TableData>{row.value}</TableData>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="uk-flex uk-margin-bottom">
        <InputNumber
          decimals={2}
          id="duration"
          label="duration in days"
          value={durationState.value}
          onChange={durationState.onChange}
          disabled={activePeriod}
          wrapperClassName="uk-width-expand uk-margin-right"
        />
        <ButtonSmart
          network={NETWORK}
          className="uk-margin-top"
          disabled={activePeriod || durationState.value.bn.lte(0)}
          loading={sendingTransaction}
          onClick={onSetDuration}
        >
          set period duration
        </ButtonSmart>
      </div>
      <div className="uk-flex">
        <InputNumberWithBalance
          id="reward-amount"
          wrapperClassName="uk-width-expand uk-margin-right"
          tokenSymbol="FOREX"
          label="rewards for period"
          value={rewardState.value}
          onChange={rewardState.onChange}
          network={NETWORK}
          disabled={activePeriod}
        />
        <ButtonSmart
          network={NETWORK}
          className="uk-margin-top"
          disabled={activePeriod || rewardState.value.bn.lte(0)}
          loading={sendingTransaction}
          onClick={onStartPeriod}
        >
          start new period
        </ButtonSmart>
      </div>
    </div>
  );
};

export default {
  component: LPStakingPoolManagement,
  name: "LPStakingPoolManagement",
} as GovernanceRoute;
