import * as React from "react";
import { Network } from "handle-sdk";
import { PageTitle } from "../index";
import {
  Table,
  TableBody,
  TableData,
  TableRow,
} from "@handle-fi/react-components/dist/components/handle_uikit/components/Table";
import { config as sdkConfig } from "handle-sdk";
import { useEffect, useReducer } from "react";
import { gql, GraphQLClient } from "graphql-request";
import { Button } from "@handle-fi/react-components/dist/components/handle_uikit/components/Button";
import ButtonSmart from "../ButtonSmart/ButtonSmart";
import { BigNumber, ethers, Signer } from "ethers";
import { RewardPool, RewardPool__factory } from "handle-sdk/dist/contracts";
import { useSigner } from "@handle-fi/react-components/dist/context/UserWallet";
import { showNotification } from "@handle-fi/react-components/dist/utils/notifications";
import { getProvider } from "@handle-fi/react-components/dist/utils/web3";
import { Provider } from "@ethersproject/providers";
import { GovernanceRoute } from "../../navigation/Governance";
import { shortenAddress } from "@handle-fi/react-components/dist/utils/general";

const NETWORK: Network = "arbitrum";
const cachedPoolTotalRealDeposits: { [id: number]: BigNumber } = {};

type BoostData = {
  account: string;
  amount: BigNumber;
  poolId: number;
  updatedAt: number;
  boostData?: {
    effective: number;
  };
};

type RawBoostData = {
  account: string;
  amount: string;
  updatedAt: string;
  rewardPool: {
    id: string;
  };
};

type BoostsTableProps = {
  boosts: BoostData[];
  onClickApply: (data: BoostData) => void;
  onClickLoadBoost: (data: BoostData) => void;
};

type BoostActionName = "set-raw" | "remove" | "update";

type BoostUpdateAction<TData> = {
  name: BoostActionName;
  data: TData;
};

type BoostActionFromRaw = BoostUpdateAction<RawBoostData[]>;
type BoostActionRemove = BoostUpdateAction<BoostData>;
type BoostActionUpdate = BoostUpdateAction<BoostData>;

const parseRawBoostData = (data: RawBoostData): BoostData => ({
  account: data.account,
  poolId: parseInt(data.rewardPool.id),
  updatedAt: parseInt(data.updatedAt),
  amount: BigNumber.from(data.amount),
});

const boostsReducer = (
  state: BoostData[],
  action: BoostActionFromRaw | BoostActionRemove | BoostActionUpdate,
) => {
  switch (action.name) {
    case "set-raw":
      // Set new state from raw data.
      return (action as BoostActionFromRaw).data.map(parseRawBoostData);
    case "remove":
    case "update":
      // Remove or update item from state.
      const data = (action as BoostActionRemove).data;
      const index = state.findIndex(
        boost => boost.account === data.account && boost.poolId === data.poolId,
      );
      if (index < 0 || index >= state.length) return state;
      const newState = [...state];
      if (action.name == "remove") {
        // Remove from state.
        newState.splice(index, 1);
        return newState;
      } else {
        // Update state.
        newState[index] = data;
        return newState;
      }
    default:
      throw new Error(`Invalid reducer action "R"`);
  }
};

const fetchDepositorsFromGql = async (): Promise<RawBoostData[]> => {
  const gqlClient = new GraphQLClient(sdkConfig.theGraphEndpoints.arbitrum.fx);
  type Response = {
    rewardPoolDepositors: RawBoostData[];
  };
  const data = await gqlClient.request<Response>(gql`
    {
      rewardPoolDepositors(
        orderBy: updatedAt
        orderDirection: asc
        where: { amount_gt: "1000000000000000000", updatedAt_gt: "0" }
      ) {
        account
        amount
        rewardPool {
          id
        }
        updatedAt
      }
    }
  `);
  return data?.rewardPoolDepositors ?? [];
};

const getRewardPool = (signerOrProvider: Signer | Provider): RewardPool =>
  RewardPool__factory.connect(
    sdkConfig.protocol.arbitrum.protocol.rewardPool,
    signerOrProvider,
  );

const applyBoost = async (data: BoostData, signer: ethers.Signer) => {
  const tx = await getRewardPool(signer).updateAccountBoost(data.account, [
    data.poolId,
  ]);
  const pendingNotification = showNotification({
    message: `refreshing user boost...`,
    status: "pending",
  });
  await tx.wait(2);
  const boost = await fetchCurrentUserBoost(data, signer);
  pendingNotification.close();
  showNotification({
    message: `refreshed user boost to ${boost}x`,
    status: "info",
  });
};

