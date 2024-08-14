import { BigNumber, constants, ethers } from "ethers";
import { Network, TokenInfo, trade } from "handle-sdk";
import {
  bnToDisplayString,
  numberify,
  removeWholeNumberSeparatorsFromNumberString,
} from "./format";
import axios from "axios";
import { USD_DISPLAY_DECIMALS } from "./trade";
import { PRICECHART_TILE_ID_PREFIX, PriceChartTiles } from "./local-storage";
import { isFxTokenSymbol } from "handle-sdk/dist/utils/fxToken";
import { TRADE_CHART_BUY_SELL_BUTTONS_DRAG_HANDLE_CLASS_PREFIX } from "../config/trade";
import { BLOCK_EXPLORER_URL_MAP } from "@handle-fi/react-components";
import { config } from "../config";

export const isValidBigNumber = (value: string, decimals = 0): boolean => {
  try {
    if (value.startsWith("0x")) {
      value = BigNumber.from(value).toString();
    }
    ethers.utils.parseUnits(value, decimals);
    return true;
  } catch (error) {
    return false;
  }
};

export const bigNumberToFloat = (
  bn: ethers.BigNumber,
  decimals: number = 18,
): number => parseFloat(ethers.utils.formatUnits(bn, decimals));

type ExplorerEntity = "tx" | "address" | "token" | "contract";

export const getExplorerUrl = (
  data: string,
  type: ExplorerEntity,
  network: Network,
) => `${BLOCK_EXPLORER_URL_MAP[network]}/${type}/${data}`;

export const getExplorerName = (network: Network) =>
  BLOCK_EXPLORER_URL_MAP[network]?.split("https://")?.pop()?.split(".")[0];

export const getExplorerMetadata = (
  data: string,
  type: ExplorerEntity,
  network: Network,
) => {
  const name = getExplorerName(network);
  const url = getExplorerUrl(data, type, network);

  return {
    name,
    url,
    prompt: `view ${type} on ${name}`,
  };
};

export const digits = (minDigits: number, maxDigits: number = minDigits) => {
  return {
    minimumFractionDigits: minDigits,
    maximumFractionDigits: maxDigits,
  };
};

export const isFxToken = (symbol: string) => {
  return symbol.startsWith("fx") && symbol.length === 5;
};

/// Returns ETH if the input symbol is WETH.
export const replaceWrappedSymbolForNative = (symbol: string) =>
  symbol === "WETH" ? "ETH" : symbol;

/// Returns WETH if the input symbol is ETH.
export const replaceNativeSymbolForWrapped = (symbol: string) =>
  symbol === "ETH" ? "WETH" : symbol;

export const getDisplayDecimalsByValue = (
  value: number,
  defaultDecimals = USD_DISPLAY_DECIMALS,
  maxDecimals = 6,
) => {
  let decimalsToUse = defaultDecimals;
  const absValue = Math.abs(value);
  if (absValue && absValue < 0.01) {
    const numberOfZeroDecimals = -Math.floor(Math.log10(absValue) + 1);
    const calculatedDecimalsToUse = numberOfZeroDecimals + 2;
    decimalsToUse =
      calculatedDecimalsToUse > maxDecimals
        ? maxDecimals
        : calculatedDecimalsToUse;
  } else if (absValue && absValue < 1) {
    decimalsToUse = 4;
  } else if (absValue && absValue > 1000) {
    decimalsToUse = 2;
  }
  return decimalsToUse;
};

export const getTokenAmountDisplayDecimals = (symbol: string, value?: number) =>
  getDisplayDecimalsByValue(value ?? 0, isFxToken(symbol) ? 4 : 2);

export const getTokenBalanceDisplayDecimals = (token: string) =>
  isFxToken(token) ? 2 : 4;

export const getPositionSizeDisplayDecimals = (token: string) =>
  isFxToken(token) ? 2 : 4;

export const getCollateralDisplayDecimals = (token: string) => {
  switch (token) {
    case "ETH":
    case "WETH":
    case "BTC":
      return 4;
    default:
      return 2;
  }
};

export const transformDecimals = (
  n: BigNumber,
  fromDecimals: number,
  toDecimals: number,
) => {
  if (!BigNumber.isBigNumber(n)) n = BigNumber.from(n);
  const factor = BigNumber.from(10).pow(Math.abs(toDecimals - fromDecimals));
  return toDecimals > fromDecimals ? n.mul(factor) : n.div(factor);
};

export const average = (array: number[]): number =>
  array.reduce((a, b) => a + b) / array.length;

export const formatPercentage = (
  numerator: number,
  denominator: number,
  displayDecimals?: number,
) => {
  const percentage = (numerator * 100) / denominator;
  if (!displayDecimals) return `${percentage}%`;
  return percentage.toFixed(displayDecimals) + "%";
};

