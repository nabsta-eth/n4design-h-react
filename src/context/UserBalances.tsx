import { ethers } from "ethers";
import { Network, NetworkMap } from "handle-sdk";
import * as React from "react";
import { useWalletBalances } from "../hooks/useWalletBalances";
import { balancesToSymbolMap } from "../utils/balances";
import { TokenSymbolToBalance } from "../utils/erc20";
import { useNativeToken } from "./TokenManager";
import { useConnectedNetwork } from "@handle-fi/react-components/dist/context/UserWallet";
import { useSelectedOrConnectedAccount } from "../hooks/useSelectedOrConnectedAccount";
import { TokenWithBalance } from "../types/tokenInfo";
import { DEFAULT_HIDE_TOKEN_VALUE_THRESHOLD } from "../config/constants";
import { walletValueThresholdLocalStorage } from "../utils/local-storage";
import { getLocaleNumberSeparators, isValidNumber } from "../utils/general";

type Balances = NetworkMap<TokenSymbolToBalance>;

export type Balance = {
  balance: ethers.BigNumber | undefined;
};

type UserBalanceValue = {
  isLoadingBalances: NetworkMap<boolean>;
  balances: NetworkMap<TokenWithBalance[]>;
  balancesMap: Balances;
  refreshBalance: (network?: Network) => Promise<void>;
  currency: string;
  setCurrency: (currency: string) => void;
  tokenValueThreshold: string;
  setTokenValueThreshold: (value: string) => void;
  onChangeTokenValueThreshold: (value: string) => void;
};

const DEFAULT_CURRENCY: string = "fxUSD";

const UserBalanceContext = React.createContext<UserBalanceValue | undefined>(
  undefined,
);

export const UserBalancesProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const connectedNetwork = useConnectedNetwork();
  const account = useSelectedOrConnectedAccount();

  const [isLoadingArbitrumBalance, arbitrumBalance, fetchArbitrumBalance] =
    useWalletBalances("arbitrum", account);
  const [isLoadingEthereumBalance, ethereumBalance, fetchEthereumBalance] =
    useWalletBalances("ethereum", account);
  const [isLoadingPolygonBalance, polygonBalance, fetchPolygonBalance] =
    useWalletBalances("polygon", account);
  const [
    isLoadingSynthTestNetworkBalance,
    synthTestNetworkBalance,
    fetchSynthTestNetworkBalance,
  ] = useWalletBalances("arbitrum-sepolia", account);

  const balancesMap = React.useMemo<Balances>(() => {
    return {
      ethereum: balancesToSymbolMap(ethereumBalance),
      arbitrum: balancesToSymbolMap(arbitrumBalance),
      polygon: balancesToSymbolMap(polygonBalance),
      "arbitrum-sepolia": balancesToSymbolMap(synthTestNetworkBalance),
    };
  }, [
    ethereumBalance,
    arbitrumBalance,
    polygonBalance,
    synthTestNetworkBalance,
  ]);

  const balances = React.useMemo<NetworkMap<TokenWithBalance[]>>(() => {
    return {
      ethereum: ethereumBalance,
      arbitrum: arbitrumBalance,
      polygon: polygonBalance,
      "arbitrum-sepolia": synthTestNetworkBalance,
    };
  }, [
    ethereumBalance,
    arbitrumBalance,
    polygonBalance,
    synthTestNetworkBalance,
  ]);

  const isLoadingBalances = React.useMemo<NetworkMap<boolean>>(() => {
    return {
      ethereum: isLoadingEthereumBalance,
      arbitrum: isLoadingArbitrumBalance,
      polygon: isLoadingPolygonBalance,
      "arbitrum-sepolia": isLoadingSynthTestNetworkBalance,
    };
  }, [
    isLoadingEthereumBalance,
    isLoadingArbitrumBalance,
    isLoadingPolygonBalance,
    isLoadingSynthTestNetworkBalance,
  ]);

  const refreshBalance = React.useCallback(
    async (network_?: Network) => {
      const network = network_ || connectedNetwork;
      if (!network) {
        return;
      }
      const fetchers = {
        ethereum: fetchEthereumBalance,
        arbitrum: fetchArbitrumBalance,
        polygon: fetchPolygonBalance,
        "arbitrum-sepolia": fetchSynthTestNetworkBalance,
      };

      await fetchers[network]();
    },
    [
      fetchArbitrumBalance,
      fetchEthereumBalance,
      fetchPolygonBalance,
      fetchSynthTestNetworkBalance,
    ],
  );

  const [currency, setCurrency] = React.useState(DEFAULT_CURRENCY);

  const walletValueThresholdFromLocalStorage =
    walletValueThresholdLocalStorage.get();

  const [tokenValueThreshold, setTokenValueThreshold] = React.useState<string>(
    walletValueThresholdFromLocalStorage ?? DEFAULT_HIDE_TOKEN_VALUE_THRESHOLD,
  );

  const localeNumberSeparators = getLocaleNumberSeparators();

  const validTokenValueThreshold = (value: string) => {
    if (!isValidNumber(value)) return false;
    if (Number(value) < 0) return false;
    if (
      value.includes(localeNumberSeparators.decimalSeparator) &&
      (value.toString().split(localeNumberSeparators.decimalSeparator)[1]
        .length || 0) > 2
    )
      return false;
    return true;
  };

  const onChangeTokenValueThreshold = (value: string) => {
    if (validTokenValueThreshold(value)) {
      setTokenValueThreshold(value);
      walletValueThresholdLocalStorage.set(value);
    }
  };

  const value = React.useMemo(
    () => ({
      balancesMap,
      refreshBalance,
      balances,
      isLoadingBalances,
      currency,
      setCurrency,
      tokenValueThreshold,
      setTokenValueThreshold,
      onChangeTokenValueThreshold,
    }),
    [
      balancesMap,
      refreshBalance,
      balances,
      isLoadingBalances,
      currency,
      setCurrency,
      tokenValueThreshold,
      setTokenValueThreshold,
      onChangeTokenValueThreshold,
    ],
  );

  return (
    <UserBalanceContext.Provider value={value}>
      {children}
    </UserBalanceContext.Provider>
  );
};

export const useUserBalanceStore = () => {
  const context = React.useContext(UserBalanceContext);

  if (context === undefined) {
    throw new Error(
      "useUserBalances must be used within a UserBalanceProvider",
    );
  }
  return context;
};

export const useBalances = (
  network: Network | undefined,
): TokenSymbolToBalance => {
  const { balancesMap } = useUserBalanceStore();
  if (!network) {
    return {};
  }
  return balancesMap[network];
};

export type BalanceWithLoading = Balance & { isLoading: boolean };
export const useBalance = ({
  tokenSymbol,
  network,
}: {
  tokenSymbol: string | undefined;
  network: Network | undefined;
}): BalanceWithLoading => {
  const { balancesMap, isLoadingBalances } = useUserBalanceStore();

  if (!network || !tokenSymbol) {
    return { balance: undefined, isLoading: false };
  }

  const balance = balancesMap[network][tokenSymbol];
  return {
    balance: balance || ethers.constants.Zero,
    isLoading: isLoadingBalances[network],
  };
};

export const useNativeBalance = (network: Network) => {
  const token = useNativeToken(network);
  if (!token) throw new Error("No native token found");
  return useBalance({ tokenSymbol: token.symbol, network });
};
