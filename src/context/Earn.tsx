import * as React from "react";
import {
  FxKeeperPoolPool,
  FxKeeperPoolSDK,
  GovernanceLockData,
  LpStakingData,
  LpStakingSDK,
  NETWORK_NAME_TO_CHAIN_ID,
  RewardPoolData,
  RewardPoolRaw,
  rewards,
  config as sdkConfig,
  governance,
} from "handle-sdk";
import {
  getMockSigner,
  getProvider,
} from "@handle-fi/react-components/dist/utils/web3";
import { config } from "../config";

type EarnValue = {
  fxKeeperPools: FxKeeperPoolPool[] | undefined;
  governanceLockData: GovernanceLockData | undefined;
  rewardPoolData: RewardPoolData | undefined;
  rewardPools: Record<string, RewardPoolRaw> | undefined;
  lpStakingPools: LpStakingData[] | undefined;
  fetchFxKeeperPools: (address: string | undefined) => Promise<void>;
  fetchGovernanceLockData: (address: string | undefined) => Promise<void>;
  fetchRewardPoolData: (address: string | undefined) => Promise<void>;
  fetchRewardPools: () => Promise<void>;
  fetchLpStakingPools: (address: string | undefined) => Promise<void>;
};

const EarnContext = React.createContext<EarnValue | undefined>(undefined);

export const fxKeeperPoolSDK = new FxKeeperPoolSDK({
  protocolAddresses: sdkConfig.protocol.arbitrum.protocol,
  fxTokenAddresses: config.getFxTokensForScreens(["earn"]),
  chainId: NETWORK_NAME_TO_CHAIN_ID.arbitrum,
});
export const lpStakingSDK = new LpStakingSDK();

const mockSigner = getMockSigner("arbitrum");
const provider = getProvider("arbitrum");

export const EarnProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [fxKeeperPools, setFxKeeperPools] =
    React.useState<FxKeeperPoolPool[]>();
  const [governanceLockData, setGovernanceLockData] =
    React.useState<GovernanceLockData>();
  const [rewardPoolData, setRewardPoolData] = React.useState<RewardPoolData>();
  const [rewardPools, setRewardPools] =
    React.useState<Record<string, RewardPoolRaw>>();
  const [lpStakingPools, setLpStakingPools] = React.useState<LpStakingData[]>();

  const fetchFxKeeperPools = React.useCallback(
    async (address: string | undefined) => {
      const pools = await fxKeeperPoolSDK.getPools(address, provider);
      setFxKeeperPools(pools);
    },
    [],
  );

  const fetchGovernanceLockData = React.useCallback(
    async (address: string | undefined) => {
      const data = await governance.getData(address);
      setGovernanceLockData(data);
    },
    [],
  );

  const fetchRewardPoolData = React.useCallback(
    async (address: string | undefined) => {
      const data = await rewards.getData(address);
      setRewardPoolData(data);
    },
    [],
  );

  const fetchRewardPools = React.useCallback(async () => {
    const newPool = await rewards.getPools();
    setRewardPools(newPool);
  }, []);

  const fetchLpStakingPools = React.useCallback(
    async (address: string | undefined) => {
      const newPools = await lpStakingSDK.getPools(address, mockSigner);
      setLpStakingPools(newPools);
    },
    [],
  );

  React.useEffect(() => {
    // fetches non-user specific data from cache on page load, but only if the data is not already set
    const replaceIfEmpty =
      <T extends unknown>(setter: React.Dispatch<React.SetStateAction<T>>) =>
      (value: T) =>
        setter(current => current || value);

    fxKeeperPoolSDK
      .getPools(undefined, provider)
      .then(replaceIfEmpty(setFxKeeperPools));
    governance.getData(undefined).then(replaceIfEmpty(setGovernanceLockData));
    rewards.getData(undefined).then(replaceIfEmpty(setRewardPoolData));
    rewards.getPools().then(replaceIfEmpty(setRewardPools));
    lpStakingSDK
      .getPools(undefined, mockSigner)
      .then(replaceIfEmpty(setLpStakingPools));
  }, []);

  const value = React.useMemo(
    () => ({
      fxKeeperPools,
      governanceLockData,
      rewardPoolData,
      rewardPools,
      lpStakingPools,
      fetchLpStakingPools,
      fetchFxKeeperPools,
      fetchGovernanceLockData,
      fetchRewardPoolData,
      fetchRewardPools,
    }),
    [
      fxKeeperPools,
      rewardPools,
      governanceLockData,
      rewardPoolData,
      lpStakingPools,
      fetchLpStakingPools,
      fetchFxKeeperPools,
      fetchGovernanceLockData,
      fetchRewardPools,
      fetchRewardPoolData,
    ],
  );

  return <EarnContext.Provider value={value}>{children}</EarnContext.Provider>;
};

export const useEarnStore = () => {
  const context = React.useContext(EarnContext);

  if (context === undefined) {
    throw new Error("useEarnStore must be used within a EarnProvider");
  }
  return context;
};