export const waitForBlockWithTimestamp = async (
  timestamp: number,
  provider: ethers.providers.Provider,
) => {
  return new Promise<void>(async resolve => {
    const checkBlock = async () => {
      const block = await provider.getBlock("latest");
      if (block?.timestamp && block.timestamp >= timestamp) {
        resolve();
        provider.removeListener("block", checkBlock);
      }
    };
    await checkBlock();
    provider.addListener("block", checkBlock);
  });
};

export type UkTooltipType = {
  title: string;
  position:
    | "top"
    | "top-left"
    | "top-right"
    | "bottom"
    | "bottom-left"
    | "bottom-right"
    | "left"
    | "right";
  classes?: string;
  hide?: boolean;
};

export const getUkTooltip = (props: UkTooltipType): string | undefined => {
  const classes = props.classes ? "; cls: " + props.classes : "";
  return props.hide
    ? undefined
    : `title: ${props.title}; pos: ${props.position}${classes};`;
};

export const numericSort = (a: any, b: any, isDescending: boolean) => {
  const aValue = numberify(a);
  const bValue = numberify(b);
  return isDescending ? bValue - aValue : aValue - bValue;
};

export const safeGetElementById = (id: string): HTMLElement => {
  const element = document.getElementById(id);
  if (element === null)
    throw new Error(`Cannot find element by the id "${id}"`);
  return element;
};

/// Checks whether the app is running within Gnosis safe.
export const isWithinGnosisApp = () =>
  document.referrer.includes("gnosis-safe.io") ||
  document.referrer.includes("app.safe.global");

export const snakeOrKebabCaseToCamelCase = (str: string) =>
  str
    .replace("VITE_", "")
    .toLowerCase()
    .replace(/([-_][a-z])/g, group =>
      group.toUpperCase().replace("-", "").replace("_", ""),
    );

// This used where a child package may need to access environment variables.
export const ensureEnvExists = (value: string | null, name: string): string => {
  if (!value || value?.length === 0) {
    throw new Error(`${name} environment variable is not set`);
  }
  return value;
};

export const stripFx = (s: string) => {
  if (isFxToken(s)) {
    return s.slice(2);
  }
  return s;
};

export const stripStringPrefix = (content: string, prefix: string): string => {
  if (content.startsWith(prefix)) {
    content = content.slice(prefix.length);
  }
  return content;
};

export const capBnFloor = (bn: BigNumber, floor: BigNumber): BigNumber =>
  bn.lt(floor) ? floor : bn;

export const capBnCeiling = (bn: BigNumber, ceiling: BigNumber): BigNumber =>
  bn.gt(ceiling) ? ceiling : bn;

export const daysToSeconds = (days: number) => Math.floor(days) * 24 * 60 * 60;

export const logTrace = (
  name: string,
  startTime: number,
  ignoreSmallIntervals = true,
) => {
  const diff = Date.now() - startTime;
  if (ignoreSmallIntervals && diff < 250) return;
  console.log(`[handle-react] trace: ${name} took ${diff} ms`);
};

export const fetchDataHttp = <T>(url: string) =>
  axios.get(url).then(response => response.data as T);

export const sumBn = (nums: BigNumber[]) =>
  nums.reduce((acc, curr) => acc.add(curr), constants.Zero);

export const uniqueId = (n: number) =>
  (Math.random().toString(36) + "00000000000000000").slice(2, n + 2);

export const toDisplaySymbolAmount = (
  amount: BigNumber,
  token: string,
  decimals = trade.AMOUNT_DECIMALS,
  showSymbol = true,
) => {
  return `${bnToDisplayString(
    amount,
    decimals,
    token === "USD"
      ? USD_DISPLAY_DECIMALS
      : getTokenBalanceDisplayDecimals(token),
  )}${showSymbol ? " " + token : ""}`;
};

export const getZeroDecimalString = (decimals: number) =>
  `0${getLocaleNumberSeparators().decimalSeparator}${"0".repeat(decimals)}`;

export const sleep = (delay: number) =>
  new Promise(resolve => setTimeout(resolve, delay));

export const minZero = (n: BigNumber) =>
  n.isNegative() ? ethers.constants.Zero : n;

export const getLocaleNumberSeparators = () => {
  // default
  const res = {
    decimalSeparator: ".",
    wholeNumberSeparator: ",",
  };

  // convert a number formatted according to locale
  const str = parseFloat("1234.56").toLocaleString();

  // if the resulting number does not contain previous number
  // (i.e. in some Arabic formats), return defaults
  if (!str.match("1")) return res;

  // get decimal and wholeNumberSeparator separators
  res.decimalSeparator = str.replace(/.*4(.*)5.*/, "$1");
  res.wholeNumberSeparator = str.replace(/.*1(.*)2.*/, "$1");

  // Gets the unicode value for the whole number separator.
  // This needs to be tested to avoid crashes where it is
  // a non-breaking space character.
  // TODO: #3441 https://github.com/handle-fi/handle-react/issues/3441
  //  Add tests once we have a way to test
  //  the app in different languages.
  let charCode = "";
  for (let i = 0; i < res.wholeNumberSeparator.length; i++) {
    let s = res.wholeNumberSeparator.charCodeAt(i).toString(16);
    while (s.length < 2) {
      s = "0" + s;
    }
    charCode += s;
  }
  // This caters for languages where the whole number separator is a non-breaking space.
  if (charCode === "202f" || charCode === "00a0")
    res.wholeNumberSeparator = ".";

  return res;
};

