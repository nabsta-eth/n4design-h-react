import * as React from "react";
import {
  CollateralsSDK,
  Collateral,
  ProtocolSDK,
  ProtocolParameters,
  FxTokensSDK,
  FxToken,
  CollateralSymbol,
  BridgeSDK,
  NETWORK_NAME_TO_CHAIN_ID,
  config as sdkConfig,
} from "handle-sdk";
import { getProvider } from "@handle-fi/react-components/dist/utils/web3";
import { config } from "../config";

type ProtocolValue = {
  collaterals: Collateral[] | undefined;
  fxTokens: FxToken[] | undefined;
  protocolParameters: ProtocolParameters | undefined;
  fetchCollaterals: () => Promise<void>;
  fetchFxTokens: () => Promise<void>;
  fetchProtocolParameters: () => Promise<void>;
};

const ProtocolContext = React.createContext<ProtocolValue | undefined>(
  undefined,
);

export const collateralsSDK = new CollateralsSDK();
export const fxTokensSDK = new FxTokensSDK({
  protocolAddresses: sdkConfig.protocol.arbitrum.protocol,
  fxTokenAddresses: config.getFxTokensForScreens(["dashboard", "vault"]),
  chainId: NETWORK_NAME_TO_CHAIN_ID.arbitrum,
  graphEndpoint: sdkConfig.theGraphEndpoints.arbitrum.fx,
});
export const protocolSDK = new ProtocolSDK();
export const bridgeSDK = new BridgeSDK({
  apiBaseUrl: sdkConfig.bridge.apiBaseUrl,
  forexAddress: sdkConfig.forexAddress,
  byNetwork: sdkConfig.bridge.byNetwork,
  fxTokenAddresses: config.getFxTokensForScreens(["bridge"]),
});

const provider = getProvider("arbitrum");

export const ProtocolProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [collaterals, setCollaterals] = React.useState<Collateral[]>();
  const [fxTokens, setFxTokens] = React.useState<FxToken[]>();
  const [protocolParameters, setProtocolParameters] =
    React.useState<ProtocolParameters>();

  const fetchCollaterals = React.useCallback(async () => {
    const newCollaterals = config.useTheGraph
      ? await collateralsSDK.getIndexedCollaterals()
      : await collateralsSDK.getCollaterals(provider);
    setCollaterals(newCollaterals);
  }, []);

  const fetchFxTokens = React.useCallback(async () => {
    const newFxTokens = config.useTheGraph
      ? await fxTokensSDK.getIndexedFxTokens()
      : await fxTokensSDK.getFxTokens(provider);
    setFxTokens(newFxTokens);
  }, []);

  const fetchProtocolParameters = React.useCallback(async () => {
    const params = await protocolSDK.getProtocolParameters(provider);
    setProtocolParameters(params);
  }, []);

  const value = React.useMemo(
    () => ({
      collaterals,
      fxTokens,
      protocolParameters,
      fetchCollaterals,
      fetchProtocolParameters,
      fetchFxTokens,
    }),
    [
      collaterals,
      fxTokens,
      protocolParameters,
      fetchCollaterals,
      fetchProtocolParameters,
      fetchFxTokens,
    ],
  );

  return (
    <ProtocolContext.Provider value={value}>
      {children}
    </ProtocolContext.Provider>
  );
};

export const useProtocolStore = () => {
  const context = React.useContext(ProtocolContext);

  if (context === undefined) {
    throw new Error("useProtocolStore must be used within a ProtocolProvider");
  }
  return context;
};

export const useCollateral = (symbol: CollateralSymbol | undefined) => {
  const { collaterals } = useProtocolStore();
  return collaterals?.find(collateral => collateral.symbol === symbol);
};

export const useFxToken = (symbol: string | undefined) => {
  const { fxTokens } = useProtocolStore();
  return fxTokens?.find(fxToken => fxToken.symbol === symbol);
};

export const useCollaterals = (): Collateral[] => {
  const { collaterals } = useProtocolStore();
  return collaterals || [];
};

export const useFxTokens = () => {
  const { fxTokens } = useProtocolStore();
  return fxTokens;
};
