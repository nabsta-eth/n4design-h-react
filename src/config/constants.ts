import { ethers } from "ethers";
import { LpPlatform, NetworkMap } from "handle-sdk";
import { CustomSliderMark } from "../utils/slider";
import { BLOCK_EXPLORER_URL_MAP } from "@handle-fi/react-components";

export const NUMBER_PRICE_DECIMALS = 2;
export const CHAINLINK_PRICE_DECIMALS = 8;
export const COIN_GECKO_PRICE_DECIMALS = 8;
export const FOREX_AND_FX_TOKEN_DECIMALS = 18;

export const SECONDS_IN_A_DAY = 24 * 60 * 60;
export const SECONDS_IN_A_WEEK = SECONDS_IN_A_DAY * 7;

export const DAYS_IN_A_YEAR = 365;

export const MIN_REWARD_BOOST = 1;
export const MAX_REWARD_BOOST = 2.5;

export const PLATFORM_NAME_TO_LOGO_URL: Record<LpPlatform, string> = {
  handle: "/assets/images/platform/handle-logo.svg",
  sushi: "/assets/images/platform/sushi-logo.svg",
  curve: "/assets/images/platform/curve-logo.svg",
  sperax: "/assets/images/platform/sperax-logo.svg",
  // @ts-ignore typescript wants this to return a string, but it won't because it
  // will always throw
  get balancer() {
    throw new Error("balancer does not have an image");
  },
};

export const NETWORK_DETAILS: NetworkMap<web3.NetworkDetails> = {
  ethereum: {
    chainName: "Ethereum Mainnet",
    chainId: "0x1",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    blockExplorerUrls: [BLOCK_EXPLORER_URL_MAP.ethereum],
  },
  arbitrum: {
    chainName: "Arbitrum One",
    chainId: "0xA4B1",
    nativeCurrency: {
      name: "Arbitrum Ether",
      symbol: "ETH",
      decimals: 18,
    },
    blockExplorerUrls: [BLOCK_EXPLORER_URL_MAP.arbitrum],
  },
  polygon: {
    chainName: "Polygon Mainnet",
    chainId: "0x89",
    nativeCurrency: {
      name: "Matic",
      symbol: "MATIC",
      decimals: 18,
    },
    blockExplorerUrls: [BLOCK_EXPLORER_URL_MAP.polygon],
  },
  "arbitrum-sepolia": {
    chainName: "Arbitrum Sepolia",
    chainId: "0x66EEE",
    nativeCurrency: {
      name: "A Ether",
      symbol: "ETH",
      decimals: 18,
    },
    blockExplorerUrls: [BLOCK_EXPLORER_URL_MAP["arbitrum-sepolia"]],
  },
};

export const BALANCE_MINIMUM = ethers.constants.Zero;
export const DEFAULT_HIDE_TOKEN_VALUE_THRESHOLD = "0.01";

export const LEVERAGE_DISPLAY_DECIMALS = 2;

export const USD_CURRENCY_LOGO_URI = "/assets/images/currency/usd-logo.png";

export const DEFAULT_MIN_CR = 200;
export const CR_SLIDER_STEP = 5;
export const CR_SLIDER_MIN_CR_TO_SHOW = 110;
export const CR_SLIDER_MARKS: CustomSliderMark[] = [
  {
    value: CR_SLIDER_MIN_CR_TO_SHOW,
    color: "red",
  },
  {
    value: 200,
    color: "orange",
  },
  {
    value: 300,
    color: "green",
  },
  {
    value: 500,
    color: "green",
  },
];

export const BASE_THEMES = [
  "handle",
  "handlePro",
  "handleView",
  "handleX",
  "handleBerg",
];
export const MODERN_THEME_NAME_SUFFIX = "Modern";
export const THEMES = BASE_THEMES.flatMap(baseTheme => [
  baseTheme,
  `${baseTheme}${MODERN_THEME_NAME_SUFFIX}`,
]);
export const DEFAULT_THEME = "handlePro";

export const INPUT_CHAR_WIDTH = 8.4;
export const INPUT_PADDING_FOR_ICONS = 84.75;

export const STANDARD_MODAL_WIDTH = 500;

// Threshold for removal of "dust" balances from wallet assets list.
export const TOKEN_BALANCE_EXCLUSION_THRESHOLD = 0.0001;
export const WALLET_BUTTON_GROUP_ID = "wallet-button-group";
export const WALLET_BUTTON_ID = "header-wallet-button";