/** Check if a number is valid according to locale:
 * @param value string number value to test;
 * @param decimals optional number of decimals
 * to allow for checking the number does not exceed them if supplied.
 */
export const isValidNumber = (value: string, decimals?: number) => {
  // Remove any display separators.
  const parsedValue = removeWholeNumberSeparatorsFromNumberString(value);
  // Ensure spaces are rejected.
  const localeNumberSeparators = getLocaleNumberSeparators();
  // isNaN requires period decimal separator.
  if (
    parsedValue.includes(" ") ||
    isNaN(+parsedValue.replace(localeNumberSeparators.decimalSeparator, "."))
  )
    return false;
  // Ensure only whole number and optional decimals.
  if (value.split(localeNumberSeparators.decimalSeparator).length > 2)
    return false;
  // Ensure no double whole number separators.
  // Some languages have no whole number separator,
  // so we don't check for in that case.
  if (
    localeNumberSeparators.wholeNumberSeparator !== "" &&
    value.split(
      `${localeNumberSeparators.wholeNumberSeparator}${localeNumberSeparators.wholeNumberSeparator}`,
    ).length > 1
  )
    return false;
  // Ensure no double decimal separators.
  if (
    value.split(
      `${localeNumberSeparators.decimalSeparator}${localeNumberSeparators.decimalSeparator}`,
    ).length > 1
  )
    return false;
  // Ensure no whole number separators in the decimals.
  const parts = parsedValue.split(localeNumberSeparators.decimalSeparator);
  if (
    localeNumberSeparators.wholeNumberSeparator !== "" &&
    parts.length > 1 &&
    parts[1].split(localeNumberSeparators.wholeNumberSeparator).length > 1
  )
    return false;
  // Ensure decimals don't exceed the number's defined decimals.
  if (
    decimals &&
    parsedValue.includes(localeNumberSeparators.decimalSeparator) &&
    parsedValue.toString().split(localeNumberSeparators.decimalSeparator)[1]
      .length > decimals
  )
    return false;
  return true;
};

export const getNextPriceChartTileId = (priceChartTiles: PriceChartTiles) => {
  const currentPriceChartTileKeys = Object.keys(priceChartTiles ?? {});
  const currentHighestPriceChartNumber = currentPriceChartTileKeys.length
    ? +currentPriceChartTileKeys[currentPriceChartTileKeys.length - 1].replace(
        PRICECHART_TILE_ID_PREFIX,
        "",
      )
    : 0;
  const nextPriceChartNumber = currentHighestPriceChartNumber + 1;
  return getPriceChartTileId(nextPriceChartNumber);
};

export const getPriceChartTileId = (suffix: number) =>
  `${PRICECHART_TILE_ID_PREFIX}${suffix}`;

export const getIsHandleToken = (token: TokenInfo) =>
  isFxTokenSymbol(token.symbol) ||
  !!token.extensions?.isHlpToken ||
  !!token.extensions?.isNative ||
  !!token.extensions?.isLiquidityToken;

export const retryPromise = async <T>(
  promiseGetter: () => Promise<T>,
  maxRetries = 3,
  sleepMs = 250 + Math.random() * 50,
): Promise<T> => {
  let retries = 0;
  let lastError: unknown;
  while (retries < maxRetries) {
    try {
      return await promiseGetter();
    } catch (e) {
      lastError = e;
    }
    retries += 1;
    await sleep(sleepMs);
  }
  throw lastError;
};

export const getDragHandleClass = (chartId: string) =>
  `${TRADE_CHART_BUY_SELL_BUTTONS_DRAG_HANDLE_CLASS_PREFIX}-${chartId
    .replaceAll("_", "-")
    .toLowerCase()}`;

// TODO: #4047 - https://github.com/handle-fi/handle-react/issues/4047
// This should be replaced when Spritesheet token images work for notifications.
export const getTokenImageUriWithFallback = (token: TokenInfo): string => {
  if (!isFxToken(token.symbol) && token.symbol !== "FOREX") {
    return token.logoURI ?? config.tokenIconPlaceholderUrl;
  }
  const valueToUse = isFxToken(token.symbol) ? token.symbol : "";
  return `https://arbiscan.io/token/images/handlefi${stripFx(
    valueToUse,
  )}_32.png`;
};
