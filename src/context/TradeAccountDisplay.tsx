import React, { createContext, PropsWithChildren, useMemo } from "react";
import {
  SimulateTradeArgs,
  TradeAccount,
  TradeSimulation,
} from "handle-sdk/dist/components/trade";
import {
  expandDecimals,
  formatPrice,
  USD_DISPLAY_DECIMALS,
} from "../utils/trade";
import { BigNumber, constants, ethers } from "ethers";
import { bnToDisplayString } from "../utils/format";
import {
  AMOUNT_DECIMALS,
  AMOUNT_UNIT,
} from "handle-sdk/dist/components/trade/reader";
import { LEVERAGE_DISPLAY_DECIMALS } from "../config/constants";
import { minZero } from "../utils/general";
import { useTrade } from "./Trade";
import { useTradeSize } from "./TradeSize";
import { useTradePrices } from "./TradePrices";
import { useMemoInterval } from "../hooks/useMemoInterval";

// The account display will update on every price change.
// If for some reason prices are not streaming fast enough,
// this interval (used in this module) ensures that it updates
// at least this frequently.
const ACCOUNT_DISPLAY_UPDATE_INTERVAL_MS = 1000;

export type TradeAccountDisplay = {
  accountValue: BigNumber;
  availableEquity: BigNumber;
  accountEquity: BigNumber;
  maintenanceEquity: BigNumber;
  unrealisedEquity: BigNumber;
  marginUsage: BigNumber;
  leverage: BigNumber;
  reservedEquity: BigNumber;
  fundsUntilLiquidation: BigNumber;
  accountValueDisplay: string;
  reservedEquityDisplay: string;
  availableEquityDisplay: string;
  marginUsageDisplay: string;
  leverageDisplay: string;
  unrealisedEquityDisplay: string;
  fundsUntilLiquidationDisplay: string;
  hasSufficientMargin: boolean;
};

export type TradeAccountDisplayValue = {
  currentAccountDisplay: TradeAccountDisplay;
  simulated?: Simulated;
};

export type Simulated = {
  result: TradeSimulation;
  nextAccountDisplay: TradeAccountDisplay;
};

const ZERO: TradeAccountDisplay = {
  accountValue: constants.Zero,
  availableEquity: constants.Zero,
  maintenanceEquity: constants.Zero,
  unrealisedEquity: constants.Zero,
  reservedEquity: constants.Zero,
  marginUsage: constants.Zero,
  leverage: constants.Zero,
  fundsUntilLiquidation: constants.Zero,
  accountEquity: constants.Zero,
  unrealisedEquityDisplay: "",
  accountValueDisplay: "",
  reservedEquityDisplay: "",
  availableEquityDisplay: "",
  marginUsageDisplay: "",
  leverageDisplay: "",
  fundsUntilLiquidationDisplay: "",
  hasSufficientMargin: true,
};

const TradeAccountDisplayContext = createContext<TradeAccountDisplayValue>({
  currentAccountDisplay: ZERO,
});

export const TradeAccountDisplayProvider: React.FC<
  PropsWithChildren<{}>
> = props => {
  const prices = useTradePrices();
  const { account, protocol, selectedTradePairId, tradeGasFee } = useTrade();
  const { size, equityDelta } = useTradeSize();
  const price = protocol.tryGetPrice(selectedTradePairId, size);
  const simulationArgs: SimulateTradeArgs | undefined = useMemo(
    () =>
      price
        ? {
            pairId: selectedTradePairId,
            size,
            price,
            gasFee: tradeGasFee,
          }
        : undefined,
    [size.toString(), tradeGasFee.toString(), selectedTradePairId],
  );
  const simulated = useMemo((): Simulated | undefined => {
    if (
      !simulationArgs ||
      (simulationArgs.size.isZero() && equityDelta.isZero())
    ) {
      return undefined;
    }
    const result = account?.simulateTrade(simulationArgs);
    if (!result) {
      return undefined;
    }
    const nextAccountDisplay = getTradeAccountDisplays(
      result.nextAccount,
      equityDelta,
    );
    return {
      result,
      nextAccountDisplay,
    };
  }, [account, simulationArgs, equityDelta.toString()]);
  const currentAccountDisplay = useMemoInterval<TradeAccountDisplay>(
    () => getTradeAccountDisplays(account, constants.Zero),
    ACCOUNT_DISPLAY_UPDATE_INTERVAL_MS,
    [account, protocol.getLiquidityPools(), prices],
  );
  const value = useMemo(
    (): TradeAccountDisplayValue => ({
      currentAccountDisplay,
      simulated,
    }),
    [currentAccountDisplay, simulated],
  );
  return (
    <TradeAccountDisplayContext.Provider value={value}>
      {props.children}
    </TradeAccountDisplayContext.Provider>
  );
};

