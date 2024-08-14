import { ethers, BigNumber } from "ethers";
import {
  bigNumberToFloat,
  digits,
  getLocaleNumberSeparators,
  getTokenAmountDisplayDecimals,
} from "./general";
import { TransactionSpeedPreset } from "../types/transaction-speed";
import { AMOUNT_DECIMALS } from "handle-sdk/dist/components/trade";
import { PERIODIC_FEES_DISPLAY_DECIMALS } from "../config/trade";

export const displayDollarsAndCents = (
  bn: ethers.BigNumber,
  decimals: number = 18,
): string | undefined => bnToDisplayString(bn, decimals, 2);

export const bnToDisplayString = (
  bn: ethers.BigNumber,
  bigNumberDecimals: number,
  minDisplayDecimals: number = 2,
  maxDisplayDecimals: number | undefined = minDisplayDecimals,
) =>
  bigNumberToFloat(bn, bigNumberDecimals).toLocaleString(undefined, {
    minimumFractionDigits: minDisplayDecimals,
    maximumFractionDigits: maxDisplayDecimals,
  });

export const amountToDisplayString = (
  bn: ethers.BigNumber,
  minDisplayDecimals: number = 2,
  maxDisplayDecimals: number | undefined = minDisplayDecimals,
) =>
  bnToDisplayString(
    bn,
    AMOUNT_DECIMALS,
    minDisplayDecimals,
    maxDisplayDecimals,
  );

export const bnToCompactDisplayString = (
  bn: ethers.BigNumber,
  bigNumberDecimals: number,
) => formatNumberCompact(bigNumberToFloat(bn, bigNumberDecimals));

export const fxTokenSymbolToCurrency = (symbol: string): string =>
  symbol.substring("fx".length);

export const getDurationTextFromWeekNumber = (weekN: number) => {
  if (weekN < 1 / 7 / 24) {
    return pluralText(weekN * 7 * 24 * 60, "minute");
  }
  if (weekN < 1 / 7) {
    return pluralText(weekN * 7 * 24, "hour");
  }
  if (weekN < 1) {
    return pluralText(weekN * 7, "day");
  }
  if (weekN < 4) {
    return pluralText(weekN, "week");
  }
  const months = weekN / 4;
  if (months < 12) {
    return pluralText(months, "month");
  }
  const years = months / 12;
  return pluralText(years, "year");
};

const pluralText = (left: number, text: string) =>
  `${left.toLocaleString(undefined, digits(0))} ${text}${
    parseInt(left.toString()) !== 1 ? "s" : ""
  }`;

export const truncateAddress = (
  address: string,
  startChars: number = 6,
  endChars: number = 4,
) => {
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
};

export const getGasPriceMessage = (
  gasPrice: BigNumber,
  transactionSpeed: TransactionSpeedPreset,
) => {
  const gasPriceMessageSuffix = "will be applied. use settings to adjust.";
  const gasPriceDisplay = bnToDisplayString(gasPrice, 9, 2);
  const gasPriceMessagePrefix = `${transactionSpeed} gas price of`;
  return `${gasPriceMessagePrefix} ${gasPriceDisplay} ${gasPriceMessageSuffix}`;
};

export const getImageString = (
  src: string,
  alt: string,
  size: number,
  style: string,
) => `<img width="${size}" src="${src}" alt="${alt}" style="${style}" />`;

/// formats a value to locale string format decimal places based upon whether it is an fxToken or not (for token values) plus an override for other value such as percentages
export const valueToDisplayString = (
  value: number,
  token: string,
  overrideDecimals?: number,
) => {
  const localeNumberSeparators = getLocaleNumberSeparators();
  const decimals = overrideDecimals
    ? overrideDecimals
    : getTokenAmountDisplayDecimals(token);

  return value
    ? formatNumber(value, decimals)
    : `0${localeNumberSeparators.decimalSeparator}${"0".repeat(decimals)}`;
};

