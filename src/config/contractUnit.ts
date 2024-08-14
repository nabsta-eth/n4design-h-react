import { Instrument } from "handle-sdk/dist/components/trade";
import { Pair } from "handle-sdk/dist/types/trade";
import { pairToString } from "handle-sdk/dist/utils/general";

/**
 * Defines the displayed contract unit type.
 * Note this is a front-end value only, and for UX reasons.
 * In the back-end, everything is essentially considered as "unitless".
 * There are 3 cases for an instrument unit type:
 * 1. The base asset of the pair being traded.
 *    This only applies if the quote asset is equal to the LP currency.
 *    e.g. if trading ETH/USD on a USD LP, then the contract unit is ETH.
 * 2. A unitless number.
 *    This applies for all cases where a custom unit is not defined,
 *    and the quote asset symbol is not the same as the LP currency.
 * 3. A custom unit.
 *    For example, XAU/USD has units of gold ounces,
 *    and WTI/USD has a units of oil barrels.
 */
export type ContractUnitType =
  | "base-asset-because-quote-matches-lpc"
  | "unitless-number"
  | "custom";

export type ContractUnitConfig = {
  unit: ContractUnit;
  lotSize: number;
};

export type ContractUnit = {
  type: ContractUnitType;
  display: string;
};

export const DEFAULT_LOT_SIZE = 1;

export const getContractUnitConfig = (
  pair: Pair,
  instrument: Instrument,
  lpCurrencySymbol: string,
  isShort?: boolean,
): ContractUnitConfig => {
  const lotSize =
    getUserDefinedLotSize(pair) ??
    instrument.defaultLotSize ??
    DEFAULT_LOT_SIZE;
  const customUnitToUse = instrument.getUnitName(isShort);
  const unit = getContractUnit(pair, lpCurrencySymbol, customUnitToUse);
  return {
    unit,
    lotSize,
  };
};

const getContractUnit = (
  pair: Pair,
  lpCurrencySymbol: string,
  customUnitDisplay: string | undefined,
): ContractUnit => {
  const doesQuoteMatchLpc = lpCurrencySymbol === pair.quoteSymbol;
  const type = getUnitType(doesQuoteMatchLpc, !!customUnitDisplay);
  const display = getUnitDisplay(
    type,
    pair,
    lpCurrencySymbol,
    customUnitDisplay,
  );
  return {
    type,
    display,
  };
};

const getUnitType = (
  doesQuoteMatchLpc: boolean,
  hasCustomUnitDisplay: boolean,
): ContractUnitType => {
  if (hasCustomUnitDisplay) {
    return "custom";
  }
  return doesQuoteMatchLpc
    ? "base-asset-because-quote-matches-lpc"
    : "unitless-number";
};

const getUnitDisplay = (
  type: ContractUnitType,
  pair: Pair,
  lpCurrencySymbol: string,
  customUnitDisplay: string | undefined,
): string => {
  if (customUnitDisplay) {
    return customUnitDisplay;
  }
  switch (type) {
    case "base-asset-because-quote-matches-lpc":
      return pair.baseSymbol;
    case "unitless-number":
    default:
      return `1 ${lpCurrencySymbol} × ${pairToString(pair)}`;
  }
};

// TODO: user-configured lot sizes via Settings panel.
const getUserDefinedLotSize = (_pair: Pair): number | null => null;
