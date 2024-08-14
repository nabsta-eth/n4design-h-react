import {
  CollateralSymbol,
  NetworkMap,
  NETWORK_NAME_TO_CHAIN_ID,
  config as sdkConfig,
} from "handle-sdk";
import { TransactionSpeedPreset } from "../types/transaction-speed";
import { ensureEnvExists } from "../utils/general";
import { NETWORK_DETAILS } from "./constants";
import { setConfig } from "@handle-fi/react-components/dist/utils/config";
import { ethers } from "ethers";
import { setApiBaseUrl } from "handle-sdk/dist/config";
import { checkIsLocalServer } from "../utils/url";

export const MAINTENANCE_STATUS_URL =
  "https://handle.blr1.cdn.digitaloceanspaces.com/maintenance/maintenance.json";

export const SCREEN_BRIDGE = "bridge";
export const SCREEN_EARN = "earn";
export const SCREEN_DASHBOARD = "dashboard";
export const SCREEN_TRADE = "trade";
export const SCREEN_VAULT = "vault";

const SCREENS = [
  SCREEN_BRIDGE,
  SCREEN_EARN,
  SCREEN_DASHBOARD,
  SCREEN_TRADE,
  SCREEN_VAULT,
] as const;

export const HANDLE_API_URL = "https://api.handle.fi";
export const HANDLE_DEFAULT_LANGUAGE = "english";

type FxTokenScreen = (typeof SCREENS)[number];

type Config = {
  useTheGraph: boolean;
  privateRpcAddresses: NetworkMap<string>;
  networkNameToId: NetworkMap<number>;
  infuraId: string;
  walletConnectBridge: string;
  magicKey: string;
  defaultSlippage: number;
  defaultTransactionSpeed: TransactionSpeedPreset;
  transactionSpeedMultipliers: { [key in TransactionSpeedPreset]: number };
  publicNetworkDetails: NetworkMap<
    web3.NetworkDetails & {
      rpcUrls: string[];
    }
  >;
  tokenIconPlaceholderUrl: string;
  disabledCollaterals: CollateralSymbol[];
  fxTokens: { [symbol: string]: string };
  unsupportedFxTokenScreens: {
    [symbol: string]: FxTokenScreen[] | undefined;
  };
  getFxTokensForScreens: (screen: FxTokenScreen[]) => Record<string, string>;
  leverageDisplay: {
    [key: string]: LeverageDisplay;
  };
  dynamicEnvironmentIds: {
    sandbox: string;
    live: string;
  };
};

export type LeverageDisplay = {
  max: number;
  default: number;
  step: number;
  min: number;
  marks: number;
  decimalPrecision: number;
};

const ethereumRpc = ensureEnvExists(
  import.meta.env.VITE_ETHEREUM_RPC,
  "VITE_ETHEREUM_RPC",
);
const arbitrumRpc = ensureEnvExists(
  import.meta.env.VITE_ARBITRUM_RPC,
  "VITE_ARBITRUM_RPC",
);
const polygonRpc = ensureEnvExists(
  import.meta.env.VITE_POLYGON_RPC,
  "VITE_POLYGON_RPC",
);
const arbitrumSepoliaRpc = ensureEnvExists(
  import.meta.env.VITE_USE_LOCAL_FORKED_CHAIN?.toUpperCase() === "TRUE"
    ? "http://127.0.0.1:8545"
    : import.meta.env.VITE_ARBITRUM_SEPOLIA_RPC,
  "VITE_ARBITRUM_SEPOLIA_RPC",
);

const ethereumPublicRpc = ensureEnvExists(
  import.meta.env.VITE_ETHEREUM_PUBLIC_RPC,
  "VITE_ETHEREUM_PUBLIC_RPC",
);
const arbitrumPublicRpc = ensureEnvExists(
  import.meta.env.VITE_ARBITRUM_PUBLIC_RPC,
  "VITE_ARBITRUM_PUBLIC_RPC",
);
const polygonPublicRpc = ensureEnvExists(
  import.meta.env.VITE_POLYGON_PUBLIC_RPC,
  "VITE_POLYGON_PUBLIC_RPC",
);
const arbitrumSepoliaPublicRpc = ensureEnvExists(
  import.meta.env.VITE_USE_LOCAL_FORKED_CHAIN?.toUpperCase() === "TRUE"
    ? "http://127.0.0.1:8545"
    : import.meta.env.VITE_ARBITRUM_SEPOLIA_PUBLIC_RPC,
  "VITE_ARBITRUM_SEPOLIA_PUBLIC_RPC",
);
const dynamicSandboxEnvironmentId = ensureEnvExists(
  import.meta.env.VITE_DYNAMIC_ENVIRONMENT_ID_SANDBOX,
  "VITE_DYNAMIC_ENVIRONMENT_ID_SANDBOX",
);
const dynamicLiveEnvironmentId = ensureEnvExists(
  import.meta.env.VITE_DYNAMIC_ENVIRONMENT_ID_LIVE,
  "VITE_DYNAMIC_ENVIRONMENT_ID_LIVE",
);