export const useTradeAccountDisplay = (
  showUnits = false,
): TradeAccountDisplayValue => {
  const context = React.useContext(TradeAccountDisplayContext);
  if (!context) {
    throw new Error("must be used inside TradeAccountDisplayProvider");
  }
  if (!showUnits) {
    return context;
  }
  const newValue = { ...context };
  newValue.currentAccountDisplay = addUnitsToDisplay(
    newValue.currentAccountDisplay,
  );
  if (newValue.simulated) {
    newValue.simulated.nextAccountDisplay = addUnitsToDisplay(
      newValue.simulated.nextAccountDisplay,
    );
  }
  return newValue;
};

const getTradeAccountDisplays = (
  account: TradeAccount | null,
  equityDelta = ethers.constants.Zero,
): TradeAccountDisplay => {
  const accountValue = equityDelta.add(
    account?.getEquity() ?? ethers.constants.Zero,
  );
  const leverage = account?.getLeverage() ?? ethers.constants.Zero;
  const leverageToDisplay = leverage.lt(0) ? ethers.constants.Zero : leverage;
  const reservedEquity =
    account?.getInitialMarginRequirement() ?? ethers.constants.Zero;
  const maintenanceEquity =
    account?.getMaintenanceMarginRequirement() ?? ethers.constants.Zero;
  const unrealisedEquity =
    account?.getUnrealisedEquity() ?? ethers.constants.Zero;
  const currentAvailableEquity = equityDelta.add(
    account?.getAvailableEquity() ?? ethers.constants.Zero,
  );
  const leverageDisplay = bnToDisplayString(
    leverageToDisplay,
    AMOUNT_DECIMALS,
    LEVERAGE_DISPLAY_DECIMALS,
  );
  const accountValueDisplay = formatPrice(
    accountValue,
    USD_DISPLAY_DECIMALS,
    "",
    AMOUNT_DECIMALS,
  );
  const reservedEquityDisplay = formatPrice(
    reservedEquity,
    USD_DISPLAY_DECIMALS,
    "",
    AMOUNT_DECIMALS,
  );
  const availableEquityDisplay = formatPrice(
    minZero(currentAvailableEquity),
    USD_DISPLAY_DECIMALS,
    "",
    AMOUNT_DECIMALS,
  );
  const marginUsage = getAccountMarginUsage(accountValue, reservedEquity);
  const marginUsageDisplay = bnToDisplayString(
    marginUsage,
    AMOUNT_DECIMALS,
    USD_DISPLAY_DECIMALS,
  );
  const unrealisedEquityDisplay = formatPrice(
    unrealisedEquity,
    USD_DISPLAY_DECIMALS,
    "",
    AMOUNT_DECIMALS,
  );
  const fundsUntilLiquidation =
    maintenanceEquity.gt(accountValue) || marginUsage.isZero()
      ? ethers.constants.Zero
      : accountValue?.sub(maintenanceEquity);
  const fundsUntilLiquidationDisplay = formatPrice(
    fundsUntilLiquidation,
    USD_DISPLAY_DECIMALS,
    "",
    AMOUNT_DECIMALS,
  );
  const hasSufficientMargin = marginUsage.lt(AMOUNT_UNIT.mul(100));
  return {
    accountValue,
    availableEquity: currentAvailableEquity,
    maintenanceEquity,
    unrealisedEquity,
    reservedEquity,
    marginUsage,
    leverage,
    fundsUntilLiquidation,
    unrealisedEquityDisplay,
    accountValueDisplay,
    reservedEquityDisplay,
    availableEquityDisplay,
    accountEquity: accountValue,
    marginUsageDisplay,
    leverageDisplay,
    fundsUntilLiquidationDisplay,
    hasSufficientMargin,
  };
};

const getAccountMarginUsage = (
  accountValue: BigNumber,
  reservedEquity: BigNumber,
) => {
  if (accountValue.gt(0)) {
    return reservedEquity
      .mul(expandDecimals(1, AMOUNT_DECIMALS + 2))
      .div(accountValue);
  }
  if (accountValue.lt(0)) {
    return expandDecimals(1, AMOUNT_DECIMALS + 2);
  }
  return ethers.constants.Zero;
};

const addUnitsToDisplay = (value: TradeAccountDisplay): TradeAccountDisplay => {
  value = { ...value };
  value.leverageDisplay = addSuffix(value.leverageDisplay, "x");
  value.accountValueDisplay = addSuffix(value.accountValueDisplay, " USD");
  value.reservedEquityDisplay = addSuffix(value.reservedEquityDisplay, " USD");
  value.availableEquityDisplay = addSuffix(
    value.availableEquityDisplay,
    " USD",
  );
  value.marginUsageDisplay = addSuffix(value.marginUsageDisplay, "%");
  value.unrealisedEquityDisplay = addSuffix(
    value.unrealisedEquityDisplay,
    " USD",
  );
  value.fundsUntilLiquidationDisplay = addSuffix(
    value.fundsUntilLiquidationDisplay,
    " USD",
  );
  return value;
};

const addSuffix = (value: string, suffix: string): string => {
  if (value.endsWith(suffix)) {
    return value;
  }
  return `${value}${suffix}`;
};
