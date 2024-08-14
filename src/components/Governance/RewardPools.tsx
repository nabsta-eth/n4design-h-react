import * as React from "react";
import { Network, config as sdkConfig } from "handle-sdk";
import { PageTitle } from "../index";
import {
  Table,
  TableBody,
  TableData,
  TableRow,
} from "@handle-fi/react-components/dist/components/handle_uikit/components/Table";
import { gql, GraphQLClient } from "graphql-request";
import { BigNumber, constants, Signer } from "ethers";
import { RewardPool, RewardPool__factory } from "handle-sdk/dist/contracts";
import { Provider } from "@ethersproject/providers";
import { GovernanceRoute } from "../../navigation/Governance";
import { bnToDisplayString } from "../../utils/format";
import { getProvider } from "@handle-fi/react-components/dist/utils/web3";
import usePromise from "@handle-fi/react-components/dist/hooks/usePromise";

const NETWORK: Network = "arbitrum";
const MAX_SINGLE_SUBGRAPH_FETCH_COUNT = 1000;

const POOL_ID_TO_ALIAS: { [id: number]: string } = {
  0: "fxAUD-minter",
  1: "fxPHP-minter",
  2: "fxAUD-depositor",
  3: "fxPHP-depositor",
  4: "fxAUD-keeper",
  5: "fxPHP-keeper",
  6: "FOREX-gov-old",
  7: "fxEUR-keeper",
  8: "fxUSD-keeper",
  9: "shLP",
  10: "FOREX-fxUSD-lp-gov",
};

type RewardPoolRegistry = {
  poolCount: BigNumber;
  totalWeight: BigNumber;
  totalForexDistributed: BigNumber;
  currentDistributionRatePerSecond: BigNumber;
};

const fetchPoolRegistry = async (): Promise<RewardPoolRegistry> => {
  const gqlClient = new GraphQLClient(sdkConfig.theGraphEndpoints.arbitrum.fx);
  type Response = {
    rewardPoolRegistries: [
      {
        poolCount: string;
        totalWeight: string;
        totalForexDistributed: string;
        currentDistributionRatePerSecond: string;
      },
    ];
  };
  const data = await gqlClient.request<Response>(gql`
    {
      rewardPoolRegistries(first: 1) {
        poolCount
        totalWeight
        totalForexDistributed
        currentDistributionRatePerSecond
      }
    }
  `);
  const registry = data.rewardPoolRegistries[0];
  return {
    poolCount: BigNumber.from(registry.poolCount),
    totalWeight: BigNumber.from(registry.totalWeight),
    totalForexDistributed: BigNumber.from(registry.totalForexDistributed),
    currentDistributionRatePerSecond: BigNumber.from(
      registry.currentDistributionRatePerSecond,
    ),
  };
};

type RewardPoolData = {
  id: number;
  totalDeposits: BigNumber;
  weight: BigNumber;
  ratio: BigNumber;
  assetAddress: string;
  assetType: number;
  whitelistedStakers: string[];
  aliases: string[];
  depositors: [{ id: string }];
};

type PoolWeights = { [id: number]: BigNumber };

const getPoolWeights = async (ids: number[]): Promise<PoolWeights> => {
  const contract = getRewardPool(getProvider(NETWORK));
  const weights: PoolWeights = {};
  await Promise.all(
    ids.map(async id => {
      weights[id] = (await contract.getPool(id)).weight;
    }),
  );
  return weights;
};

const fetchRewardPools = async (): Promise<RewardPoolData[]> => {
  const gqlClient = new GraphQLClient(sdkConfig.theGraphEndpoints.arbitrum.fx);
  type Response = {
    rewardPools: [
      {
        id: string;
        totalDeposits: string;
        weight: string;
        ratio: string;
        assetAddress: string;
        assetType: number;
        whitelistedStakers: string[];
        aliases: string[];
        depositors: [{ id: string }];
      },
    ];
  };
  const data = await gqlClient.request<Response>(gql`
    {
      rewardPools(first: ${MAX_SINGLE_SUBGRAPH_FETCH_COUNT}) {
        id
        totalDeposits
        weight
        ratio
        assetAddress
        assetType
        whitelistedStakers
        aliases
        depositors(first: ${MAX_SINGLE_SUBGRAPH_FETCH_COUNT}) {
          id
        }
      }
    }
  `);
  // Get weights from contracts as the subgraph is not correctly indexing them
  // (they are all zero from the subgraph currently).
  const weights = await getPoolWeights(data.rewardPools.map(pool => +pool.id));
  return data.rewardPools.map(
    ({
      id,
      totalDeposits,
      weight,
      ratio,
      assetAddress,
      assetType,
      whitelistedStakers,
      aliases,
      depositors,
    }) => ({
      id: +id,
      totalDeposits: BigNumber.from(totalDeposits),
      weight: BigNumber.from(weights[+id]),
      ratio: BigNumber.from(ratio),
      assetAddress,
      assetType,
      whitelistedStakers,
      aliases,
      depositors,
    }),
  );
};