const fetchCurrentUserBoost = async (
  { account, amount, poolId }: BoostData,
  signer?: Signer,
): Promise<number> => {
  const rewardPool = getRewardPool(signer ?? getProvider(NETWORK));
  if (!cachedPoolTotalRealDeposits[poolId])
    cachedPoolTotalRealDeposits[poolId] = (
      await rewardPool.getPool(poolId)
    ).totalRealDeposits;
  const deposit = await rewardPool.getDeposit(account, poolId);
  const boostedStake = await rewardPool.getUserBoostedStake(
    deposit.amount,
    cachedPoolTotalRealDeposits[poolId],
    deposit.boostWeight,
  );
  return (
    Math.round(
      parseFloat(
        ethers.utils.formatEther(
          boostedStake.mul(ethers.constants.WeiPerEther).div(amount),
        ),
      ) * 100,
    ) / 100
  );
};

const RewardBoosts: React.FC = () => {
  const signer = useSigner();
  const [boosts, dispatchBoosts] = useReducer(boostsReducer, []);
  useEffect(() => {
    // Initialise boosts.
    (async () => {
      dispatchBoosts({
        name: "set-raw",
        data: await fetchDepositorsFromGql(),
      });
    })();
  }, []);
  const onClickApply = async (data: BoostData) => {
    if ((await signer?.provider?.getNetwork())?.name !== NETWORK) return;
    await applyBoost(data, signer!);
    dispatchBoosts({
      name: "remove",
      data,
    });
  };
  const onClickLoadBoost = async (data: BoostData) => {
    const boost = await fetchCurrentUserBoost(data, signer);
    const updated = { ...data };
    updated.boostData = {
      effective: boost,
    };
    dispatchBoosts({
      name: "update",
      data: updated,
    });
  };
  return (
    <div>
      <PageTitle text="reward pool boosts" />
      <b>allows to reset user reward boosts to prevent abuse</b>
      <br />
      <i>showing the first 100 entries for stakes larger than 1</i>
      <BoostsTable
        boosts={boosts}
        onClickApply={onClickApply}
        onClickLoadBoost={onClickLoadBoost}
      />
    </div>
  );
};

const BoostsTable = ({
  boosts,
  onClickApply,
  onClickLoadBoost,
}: BoostsTableProps) => {
  const [rowLoadingBoost, setRowLoadingBoost] = React.useState<{
    [i: number]: boolean;
  }>({});
  const rows = boosts.map(boost => ({
    ...boost,
    address: shortenAddress(boost.account),
    lastUpdate: `${(
      (Date.now() - new Date(boost.updatedAt * 1000).getTime()) /
      (24 * 60 * 60 * 1000)
    ).toFixed(0)} days agp`,
    amount: parseFloat(ethers.utils.formatEther(boost.amount)).toFixed(0),
  }));
  return (
    <Table size="xs" style={{ border: "none" }}>
      <TableBody>
        <TableRow>
          <TableData>account</TableData>
          <TableData>pool id</TableData>
          <TableData>pool stake</TableData>
          <TableData>last update</TableData>
          <TableData>on-chain boost</TableData>
          <TableData>apply boost</TableData>
        </TableRow>
        {rows.map((row, i) => (
          <TableRow key={`${row.account}${row.poolId}`}>
            <TableData>{row.address}</TableData>
            <TableData>{row.poolId}</TableData>
            <TableData>{row.amount}</TableData>
            <TableData>{row.lastUpdate}</TableData>
            <TableData>
              {row.boostData ? (
                <div>{row.boostData.effective}x</div>
              ) : rowLoadingBoost[i] ? (
                <p>loading...</p>
              ) : (
                <Button
                  onClick={() => {
                    setRowLoadingBoost({
                      ...rowLoadingBoost,
                      [i]: true,
                    });
                    onClickLoadBoost(boosts[i]);
                  }}
                >
                  load change
                </Button>
              )}
            </TableData>
            <TableData>
              <ButtonSmart
                onClick={() => onClickApply(boosts[i])}
                network={NETWORK}
              >
                apply
              </ButtonSmart>
            </TableData>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default {
  component: RewardBoosts,
  name: "RewardBoosts",
} as GovernanceRoute;
