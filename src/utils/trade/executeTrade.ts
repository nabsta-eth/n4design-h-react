import {
  BigNumber,
  ContractTransaction,
  PopulatedTransaction,
  Signer,
} from "ethers";
import { getAllowanceNotifications } from "../../config/notifications";
import { TokenInfo } from "handle-sdk";
import {
  Trade,
  PRICE_DECIMALS,
} from "handle-sdk/dist/components/trade/platforms/legacyInterface";
import { Pair } from "handle-sdk/dist/types/trade";
import { SendTransaction } from "../../hooks/useSendTransaction";
import { OrderType, orderTypeToTriggerThreshold } from "./orders";
import { bnToDisplayString } from "../format";
import { TranslationMap } from "src/types/translation";

type ExecuteTradeArgs = {
  t: TranslationMap;
  signer: Signer;
  collateralTokenExtended: TokenInfo;
  collateralDelta: BigNumber;
  indexDelta: BigNumber;
  isLong: boolean;
  platform: Trade;
  pair: Pair;
  sendTransaction: SendTransaction;
  orderType: OrderType;
  slippagePercent: number;
  hasOneClickTradingWallet: boolean;
  gasPrice?: BigNumber;
  triggerPrice?: BigNumber;
  callback?: (tX: ContractTransaction) => void;
};

const getExecuteTradeNotifications = (
  t: TranslationMap,
  orderType: OrderType,
  isLong: boolean,
  triggerPrice: BigNumber | undefined,
  hasOneClickTradingWallet: boolean,
) => {
  if (orderType !== OrderType.Market && !triggerPrice) {
    // This shouldn't happen as it is guarded against in executeTrade.
    throw new Error("Must provide trigger price for non-market orders");
  }

  return {
    awaitingApproval: !hasOneClickTradingWallet
      ? orderAwaitingApprovalMessage(t, orderType, isLong)
      : undefined,
    pending: orderPendingMessage(t, orderType, isLong),
    success: orderSuccessMessage(t, orderType, isLong, triggerPrice),
    error: orderErrorMessage(t, orderType, isLong),
  };
};

const orderAwaitingApprovalMessage = (
  t: TranslationMap,
  orderType: OrderType,
  isLong: boolean,
) => {
  if (orderType === OrderType.Market) {
    return isLong
      ? t.increaseLongPositionAwaitingApprovalToast
      : t.increaseShortPositionAwaitingApprovalToast;
  }

  return orderType === OrderType.Limit
    ? t.placeLimitOrderAwaitingApprovalToast
    : t.placeStopOrderAwaitingApprovalToast;
};

const orderPendingMessage = (
  t: TranslationMap,
  orderType: OrderType,
  isLong: boolean,
) => {
  if (orderType === OrderType.Market) {
    return isLong
      ? t.increaseLongPositionSuccessToast
      : t.increaseShortPositionSuccessToast;
  }

  return orderType === OrderType.Limit
    ? t.placeLimitOrderPendingToast
    : t.placeStopOrderPendingToast;
};

const orderSuccessMessage = (
  t: TranslationMap,
  orderType: OrderType,
  isLong: boolean,
  triggerPrice: BigNumber | undefined,
) => {
  if (orderType === OrderType.Market) {
    return isLong
      ? t.increaseLongPositionSuccessToast
      : t.increaseShortPositionSuccessToast;
  }

  const stopOrLimitSuccessMessageBase =
    orderType === OrderType.Limit
      ? t.placeLimitOrderPendingToast
      : t.placeStopOrderPendingToast;

  return `${stopOrLimitSuccessMessageBase} ${
    isLong ? t.buy : t.sell
  } @ ${bnToDisplayString(triggerPrice!, PRICE_DECIMALS, 0, 2)}`;
};

const orderErrorMessage = (
  t: TranslationMap,
  orderType: OrderType,
  isLong: boolean,
) => {
  if (orderType === OrderType.Market) {
    return isLong
      ? t.increaseLongPositionErrorToast
      : t.increaseShortPositionErrorToast;
  }

  return orderType === OrderType.Limit
    ? t.placeLimitOrderErrorToast
    : t.placeStopOrderErrorToast;
};

