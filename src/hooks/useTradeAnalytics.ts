import { Pair } from "handle-sdk/dist/types/trade";
import { BigNumber } from "ethers";
import {
  AnalyticsPurchaseItem,
  getAnalyticsPurchaseId,
  sendAnalyticsBeginCheckoutEvent,
  sendAnalyticsPurchaseEvent,
} from "../utils/analytics";
import { useMemo } from "react";
import { formatUnits } from "ethers/lib/utils";

export type TradeAnalyticsHook = {
  sendBeginCheckoutEvent: () => void;
  sendPurchaseEvent: () => void;
};

export const useTradeAnalytics = (
  isIncreasingPosition: boolean,
  isLong: boolean,
  pair: Pair,
  collateralAmount: BigNumber,
  collateralSymbol: string,
  collateralDecimals: number,
): TradeAnalyticsHook => {
  const analyticsPurchaseItem: AnalyticsPurchaseItem = useMemo(
    () => ({
      item_name: getAnalyticsPurchaseId(
        getPurchaseId(isIncreasingPosition, isLong),
        [pair.baseSymbol, pair.quoteSymbol],
      ),
      price: +formatUnits(collateralAmount, collateralDecimals),
    }),
    [isIncreasingPosition, isLong, pair, collateralAmount, collateralSymbol],
  );
  return {
    sendBeginCheckoutEvent: () =>
      sendAnalyticsBeginCheckoutEvent(
        analyticsPurchaseItem.price!,
        collateralSymbol,
        analyticsPurchaseItem,
      ),
    sendPurchaseEvent: () =>
      sendAnalyticsPurchaseEvent(
        analyticsPurchaseItem.price!,
        collateralSymbol,
        analyticsPurchaseItem,
      ),
  };
};

const getPurchaseId = (
  isIncreasingPosition: boolean,
  isLong: boolean,
): string =>
  `trade-${isIncreasingPosition ? "increase" : "decrease"}-${
    isLong ? "long" : "short"
  }`;
