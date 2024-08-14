import {
  NETWORK_NAME_TO_CHAIN_ID,
  VaultsSDK,
  config as sdkConfig,
} from "handle-sdk";
import React from "react";
import { config } from "../config";
import { useProtocolStore } from "../context/Protocol";

const useVaultSDK = () => {
  const { fxTokens } = useProtocolStore();
  const { collaterals, protocolParameters } = useProtocolStore();

  const vaultsSDK = React.useMemo(() => {
    if (!fxTokens || !collaterals || !protocolParameters) {
      return undefined;
    }
    const vaultSDK = new VaultsSDK({
      forexTokenAddress: sdkConfig.forexAddress,
      protocolAddresses: sdkConfig.protocol.arbitrum.protocol,
      fxTokenAddresses: config.getFxTokensForScreens(["vault"]),
      collaterals: sdkConfig.protocol.arbitrum.collaterals,
      chainId: NETWORK_NAME_TO_CHAIN_ID.arbitrum,
      graphEndpoint: sdkConfig.theGraphEndpoints.arbitrum.fx,
      singleCollateralVaults: sdkConfig.singleCollateralVaults,
    });
    vaultSDK.initSync(protocolParameters, fxTokens, collaterals);
    return vaultSDK;
  }, [protocolParameters, fxTokens, collaterals]);

  return vaultsSDK;
};

export default useVaultSDK;
