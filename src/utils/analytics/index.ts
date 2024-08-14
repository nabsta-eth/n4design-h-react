import { Position } from "handle-sdk/dist/components/trade/position";
import { pairToString } from "handle-sdk/dist/utils/general";

export type TagProperties = Record<string, string | number | boolean | object>;

export type AnalyticsPurchaseItem = {
  item_name: string;
  price?: number;
  discount?: number;
  item_brand?: string;
  item_category?: string;
};

export const sendAnalyticsEvent = (
  eventName: string,
  eventParameters?: TagProperties,
) => {
  try {
    // @ts-ignore
    const gtag = window.gtag;
    if (!gtag) {
      throw new Error("No gtag window component found");
    }
    gtag("event", eventName, eventParameters);
  } catch (error) {
    console.error(error);
  }
};

export const sendAnalyticsBeginCheckoutEvent = (
  value: number,
  currency: string,
  item: AnalyticsPurchaseItem,
) =>
  sendAnalyticsEvent("begin_checkout", {
    value,
    currency,
    items: [item],
  });

export const sendAnalyticsPurchaseEvent = (
  value: number,
  currency: string,
  item: AnalyticsPurchaseItem,
) =>
  sendAnalyticsEvent("purchase", {
    value,
    currency,
    items: [item],
  });

export const getAnalyticsPositionId = (position: Position): string =>
  `${position.pairId.lpId}-${pairToString(position.pairId.pair)}`;

export const getAnalyticsPurchaseId = (
  category: string,
  symbols: string[],
): string => `${category}-${symbols.join("-")}`;