export const executeTrade = async (args: ExecuteTradeArgs) => {
  if (args.orderType === OrderType.Market && args.triggerPrice) {
    throw new Error("Trigger price is not supported for market orders");
  }
  if (args.orderType !== OrderType.Market && !args.triggerPrice) {
    throw new Error("Trigger price is required for limit orders");
  }

  await ensureIncreasePositionAllowance({
    signer: args.signer,
    collateralToken: args.collateralTokenExtended,
    collateralAmount: args.collateralDelta,
    pair: args.pair,
    platform: args.platform,
    sendTransaction: args.sendTransaction,
    orderType: args.orderType,
    maximise: true,
    gasPrice: args.gasPrice,
  });

  if (args.orderType === OrderType.Market) {
    await args.sendTransaction(
      () =>
        args.platform.increasePosition({
          collateralAddress: args.collateralTokenExtended.address,
          pair: args.pair,
          collateralDelta: args.collateralDelta,
          indexDelta: args.indexDelta,
          isLong: args.isLong,
          signer: args.signer,
          slippagePercent: args.slippagePercent,
          overrides: { gasPrice: args.gasPrice },
        }),
      getExecuteTradeNotifications(
        args.t,
        args.orderType,
        args.isLong,
        args.triggerPrice,
        args.hasOneClickTradingWallet,
      ),
      {
        callback: async tx => args.callback?.(tx),
        // Confirmation is skipped because the tx is potentially already
        // confirmed (e.g. when routing through GMX).
        shouldSkipWaitForConfirmation: true,
      },
    );
  } else {
    const shouldTriggerAboveThreshold = orderTypeToTriggerThreshold(
      args.isLong,
      args.orderType,
      true,
    );

    await args.sendTransaction(
      () => {
        return args.platform.createIncreasePositionOrder({
          collateralAddress: args.collateralTokenExtended.address,
          pair: args.pair,
          collateralDelta: args.collateralDelta,
          indexDelta: args.indexDelta,
          isLong: args.isLong,
          signer: args.signer,
          slippagePercent: args.slippagePercent,
          // Not null due to trigger price check above.
          triggerPrice: args.triggerPrice!,
          shouldTriggerAboveThreshold: shouldTriggerAboveThreshold,
          overrides: { gasPrice: args.gasPrice },
        });
      },
      getExecuteTradeNotifications(
        args.t,
        args.orderType,
        args.isLong,
        args.triggerPrice,
        args.hasOneClickTradingWallet,
      ),
      {
        callback: async tx => args.callback?.(tx),
        shouldSkipWaitForConfirmation: true,
      },
    );
  }
};

type EnsureIncreasePositionAllowanceArgs = {
  signer: Signer;
  collateralToken: TokenInfo;
  collateralAmount: BigNumber;
  pair: Pair;
  platform: Trade;
  sendTransaction: SendTransaction;
  orderType: OrderType;
  maximise: boolean;
  gasPrice?: BigNumber;
};

export const ensureIncreasePositionAllowance = async ({
  signer,
  collateralToken,
  collateralAmount,
  pair,
  platform,
  sendTransaction,
  orderType,
  maximise,
  gasPrice,
}: EnsureIncreasePositionAllowanceArgs) => {
  let approveTxs: PopulatedTransaction[];
  const approvalArgs = {
    collateralAddress: collateralToken.address,
    collateralDelta: collateralAmount,
    signer,
    pair,
    overrides: gasPrice ? { gasPrice } : undefined,
    maximise,
  };
  if (orderType === OrderType.Market) {
    approveTxs = await platform.approveIncreasePosition(approvalArgs);
  } else {
    approveTxs = await platform.approveCreateIncreasePositionOrder(
      approvalArgs,
    );
  }
  for (let approveTx of approveTxs) {
    await sendTransaction(
      () => signer.sendTransaction(approveTx),
      getAllowanceNotifications(collateralToken),
    );
  }
};
