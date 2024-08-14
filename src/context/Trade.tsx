import { ethers } from "ethers";
import { TokenInfo, config as sdkConfig, Network } from "handle-sdk/dist";
import {
  Instrument,
  TradeAccount,
  TradeAccountRole,
  TradeAdapter,
  TradeAdapterWebsocket,
  TradeLiquidityPool,
  TradeLpPriceFeedH2so,
  TradePair,
  TradePairId,
  TradeProtocol,
} from "handle-sdk/dist/components/trade";
import {
  createContext,
  Dispatch,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";
import { handleSendTransactionError } from "../hooks/useSendTransaction";
import {
  useConnectedAccount,
  useConnectedNetwork,
} from "@handle-fi/react-components/dist/context/UserWallet";
import { getProvider } from "@handle-fi/react-components/dist/utils/web3";
import {
  TradeReader,
  TradeReaderSubgraph,
} from "handle-sdk/dist/components/trade/reader";
import { Pair } from "handle-sdk/dist/types/trade";
import {
  isSamePair,
  pairFromString,
  pairToString,
} from "handle-sdk/dist/utils/general";
import { favouriteMarketsLocalStorageKey } from "../utils/local-storage";
import {
  getViewOnlyInstruments,
  ViewOnlyInstrument,
} from "../config/viewOnlyInstruments";
import { DEFAULT_SELECTED_PAIR } from "../config/trade";
import { useReferralCode } from "./Referral";
import { TradeNetwork, tradeNetworks } from "handle-sdk/dist/types/network";
import { HandleTokenManagerInstance } from "handle-sdk/dist/components/token-manager/HandleTokenManager";
import usePromise from "@handle-fi/react-components/dist/hooks/usePromise";
import { useLoader } from "./Loader";
import { useUiStore } from "./UserInterface";
import { fetchInstruments } from "handle-sdk/dist/components/trade/instruments";
import { PriceFeed } from "handle-sdk/dist/components/h2so/feed";
import { usePriceFeed } from "./PriceFeed";
import axios from "axios";
import { BarData } from "../types/trade-chart";
import { useLocalStorageVersioned } from "@handle-fi/react-components/dist/hooks/useLocalStorageVersioned";

const FAVOURITE_MARKETS_LOCAL_STORAGE_VERSION = 1;

export const USE_GASLESS = true;
export const DEFAULT_TRADE_NETWORK: TradeNetwork | null = "arbitrum";

export type InstrumentWithTradeableIndicator = Instrument & {
  isTradeable: boolean;
};

export type TradeContextType = {
  protocol: TradeProtocol;
  account: TradeAccount | null;
  createAccount: (
    signer: ethers.Signer,
    depositAmount: ethers.BigNumber,
    psmToken?: string,
  ) => Promise<TradeAccount | null>;
  /// Available trade pairs, filtered for any hidden pairs.
  pairs: TradePair[];
  viewOnlyInstruments: ViewOnlyInstrument[];
  selectedPair: Pair;
  selectedTradePairId: TradePairId;
  selectedTradePair: TradePair;
  selectedTradePairLp: TradeLiquidityPool;
  /// Sets a selected pair regardless of LP.
  /// This throws an error if there is no matching TradePairId.
  setSelectedPair: (pair: Pair) => void;
  hasLoaded: boolean;
  withdrawGasFee: ethers.BigNumber;
  tradeGasFee: ethers.BigNumber;
  reader: TradeReader;
  adapter: TradeAdapter;
  showMarketChoiceModal: boolean;
  setShowMarketChoiceModal: Dispatch<SetStateAction<boolean>>;
  isNewChartTab: boolean;
  setIsNewChartTab: Dispatch<SetStateAction<boolean>>;
  instruments: InstrumentWithTradeableIndicator[];
  prices24h: Prices24hMap;
} & FavouriteMarkets;

type TradeEnvironmentState = {
  // The network for the trade environment state.
  // This can be set before the state has loaded,
  // so that it prevents race conditions from loading
  // a different network than the one intended, such as
  // when switching networks rapidly or during first load.
  network: TradeNetwork;
  data?: TradeEnvironmentStateData;
};

type LoadedTradeEnvironmentState = Required<TradeEnvironmentState>;

type TradeEnvironmentStateData = {
  adapter: TradeAdapter;
  reader: TradeReader;
  protocol: TradeProtocol;
  selectedTradePairId: TradePairId;
  pairs: TradePair[];
  userConnection?: TradeEnvironmentUserConnection;
  instruments: InstrumentWithTradeableIndicator[];
};

type TradeEnvironmentUserConnection = {
  address: string;
  account: TradeAccount;
};

const TradeContext = createContext<TradeContextType | null>(null);

enum ReducerAction {
  SetState,
  ClearStateAndSwitchNetwork,
  SetSelectedTradePairId,
  SetUserConnection,
}

type ReducerActionPayload =
  | {
      type: ReducerAction.SetState;
      value: TradeEnvironmentState;
      network: TradeNetwork;
    }
  | {
      type: ReducerAction.ClearStateAndSwitchNetwork;
      network: TradeNetwork;
    }
  | {
      type: ReducerAction.SetSelectedTradePairId;
      value: TradePairId;
    }
  | {
      type: ReducerAction.SetUserConnection;
      value?: TradeEnvironmentUserConnection;
      network: TradeNetwork;
    };

const reduceTradeEnvironment = (
  state: TradeEnvironmentState,
  action: ReducerActionPayload,
): TradeEnvironmentState => {
  switch (action.type) {
    case ReducerAction.SetState:
      if (action.network != state.network) {
        return { ...state };
      }
      return action.value;
    case ReducerAction.ClearStateAndSwitchNetwork:
      return { network: action.network };
    case ReducerAction.SetSelectedTradePairId:
      if (!state.data) {
        return { ...state };
      }
      return {
        ...state,
        data: {
          ...state.data,
          selectedTradePairId: action.value,
        },
      };
    case ReducerAction.SetUserConnection:
      if (!state.data || state.network !== action.network) {
        return { ...state };
      }
      // Cancel existing account's callbacks.
      if (state.data.userConnection?.account) {
        state.data.userConnection.account.cancelSubscriptionToRemoteUpdates();
      }
      return {
        ...state,
        data: {
          ...state.data,
          userConnection: action.value,
        },
      };
    default:
      throw new Error("unknown enum variant");
  }
};

const fetchTradeState = async (
  network: TradeNetwork,
  priceFeed: PriceFeed,
): Promise<TradeEnvironmentState> => {
  console.debug(
    `[trade context] [${Date.now()}] fetching trade state`,
    network,
  );
  const tradeConfig = sdkConfig.protocol[network];
  const reader = new TradeReaderSubgraph(
    sdkConfig.theGraphEndpoints[network].synths,
  );
  const adapter = await TradeAdapterWebsocket.create(
    tradeConfig.tradeApiWsUrl,
    getProvider(network),
    {
      timeout: 30_000,
      accountAddress: tradeConfig.tradeAccount,
    },
  );
  const usdTokenInfo = getTradeUsdToken(network);
  const protocol = await TradeProtocol.create(
    reader,
    adapter,
    usdTokenInfo,
    new TradeLpPriceFeedH2so(priceFeed),
  );
  const tradePair = getInitialTradePair(protocol.getTradePairs());
  const selectedTradePairId = tradePair.id;
  const pairs = protocol.getTradePairs();
  const tradeInstruments = await fetchInstruments(network);
  const instruments = tradeInstruments
    .sort((a, b) => (a.displayRank ?? 999) - (b.displayRank ?? 999))
    .map(i => {
      const isTradeable = pairs.some(
        p => p.isActive && isSamePair(p.pair, pairFromString(i.pair)),
      );
      return {
        ...i,
        isTradeable,
      };
    }) satisfies InstrumentWithTradeableIndicator[];

  return {
    network,
    data: {
      adapter,
      reader,
      protocol,
      selectedTradePairId,
      pairs,
      instruments,
    },
  };
};

const tryFetchFirstExistingUserAccount = async (
  userAddress: string,
  state: LoadedTradeEnvironmentState,
): Promise<TradeAccount | null> =>
  // Fetch first trade account available for which
  // `userAddress` user is an owner.
  state.data.reader
    .getUserAccountIds(userAddress, TradeAccountRole.Owner)
    .then(accountIds =>
      // Return the first account, or null if no account.
      accountIds[0]
        ? fetchAccountFromId(accountIds[0], state)
        : Promise.resolve(null),
    );

const fetchAccountFromId = (
  id: number,
  state: LoadedTradeEnvironmentState,
): Promise<TradeAccount> =>
  TradeAccount.fromId(
    id,
    state.data.reader,
    state.data.protocol,
    state.data.adapter,
    getTradeUsdToken(state.network).address,
  );

const fetchWithdrawGasFee = async (state: TradeEnvironmentState | null) => {
  if (!state?.data) return null;
  return state.data.reader.getWithdrawGasFeeUsd();
};

const fetchTradeGasFee = async (state: TradeEnvironmentState | null) => {
  if (!state?.data) return null;
  return state.data.reader.getTradeGasFeeUsd();
};

export type Prices24hMap = Record<string, BarData | undefined>;

export const TradeProvider: React.FC = ({ children }) => {
  const connectedAccount = useConnectedAccount();
  const providerNetwork = useConnectedNetwork() ?? DEFAULT_TRADE_NETWORK;
  const tradeNetwork =
    getTradeNetworkOrNull(providerNetwork) ?? DEFAULT_TRADE_NETWORK;
  // Forces re-render of all children when account is updated (e.g. from trade)
  const [update, setUpdate] = useState(0);
  const [didFinishFirstLoad, setDidFinishFirstLoad] = useState(false);
  // Note: these are the protocol-wide trade pairs, not specific to a single LP.
  const referralCode = useReferralCode();
  const [state, dispatchStateAction] = useReducer(reduceTradeEnvironment, {
    network: tradeNetwork,
  } satisfies TradeEnvironmentState);
  const completeLoader = useLoader(Symbol("trade"));
  const { priceFeed } = usePriceFeed();
  const [prices24h, setPrices24h] = useState<Prices24hMap>({});

  const setupAccount = useCallback((account: TradeAccount) => {
    // Ensure account updates are reactive.
    account.onUpdate = () => setUpdate(u => u + 1);
    // Subscribe to remote updates from the server.
    account.subscribeToRemoteUpdates();
  }, []);

  const sortedTradePairs = useMemo(() => {
    if (!state?.data) {
      return [];
    }
    const newPairs = state.data.instruments
      .map(i =>
        state.data!.pairs.find(p => isSamePair(p.pair, pairFromString(i.pair))),
      )
      .filter((p): p is TradePair => !!p);
    const pairsNotFound = state.data.pairs.filter(
      p => !newPairs.find(p2 => isSamePair(p2.pair, p.pair)),
    );
    return [...newPairs, ...pairsNotFound];
  }, [state.data?.pairs, state.data?.instruments]);

  const viewOnlyInstruments = useMemo(() => {
    if (!state.data?.instruments) {
      return [];
    }
    return getViewOnlyInstruments(state.data.instruments);
  }, [state.data?.instruments]);

  const tryLoadSetAccount = useCallback(
    (address: string | undefined, state: LoadedTradeEnvironmentState) => {
      if (!address) {
        dispatchStateAction({
          type: ReducerAction.SetUserConnection,
          network: state.network,
        });
        return;
      }
      if (
        state.data.userConnection?.address.toLowerCase() ===
        address.toLowerCase()
      ) {
        // Already connected.
        return;
      }
      console.debug(
        `[trade context] [${Date.now()}] fetching account`,
        state.network,
      );
      // Reset account first just in case no trade account
      // for new address on change of account.
      dispatchStateAction({
        type: ReducerAction.SetUserConnection,
        value: undefined,
        network: state.network,
      });
      tryFetchFirstExistingUserAccount(address, state).then(account => {
        console.debug(`[trade context] [${Date.now()}] fetched account `, {
          address,
        });
        dispatchStateAction({
          type: ReducerAction.SetUserConnection,
          value: account && address ? { account, address } : undefined,
          network: state.network,
        });
      });
    },
    [],
  );

  useEffect(() => {
    if (!providerNetwork || !tradeNetwork) {
      // No network has been detected yet.
      return;
    }
    if (state?.network == tradeNetwork && state.data) {
      // Nil action.
      return;
    }
    dispatchStateAction({
      type: ReducerAction.ClearStateAndSwitchNetwork,
      network: tradeNetwork,
    });
    fetchTradeState(tradeNetwork, priceFeed).then(state => {
      console.debug(
        `[trade context] [${Date.now()}] fetched trade state`,
        state.network,
      );
      dispatchStateAction({
        type: ReducerAction.SetState,
        value: state,
        network: state.network,
      });
      if (!didFinishFirstLoad) {
        completeLoader();
        setDidFinishFirstLoad(true);
      }
    });
  }, [providerNetwork, priceFeed]);

  // TODO: #3383
  // Figure out why the WS subscription
  // is getting repeatedly renewed
  // causing this to get called repeatedly.
  useEffect(() => {
    if (!state || !state.data || !didFinishFirstLoad) {
      return;
    }
    tryLoadSetAccount(connectedAccount, state as LoadedTradeEnvironmentState);
  }, [
    !!state?.data,
    state?.data?.userConnection?.account.id,
    connectedAccount,
    didFinishFirstLoad,
  ]);

  useEffect(() => {
    if (!state?.data?.userConnection) {
      return;
    }
    setupAccount(state.data.userConnection.account);
  }, [state?.data?.userConnection?.account.id]);

  const isStateNetworkSync =
    providerNetwork && tradeNetwork && tradeNetwork === state?.network;

  const createAccount = async (
    signer: ethers.Signer,
    depositAmount: ethers.BigNumber,
    psmToken?: string,
  ): Promise<TradeAccount | null> => {
    if (!state || !state.data || !isStateNetworkSync) {
      throw new Error("Trade context not initialised");
    }
    const address = await signer.getAddress();
    const existingAccount = await state.data.reader
      .getUserAccountIds(address, TradeAccountRole.Owner)
      .then(accountIds => accountIds[0] ?? null);
    if (existingAccount) {
      throw new Error("Account already exists");
    }
    try {
      const account = await TradeAccount.open({
        amount: depositAmount,
        wallet: signer,
        protocol: state.data.protocol,
        adapter: state.data.adapter,
        equityToken: getTradeUsdToken(state.network),
        reader: state.data.reader,
        useGasless: USE_GASLESS,
        referralCode: referralCode ?? undefined,
        psmToken,
      });
      dispatchStateAction({
        type: ReducerAction.SetUserConnection,
        network: state.network,
        value: {
          account,
          address,
        },
      });
      return account;
    } catch (e) {
      console.error(e);
      handleSendTransactionError(
        e,
        undefined,
        providerNetwork,
        connectedAccount,
      );
      return null;
    }
  };

  const setSelectedPair = (pair: Pair) => {
    if (!state || !state.data || !isStateNetworkSync) {
      return;
    }
    const tradePair = state.data.pairs.find(tradePair =>
      isSamePair(tradePair.pair, pair),
    );
    // Could be a view only market so return if not found
    if (!tradePair) {
      return;
    }
    dispatchStateAction({
      type: ReducerAction.SetSelectedTradePairId,
      value: tradePair.id,
    });
  };

  const { favouriteMarkets, setFavouriteMarket, unsetFavouriteMarket } =
    useFavouriteMarkets(state.data?.instruments ?? []);
  const selectedTradePair = useMemo(
    () =>
      state
        ? state?.data?.protocol.getTradePair(state?.data?.selectedTradePairId)
        : null,
    [state, state?.data?.selectedTradePairId],
  );

  const [withdrawGasFee] = usePromise(
    () => fetchWithdrawGasFee(state),
    [state],
  );
  const [tradeGasFee] = usePromise(() => fetchTradeGasFee(state), [state]);

  const [showMarketChoiceModal, setShowMarketChoiceModal] =
    useState<boolean>(false);
  const [isNewChartTab, setIsNewChartTab] = useState<boolean>(false);

  useEffect(() => {
    const instruments = state.data?.instruments;
    if (!instruments) {
      return;
    }
    const symbols = instruments.map(i => i.getChartSymbol());
    fetch24hPricesSetter(symbols, prices24h, setPrices24h).catch(console.error);
  }, [state?.data?.instruments]);

  const value = useMemo(() => {
    if (!state?.data || !selectedTradePair || !isStateNetworkSync) {
      return null;
    }
    return {
      protocol: state.data.protocol,
      account: state.data.userConnection?.account ?? null,
      createAccount,
      selectedTradePairId: state.data.selectedTradePairId,
      pairs: sortedTradePairs,
      viewOnlyInstruments,
      selectedTradePair,
      selectedTradePairLp: state.data.protocol.getLiquidityPool(
        selectedTradePair.id.lpId,
      ),
      setSelectedPair,
      favouriteMarkets,
      setFavouriteMarket,
      unsetFavouriteMarket,
      selectedPair: selectedTradePair.pair,
      withdrawGasFee: withdrawGasFee ?? ethers.constants.Zero,
      tradeGasFee: tradeGasFee ?? ethers.constants.Zero,
      reader: state.data.reader,
      adapter: state.data.adapter,
      showMarketChoiceModal,
      setShowMarketChoiceModal,
      isNewChartTab,
      setIsNewChartTab,
      instruments: state.data.instruments,
      // TODO: consider removing this or refactoring it.
      hasLoaded: true,
      prices24h,
    } satisfies TradeContextType;
  }, [
    state,
    state.network,
    state?.data?.protocol,
    state?.data?.userConnection?.account,
    state?.data?.selectedTradePairId,
    state?.data?.reader,
    state?.data?.instruments,
    favouriteMarkets,
    update,
    selectedTradePair,
    withdrawGasFee,
    tradeGasFee,
    showMarketChoiceModal,
    isNewChartTab,
    tradeNetwork,
    viewOnlyInstruments,
    prices24h,
  ]);

  if (!value) {
    return null;
  }

  return (
    <TradeContext.Provider value={value}>{children}</TradeContext.Provider>
  );
};

export const useTrade = () => {
  const context = useContext(TradeContext);
  if (!context) {
    throw new Error("Trade context must be used in TradeProvider");
  }
  return context;
};

type FavouriteMarkets = {
  favouriteMarkets: Pair[];
  setFavouriteMarket: (pair: Pair) => void;
  unsetFavouriteMarket: (pair: Pair) => void;
};

const useFavouriteMarkets = (instruments: Instrument[]): FavouriteMarkets => {
  const { isMobile } = useUiStore();
  const favouriteMarketsLsPrefix = useMemo(
    () => (isMobile ? "mobile" : "desktop"),
    [isMobile],
  );
  const defaultFavouriteMarkets = useMemo(
    () =>
      instruments
        .filter(i => i.isDefaultVisible)
        .map(i => pairFromString(i.pair)),
    [instruments],
  );
  const [favouriteMarkets, setFavouriteMarkets] = useLocalStorageVersioned<
    Pair[]
  >(
    favouriteMarketsLocalStorageKey(favouriteMarketsLsPrefix),
    FAVOURITE_MARKETS_LOCAL_STORAGE_VERSION,
    [],
  );
  useEffect(() => {
    if (favouriteMarkets.length === 0) {
      setFavouriteMarkets(defaultFavouriteMarkets);
    }
  }, [isMobile, instruments]);

  const getFavouriteMarketIndex = (pair: Pair): number =>
    favouriteMarkets.findIndex(p => isSamePair(p, pair));

  const setFavouriteMarket = (pair: Pair) => {
    if (getFavouriteMarketIndex(pair) >= 0) return;
    const newFaves = [...favouriteMarkets];
    newFaves.push(pair);
    setFavouriteMarkets(newFaves);
  };

  const unsetFavouriteMarket = (pair: Pair) => {
    const index = getFavouriteMarketIndex(pair);
    if (index < 0) return;
    const newFaves = [...favouriteMarkets];
    newFaves.splice(index, 1);
    setFavouriteMarkets(newFaves);
  };

  return {
    favouriteMarkets,
    setFavouriteMarket,
    unsetFavouriteMarket,
  };
};

const getInitialTradePair = (tradePairs: TradePair[]): TradePair => {
  const defaultPair = tradePairs.find(p =>
    isSamePair(p.pair, DEFAULT_SELECTED_PAIR),
  );
  if (defaultPair && defaultPair.isActive) {
    return defaultPair;
  }
  console.warn(
    `[trade context] default pair ${pairToString(
      DEFAULT_SELECTED_PAIR,
    )} not found or is inactive`,
  );
  const firstAvailablePair = tradePairs.find(p => p.isActive);
  if (!firstAvailablePair) {
    throw new Error(`no trade pair available`);
  }
  console.warn(
    `[trade context] defaulting to ${pairToString(firstAvailablePair.pair)}`,
  );
  return firstAvailablePair;
};

export const getTradeNetworkOrNull = (
  inputNetwork: Network | undefined,
): TradeNetwork | null => {
  if (inputNetwork && tradeNetworks.includes(inputNetwork as TradeNetwork)) {
    return inputNetwork as TradeNetwork;
  }
  return DEFAULT_TRADE_NETWORK ?? null;
};

export const getTradeUsdToken = (tradeNetwork: TradeNetwork): TokenInfo => {
  switch (tradeNetwork) {
    case "arbitrum":
      return HandleTokenManagerInstance.getTokenBySymbol("fxUSD", "arbitrum");
    case "arbitrum-sepolia":
      return mockUsd;
    default:
      throw new Error(`no USD token for trade network ${tradeNetwork}`);
  }
};

const mockUsd: TokenInfo = {
  address: "0xe5B75EcA86d4E855a65Af3D95A3aCe1679f2850d",
  name: "Mock USD",
  symbol: "fxUSD",
  chainId: 421614,
  decimals: 18,
};

const fetch24hPricesSetter = async (
  instrumentSymbols: string[],
  currentPrices24h: Prices24hMap,
  setPrices24h: React.Dispatch<React.SetStateAction<Prices24hMap>>,
) => {
  const knownPrices = Object.keys(currentPrices24h);
  const missingSymbols = instrumentSymbols.filter(
    s => !knownPrices.includes(s),
  );
  if (missingSymbols.length === 0) {
    return;
  }
  fetch24hPrices(missingSymbols).then(result => {
    setPrices24h(map => ({
      ...map,
      ...result,
    }));
  });
};

const fetch24hPrices = async (
  chartSymbols: string[],
): Promise<Prices24hMap> => {
  const queryString = `?symbols=${chartSymbols.join(",")}`;
  const baseUrl = sdkConfig.api.baseUrl;
  const endpoint = `${baseUrl}/prices/historical/24h${queryString}`;
  const response = await axios.get(endpoint);
  return response.data.bars;
};