export const formatNumber = (
  value: number,
  decimals = 2,
  minDecimals?: number,
) => value.toLocaleString(undefined, digits(minDecimals ?? decimals, decimals));

export const formatNumberCompact = (value: number) =>
  Intl.NumberFormat("en", { notation: "compact" }).format(value);

export const numberify = (value: string) => {
  return Number(removeWholeNumberSeparatorsFromNumberString(value));
};

export const numberifyWithRanges = (value: string) => {
  if (value.includes(" => ")) {
    value = value.split(" => ").at(-1) as string;
  }
  return numberify(value);
};

export const fxTokenSymbolFromKeeperSymbol = (keeperPoolSymbol: string) =>
  keeperPoolSymbol.slice(0, 2) + keeperPoolSymbol.slice(-3).toUpperCase();

export const addWholeNumberSeparatorsToNumberString = (number: string) => {
  if (number === "") return number;
  const localeNumberSeparators = getLocaleNumberSeparators();
  const parts = removeWholeNumberSeparatorsFromNumberString(number).split(
    localeNumberSeparators.decimalSeparator,
  );
  const integerPart = +parts[0];
  const decimalPart = parts.slice(1).join();

  const wholeNumberWithSeparators = integerPart.toLocaleString();
  return `${wholeNumberWithSeparators}${
    parts.length > 1 || number.includes(localeNumberSeparators.decimalSeparator)
      ? localeNumberSeparators.decimalSeparator
      : ""
  }${decimalPart}`;
};

export const removeWholeNumberSeparatorsFromNumberString = (
  number: string,
  keepDecimalSeparator?: boolean,
) => {
  if (number === "") return number;
  const localeNumberSeparators = getLocaleNumberSeparators();
  const parts = number.split(localeNumberSeparators.decimalSeparator);
  // Ensure that if "." is entered to start a number that the "0." is assumed.
  const integerPart =
    parts[0] === ""
      ? "0"
      : parts[0].replaceAll(localeNumberSeparators.wholeNumberSeparator, "");
  return `${integerPart}${
    parts.length > 1 ||
    (number.includes(localeNumberSeparators.decimalSeparator) &&
      keepDecimalSeparator)
      ? localeNumberSeparators.decimalSeparator
      : ""
  }${parts.slice(1).join()}`;
};

// This is necessary to convert a number string to a BigNumber compatible string
// in the case where it may be formatted as a locale number string
// with whole number separators and non-standard decimal separator
// because ethers does not accept non-period decimal separators.
export const convertNumberStringToBigNumberCompatibleString = (
  number: string,
) =>
  removeWholeNumberSeparatorsFromNumberString(number).replace(
    getLocaleNumberSeparators().decimalSeparator,
    ".",
  );

export const bnToDisplayStringUsingLeftChevronIfLtZero = (
  value: BigNumber,
  decimals: number,
  displayDecimals: number,
  suffix?: string,
) => {
  const prefix = value.lt(0) ? "<" : "";
  const valueBnToDisplay = value.gte(0) ? value : ethers.constants.Zero;
  const valueToDisplay = bnToDisplayString(
    valueBnToDisplay,
    decimals,
    displayDecimals,
  );
  return `${prefix}${valueToDisplay}${suffix ?? ""}`;
};

const getFeeSign = (value: BigNumber) => {
  if (value.eq(0)) {
    return "";
  }
  return value.gt(0) ? "-" : "+";
};

export const getPositionFundingFeeDisplay = (value: BigNumber) => {
  // The fees are positive if they are paid by the user
  // and negative if paid to the user
  // so reverse the sign for the position display.
  const totalPositionFeesValueDisplay = bnToDisplayString(
    value.abs(),
    AMOUNT_DECIMALS,
    PERIODIC_FEES_DISPLAY_DECIMALS,
  );
  return `${getFeeSign(value)}${totalPositionFeesValueDisplay}`;
};