export const config: Config = {
  useTheGraph:
    ensureEnvExists(
      import.meta.env.VITE_USE_THE_GRAPH,
      "VITE_USE_THE_GRAPH",
    ) === "true",
  privateRpcAddresses: {
    ethereum: ethereumRpc,
    arbitrum: arbitrumRpc,
    polygon: polygonRpc,
    "arbitrum-sepolia": arbitrumSepoliaRpc,
  },
  networkNameToId: NETWORK_NAME_TO_CHAIN_ID,
  infuraId: ensureEnvExists(import.meta.env.VITE_INFURA_ID, "VITE_INFURA_ID"),
  walletConnectBridge: ensureEnvExists(
    import.meta.env.VITE_WALLET_CONNECT_BRIDGE,
    "VITE_WALLET_CONNECT_BRIDGE",
  ),
  magicKey: ensureEnvExists(
    import.meta.env.VITE_MAGIC_PUBLISHABLE_KEY,
    "VITE_MAGIC_PUBLISHABLE_KEY",
  ),
  publicNetworkDetails: {
    ethereum: {
      ...NETWORK_DETAILS.ethereum,
      rpcUrls: [ethereumPublicRpc],
    },
    polygon: {
      ...NETWORK_DETAILS.polygon,
      rpcUrls: [polygonPublicRpc],
    },
    arbitrum: {
      ...NETWORK_DETAILS.arbitrum,
      rpcUrls: [arbitrumPublicRpc],
    },
    "arbitrum-sepolia": {
      ...NETWORK_DETAILS["arbitrum-sepolia"],
      rpcUrls: [arbitrumSepoliaPublicRpc],
    },
  },
  defaultTransactionSpeed: "fast",
  defaultSlippage: 0.5,
  transactionSpeedMultipliers: {
    fast: 1.2,
    fastest: 1.3,
  },
  tokenIconPlaceholderUrl: "/assets/images/token-placeholder.png",
  disabledCollaterals: ["FOREX"],
  fxTokens: sdkConfig.fxTokenAddresses,
  unsupportedFxTokenScreens: {
    fxPHP: [SCREEN_DASHBOARD, SCREEN_TRADE, SCREEN_VAULT],
    fxKRW: [SCREEN_TRADE],
  },
  /** @note If a token is unsupported on any of the screens, it will be omitted from the result */
  getFxTokensForScreens: (screens: FxTokenScreen[]): Record<string, string> => {
    const fxTokens = { ...config.fxTokens };
    Object.keys(fxTokens).forEach(symbol => {
      for (let screen of screens) {
        if (config.unsupportedFxTokenScreens[symbol]?.includes(screen)) {
          delete fxTokens[symbol];
        }
      }
    });
    return fxTokens;
  },
  leverageDisplay: {
    hlp: {
      max: 100,
      default: 20,
      step: 0.1,
      min: 1.1,
      marks: 5,
      decimalPrecision: 1,
    },
    glp: {
      max: 50,
      default: 10,
      step: 0.1,
      min: 1.1,
      marks: 5,
      decimalPrecision: 1,
    },
  },
  dynamicEnvironmentIds: {
    sandbox: dynamicSandboxEnvironmentId,
    live: dynamicLiveEnvironmentId,
  },
};

export const ALCHEMY_API_KEY = ensureEnvExists(
  import.meta.env.VITE_ALCHEMY_API_KEY,
  "VITE_ALCHEMY_API_KEY",
);

export const SIGN_TERMS_BUTTON_TEXT = "sign terms of use";

export const DEFAULT_ACCOUNT = ethers.constants.AddressZero;

setConfig({
  magicKey: import.meta.env.VITE_MAGIC_PUBLISHABLE_KEY,
  publicNetworkDetails: config.publicNetworkDetails,
  privateRpcAddresses: config.privateRpcAddresses,
  walletConnectProjectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID,
  dynamicEnvironmentIds: config.dynamicEnvironmentIds,
});

const isLocalServer = checkIsLocalServer();

if (import.meta.env.VITE_LOCALHOST_API_BASE_URL && isLocalServer) {
  setApiBaseUrl(import.meta.env.VITE_LOCALHOST_API_BASE_URL);
}

if (import.meta.env.VITE_API_BASE_URL) {
  setApiBaseUrl(import.meta.env.VITE_API_BASE_URL);
}
