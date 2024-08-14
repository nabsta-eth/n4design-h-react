import * as React from "react";
import {
  VaultsSDK,
  Vault,
  SingleCollateralVaultNetworkMap,
  SingleCollateralVault,
  SingleCollateralVaultNetwork,
  SingleCollateralVaultSymbol,
  Network,
} from "handle-sdk";
import {
  getMockSigner,
  getProvider,
} from "@handle-fi/react-components/dist/utils/web3";
import { useAccount } from "./Account";
import useVaultSDK from "../hooks/useVaultSdk";
import { config } from "../config";

type Vaults = Partial<{ [key: string]: Vault }>;
type SingleCollateralVaults = Partial<
  SingleCollateralVaultNetworkMap<{
    [key: string]: SingleCollateralVault;
  }>
>;

type VaultsValue = {
  fetchVaults: (
    account: string,
    sdk: VaultsSDK,
    indexed?: boolean,
  ) => Promise<void>;
  fetchSingleCollateralVaults: (
    account: string,
    network: SingleCollateralVaultNetwork,
    sdk: VaultsSDK,
  ) => Promise<void>;
  fetchVault: (
    account: string,
    fxToken: string,
    sdk: VaultsSDK,
    indexed?: boolean,
  ) => Promise<void>;
  fetchSingleCollateralVault: (
    account: string,
    vaultSymbol: SingleCollateralVaultSymbol,
    network: SingleCollateralVaultNetwork,
    sdk: VaultsSDK,
  ) => Promise<void>;
  clearVaults: () => void;
  vaults: Vaults;
  singleCollateralVaults: SingleCollateralVaults;
};

const VaultsContext = React.createContext<VaultsValue | undefined>(undefined);

export const VaultsProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [vaults, setVaults] = React.useState<Vaults>({});
  const [singleCollateralVaults, setSingleCollateralVaults] =
    React.useState<SingleCollateralVaults>({});

  const fetchVaults = React.useCallback(
    async (account: string, sdk: VaultsSDK, indexed: boolean = false) => {
      const newVaults =
        indexed && config.useTheGraph
          ? await sdk.getIndexedVaults(account)
          : await sdk.getVaults(account, getProvider("arbitrum"));
      setVaults(toVaults(newVaults));
    },
    [],
  );

  const fetchSingleCollateralVaults = React.useCallback(
    async (
      account: string,
      network: SingleCollateralVaultNetwork,
      sdk: VaultsSDK,
    ) => {
      const signer = getMockSigner(network);

      const newVaults = await sdk.getSingleCollateralVaults(
        account,
        network,
        signer,
      );

      setSingleCollateralVaults(previous => {
        return {
          ...previous,
          [network]: newVaults.reduce((progress, v) => {
            return {
              ...progress,
              [v.vaultSymbol]: v,
            };
          }, {}),
        };
      });
    },
    [],
  );

  const fetchVault = React.useCallback(
    async (
      account: string,
      fxToken: string,
      sdk: VaultsSDK,
      indexed: boolean = false,
    ) => {
      const signer = getMockSigner("arbitrum");
      const newVault =
        indexed && config.useTheGraph
          ? await sdk.getIndexedVault(account, fxToken)
          : await sdk.getVault(account, fxToken, signer);
      setVaults(previousVaults => ({
        ...previousVaults,
        [newVault.fxToken.symbol]: newVault,
      }));
    },
    [],
  );

  const fetchSingleCollateralVault = React.useCallback(
    async (
      account: string,
      vaultSymbol: SingleCollateralVaultSymbol,
      network: SingleCollateralVaultNetwork,
      sdk: VaultsSDK,
    ) => {
      const signer = getMockSigner(network);
      const newVault = await sdk.getSingleCollateralVault(
        account,
        vaultSymbol,
        network,
        signer,
      );

      setSingleCollateralVaults(previousVaults => {
        const networkVaults = previousVaults[network] || {};
        const newNetworkVaults = {
          ...networkVaults,
          [newVault.vaultSymbol]: newVault,
        };
        return {
          ...previousVaults,
          [network]: newNetworkVaults,
        };
      });
    },
    [],
  );

  const clearVaults = React.useCallback(() => {
    setVaults({});
    setSingleCollateralVaults({});
  }, []);

  const value = React.useMemo(
    () => ({
      vaults,
      singleCollateralVaults,
      fetchVaults,
      fetchVault,
      fetchSingleCollateralVault,
      fetchSingleCollateralVaults,
      clearVaults,
    }),
    [
      fetchVaults,
      fetchVault,
      fetchSingleCollateralVaults,
      fetchSingleCollateralVault,
      clearVaults,
      singleCollateralVaults,
      vaults,
    ],
  );

  return (
    <VaultsContext.Provider value={value}>{children}</VaultsContext.Provider>
  );
};