const getRewardPool = (signerOrProvider: Signer | Provider): RewardPool =>
  RewardPool__factory.connect(
    sdkConfig.protocol.arbitrum.protocol.rewardPool,
    signerOrProvider,
  );

const getWeeklyForex = (forexPerSecond: BigNumber) =>
  forexPerSecond.mul(60).mul(60).mul(24).mul(7);

const RewardPools: React.FC = () => {
  const [registry] = usePromise(() => fetchPoolRegistry());
  const [pools] = usePromise(() => fetchRewardPools());
  return (
    <div>
      <PageTitle text="reward pools" />
      <b>protocol FOREX reward pools overview</b>
      <br />
      {registry && <RewardPoolRegistryInfo registry={registry} />}
      <br />
      {!pools && "loading pools..."}
      {registry && pools && (
        <PoolsTable
          pools={pools}
          weeklyForex={getWeeklyForex(
            registry.currentDistributionRatePerSecond,
          )}
        />
      )}
    </div>
  );
};

type PoolRegistryInfoProps = {
  registry: RewardPoolRegistry;
};

const RewardPoolRegistryInfo = ({ registry }: PoolRegistryInfoProps) => (
  <div className={"uk-margin-top"}>
    <div>
      <b>total FOREX distributed</b>:{" "}
      {bnToDisplayString(registry.totalForexDistributed, 18)} FOREX
    </div>
    <div>
      <b>current distribution rate</b>:{" "}
      {bnToDisplayString(
        getWeeklyForex(registry.currentDistributionRatePerSecond),
        18,
      )}{" "}
      FOREX/week
    </div>
  </div>
);

type PoolsTableProps = {
  pools: RewardPoolData[];
  weeklyForex: BigNumber;
};

const PoolsTable = ({ pools, weeklyForex }: PoolsTableProps) => {
  const totalWeight = pools.reduce(
    (sum, { weight }) => sum.add(weight),
    constants.Zero,
  );
  const rows = pools.map(pool => ({
    ...pool,
    totalDeposits: bnToDisplayString(pool.totalDeposits, 18),
    alias: POOL_ID_TO_ALIAS[pool.id] ? POOL_ID_TO_ALIAS[pool.id] : "unknown",
    depositorCount:
      pool.depositors.length > MAX_SINGLE_SUBGRAPH_FETCH_COUNT
        ? `${MAX_SINGLE_SUBGRAPH_FETCH_COUNT}+`
        : pool.depositors.length.toLocaleString(),
    rewardsWeek: `${bnToDisplayString(
      pool.weight.mul(weeklyForex).div(totalWeight),
      18,
    )} FOREX`,
    rewardPercent: `${bnToDisplayString(
      pool.weight.mul(10000).div(totalWeight),
      2,
    )}%`,
  }));
  return (
    <Table size="xs" style={{ border: "none" }}>
      <TableBody>
        <TableRow>
          <TableData>pool id</TableData>
          <TableData>alias</TableData>
          <TableData>total deposits</TableData>
          <TableData>total depositors</TableData>
          <TableData>rewards/week</TableData>
          <TableData>rewards %</TableData>
        </TableRow>
        {rows.map(row => (
          <TableRow key={`${row.id}`}>
            <TableData>{row.id}</TableData>
            <TableData>{row.alias}</TableData>
            <TableData>{row.totalDeposits}</TableData>
            <TableData>{row.depositorCount}</TableData>
            <TableData>{row.rewardsWeek}</TableData>
            <TableData>{row.rewardPercent}</TableData>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default {
  component: RewardPools,
  name: "RewardPools",
} as GovernanceRoute;
