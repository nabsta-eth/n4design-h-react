import { Network, governance } from "handle-sdk";
import usePromise from "@handle-fi/react-components/dist/hooks/usePromise";
import { fxKeeperPoolSDK, lpStakingSDK } from "../../context/Earn";
import {
  getMockSigner,
  getProvider,
} from "@handle-fi/react-components/dist/utils/web3";
import useVaultSDK from "../useVaultSdk";
import React from "react";

/// This data is fetched in the top level useDashboard hook as it is commonly used,
/// and is not available prefetched anywhere else
export const useProtocolData = (network: Network, account: string) => {
  // these cannot be fetched from context as the account they are fetched
  // for is not necessarily the same as the connected account
  const [lpStakingPools] = usePromise(
    () => lpStakingSDK.getPools(account, getMockSigner(network)),
    [account, network],
  );
  const [fxKeeperPools] = usePromise(
    () => fxKeeperPoolSDK.getPools(account, getProvider(network)),
    [account, network],
  );
  const [governanceLockData] = usePromise(
    () => governance.getData(account),
    [account],
  );

  // TODO make work with provider, not signer
  const vaultsSDK = useVaultSDK();
  const [multiCollateralVaults] = usePromise(
    async () => vaultsSDK?.getVaults(account, getProvider(network)),
    [account, network, vaultsSDK],
  );
  const [singleCollateralVaults] = usePromise(async () => {
    // return early to stop typing errors with the below function
    // which only accepts arbitrum as a single collateral vault network
    if (network !== "arbitrum") return;
    return vaultsSDK?.getSingleCollateralVaults(
      account,
      network,
      getMockSigner(network),
    );
  }, [account, network, vaultsSDK]);

  return React.useMemo(
    () => ({
      lpStakingPools,
      fxKeeperPools,
      multiCollateralVaults,
      singleCollateralVaults,
      governanceLockData,
    }),
    [
      lpStakingPools,
      fxKeeperPools,
      multiCollateralVaults,
      singleCollateralVaults,
      governanceLockData,
    ],
  );
};