export const useVaultStore = () => {
  const context = React.useContext(VaultsContext);

  if (context === undefined) {
    throw new Error("useVaults must be used within a VaultsProvider");
  }
  return context;
};

export const useVaults = ({
  fetch,
  indexed,
}: {
  fetch: boolean;
  indexed?: boolean;
}): [Vault[], () => Promise<void>] => {
  const { vaults, fetchVaults } = useVaultStore();
  const vaultSDK = useVaultSDK();
  const account = useAccount();

  const fetchVaultsInternal = React.useCallback(async () => {
    if (!account || !vaultSDK) {
      return;
    }
    await fetchVaults(account, vaultSDK, indexed);
  }, [account, vaultSDK, indexed, fetchVaults]);

  React.useEffect(() => {
    if (fetch) {
      fetchVaultsInternal();
    }
  }, [fetchVaultsInternal, fetch]);

  const v = React.useMemo(() => {
    if (account) {
      // remove undefined values
      return Object.values(vaults).filter(_v => !!_v) as Vault[];
    }
    return [];
  }, [vaults, account]);

  return [v, fetchVaultsInternal];
};

export const useVault = ({
  fxToken,
  fetch,
  indexed,
}: {
  fxToken: string | undefined;
  fetch: boolean;
  indexed?: boolean;
}): [Vault | undefined, () => Promise<void>] => {
  const vaultSDK = useVaultSDK();
  const { vaults, fetchVault } = useVaultStore();
  const account = useAccount();

  const fetchInternal = React.useCallback(async () => {
    if (!account || !vaultSDK || !fxToken) {
      return;
    }
    await fetchVault(account, fxToken, vaultSDK, indexed);
  }, [account, fxToken, vaultSDK, indexed, fetchVault]);

  React.useEffect(() => {
    if (fetch) {
      fetchInternal();
    }
  }, [fetchInternal, fetch]);

  const vault = React.useMemo(
    () => (account && fxToken ? vaults[fxToken] : undefined),
    [vaults, account, fxToken],
  );

  return [vault, fetchInternal];
};

export const useSingleCollateralVaults = ({
  network,
  fetch,
}: {
  network: Network;
  fetch: boolean;
}): [SingleCollateralVault[], () => Promise<void>] => {
  const { singleCollateralVaults, fetchSingleCollateralVaults } =
    useVaultStore();
  const vaultSDK = useVaultSDK();
  const account = useAccount();

  const fetchSingleCollateralVaultsInternal = React.useCallback(async () => {
    if (!account || !vaultSDK || network !== "arbitrum") {
      return;
    }

    await fetchSingleCollateralVaults(account, network, vaultSDK);
  }, [account, vaultSDK, network, fetchSingleCollateralVaults]);

  React.useEffect(() => {
    if (fetch) {
      fetchSingleCollateralVaultsInternal();
    }
  }, [fetchSingleCollateralVaultsInternal, fetch]);

  const v = React.useMemo(
    () => (account ? Object.values(singleCollateralVaults.arbitrum || {}) : []),
    [singleCollateralVaults, network, account],
  );

  return [v, fetchSingleCollateralVaultsInternal];
};

export const useSingleCollateralVault = ({
  vaultSymbol,
  network,
  fetch,
}: {
  vaultSymbol: SingleCollateralVaultSymbol | undefined;
  network: SingleCollateralVaultNetwork;
  fetch: boolean;
}): [SingleCollateralVault | undefined, () => Promise<void>] => {
  const vaultSDK = useVaultSDK();
  const { singleCollateralVaults, fetchSingleCollateralVault } =
    useVaultStore();
  const account = useAccount();

  const fetchSingleCollateralVaultInternal = React.useCallback(async () => {
    if (!account || !vaultSDK || !vaultSymbol) {
      return;
    }
    await fetchSingleCollateralVault(account, vaultSymbol, network, vaultSDK);
  }, [account, vaultSymbol, network, vaultSDK, fetchSingleCollateralVault]);

  React.useEffect(() => {
    if (fetch) {
      fetchSingleCollateralVaultInternal();
    }
  }, [fetchSingleCollateralVaultInternal, fetch]);

  const vault = React.useMemo(
    () =>
      account && vaultSymbol
        ? singleCollateralVaults[network]?.[vaultSymbol]
        : undefined,
    [singleCollateralVaults, account, network, vaultSymbol],
  );

  return [vault, fetchSingleCollateralVaultInternal];
};

const toVaults = (newVaults: Vault[]): Vaults =>
  newVaults.reduce((progress, v) => {
    return {
      ...progress,
      [v.fxToken.symbol]: v,
    };
  }, {});
