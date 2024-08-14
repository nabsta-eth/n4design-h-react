import {
  ActiveDecreaseOrder,
  ActiveIncreaseOrder,
  PRICE_DECIMALS,
  Trade,
} from "handle-sdk/dist/components/trade/platforms/legacyInterface";
import { BigNumber, ethers } from "ethers";
import { InputNumberState } from "../../hooks/useInputNumberState";
import { TransactionNotification } from "@handle-fi/react-components/dist/utils/notifications";
import { TranslationMap } from "src/types/translation";
import { bnToDisplayString } from "../format";
import { Pair } from "handle-sdk/dist/types/trade";
import { SendTransaction } from "../../hooks/useSendTransaction";

export enum OrderType {
  Market,
  Limit,
  StopLimit,
}

export const getTriggerPriceLabel = (
  t: TranslationMap,
  orderType: OrderType,
) => {
  if (orderType === OrderType.Market) {
    return undefined;
  }
  if (orderType === OrderType.Limit) {
    return t.limitPrice;
  }
  if (orderType === OrderType.StopLimit) {
    return t.triggerPrice;
  }
  throw new Error(`Unknown order type: ${orderType}`);
};

export const isIncreaseOrder = (
  order: ActiveIncreaseOrder | ActiveDecreaseOrder,
): order is ActiveIncreaseOrder => {
  return "purchaseToken" in order;
};

export const orderTypeToDisplay = (
  t: TranslationMap,
  orderType: OrderType,
): string => {
  if (orderType === OrderType.Market) {
    return t.marketOrderName;
  }
  if (orderType === OrderType.Limit) {
    return t.limitOrderName;
  }
  if (orderType === OrderType.StopLimit) {
    return t.stopOrderName;
  }
  throw new Error("invalid ordertype");
};

export const triggerThresholdToOrderType = (
  isLong: boolean,
  shouldTriggerAboveThreshold: boolean,
  isIncrease: boolean,
) => {
  if (isIncrease) {
    return isLong === shouldTriggerAboveThreshold
      ? OrderType.StopLimit
      : OrderType.Limit;
  }
  return isLong === shouldTriggerAboveThreshold
    ? OrderType.Limit
    : OrderType.StopLimit;
};

/**
 * @returns Returns whether the order should trigger above a threshold.
 */
export const orderTypeToTriggerThreshold = (
  isLong: boolean,
  orderType: OrderType,
  isIncrease: boolean,
) => {
  if (isIncrease) {
    return isLong
      ? orderType === OrderType.StopLimit
      : orderType === OrderType.Limit;
  }
  return isLong
    ? orderType === OrderType.Limit
    : orderType === OrderType.StopLimit;
};

export const getIncreaseTriggerOrderError = (
  t: TranslationMap,
  triggerPrice: InputNumberState,
  isLong: boolean,
  orderType: OrderType,
  actionPrice: BigNumber,
) => {
  if (orderType === OrderType.Market) {
    return undefined;
  }
  if (triggerPrice.value.bn.isZero()) {
    return t.enterATriggerPrice;
  }

  if (isLong) {
    if (
      orderType === OrderType.Limit &&
      triggerPrice.value.bn.gt(actionPrice)
    ) {
      return t.limitOrderWillTriggerImmediately;
    }
    if (
      orderType === OrderType.StopLimit &&
      triggerPrice.value.bn.lt(actionPrice)
    ) {
      return t.stopOrderWillTriggerImmediately;
    }
  }
  if (!isLong) {
    if (
      orderType === OrderType.Limit &&
      triggerPrice.value.bn.lt(actionPrice)
    ) {
      return t.limitOrderWillTriggerImmediately;
    }
    if (
      orderType === OrderType.StopLimit &&
      triggerPrice.value.bn.gt(actionPrice)
    ) {
      return t.stopOrderWillTriggerImmediately;
    }
  }
};

export const getDecreaseTriggerOrderError = (
  t: TranslationMap,
  triggerPrice: InputNumberState,
  isLong: boolean,
  orderType: OrderType,
  actionPrice: BigNumber,
) => {
  const isLimit = orderType === OrderType.Limit;
  if (triggerPrice.value.string === "") {
    return t.enterATriggerPrice;
  }

  if (isLong) {
    if (isLimit && triggerPrice.value.bn.gt(actionPrice)) {
      return t.limitOrderWillTriggerImmediately;
    }
    if (!isLimit && triggerPrice.value.bn.lt(actionPrice)) {
      return t.stopOrderWillTriggerImmediately;
    }
  }
  if (!isLong) {
    if (isLimit && triggerPrice.value.bn.lt(actionPrice)) {
      return t.limitOrderWillTriggerImmediately;
    }
    if (!isLimit && triggerPrice.value.bn.gt(actionPrice)) {
      return t.stopOrderWillTriggerImmediately;
    }
  }
};

type OrderCancelProps = {
  t: TranslationMap;
  orderId: string;
  pair: Pair;
  isIncrease: boolean;
  signer: ethers.Signer | undefined;
  platform: Trade;
  slippage: number;
  sendTransaction: SendTransaction;
  refresh: () => Promise<void>;
};

export const onCancelOrder = async ({
  t,
  orderId,
  pair,
  isIncrease,
  signer,
  platform,
  slippage,
  sendTransaction,
  refresh,
}: OrderCancelProps) => {
  if (!signer) throw new Error("Signer is undefined");

  const notifications: TransactionNotification = {
    awaitingApproval: t.awaitingApproval,
    error: t.errorCancellingOrder,
    pending: "cancelling order",
    success: t.successfullyCancelledOrder,
  };

  await sendTransaction(
    gasPrice => {
      return isIncrease
        ? platform.updateIncreasePositionOrder({
            orderId: orderId,
            indexDelta: ethers.constants.Zero,
            collateralDelta: ethers.constants.Zero,
            shouldTriggerAboveThreshold: false,
            triggerPrice: ethers.constants.Zero,
            signer,
            slippagePercent: slippage,
            pair,
            overrides: { gasPrice },
          })
        : platform.updateDecreasePositionOrder({
            orderId: orderId,
            indexDelta: ethers.constants.Zero,
            collateralDelta: ethers.constants.Zero,
            shouldTriggerAboveThreshold: false,
            triggerPrice: ethers.constants.Zero,
            signer,
            slippagePercent: slippage,
            pair,
            overrides: { gasPrice },
          });
    },
    notifications,
    {
      callback: refresh,
    },
  );
};

/**
 * Examples:
 *   getButtonActionText("buy", parseUnits("1000", 30), OrderType.Market)
 *     >> "buy @ market"
 *   getButtonActionText("buy", parseUnits("1000", 30), OrderType.Limit)
 *     >> "buy @ 1,000 limit"
 */
export const getButtonActionText = (
  t: TranslationMap,
  pair: Pair,
  displayDecimals: number,
  action: string,
  price: BigNumber | undefined,
  orderType: OrderType,
): string => {
  if (orderType === OrderType.Market) {
    return `${action} @ ${orderTypeToDisplay(t, orderType)}`;
  }
  if (!price) {
    throw new Error("price must be provided for non-market order display");
  }
  const priceNum = bnToDisplayString(
    price,
    PRICE_DECIMALS,
    undefined,
    displayDecimals,
  );
  return `${action} @ ${priceNum} ${orderTypeToDisplay(t, orderType)}`;
};

export const getPriceTextToDisplay = (
  t: TranslationMap,
  orderType: OrderType,
) => (orderType === OrderType.Market ? `est. ${t.entryPrice}` : t.orderPrice);
