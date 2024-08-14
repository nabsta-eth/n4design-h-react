import { Availability } from "handle-sdk/dist/components/trade";
import { ViewOnlyInstrument } from "../config/viewOnlyInstruments";
import { useTrade } from "../context/Trade";
import { isViewOnlyMarketAvailable } from "../utils/trade/viewOnlyTradingHours";
import { pairToString } from "handle-sdk/dist/utils/general";
import { TradePairOrViewOnlyInstrument } from "../types/trade";

export const useMarketAvailability = (
  market: TradePairOrViewOnlyInstrument,
): Availability => {
  const { protocol, pairs } = useTrade();
  const isViewOnly = ViewOnlyInstrument.isViewOnlyInstrument(market);
  if (isViewOnly) {
    return {
      isAvailable: isViewOnlyMarketAvailable(market),
    };
  }
  const tradePair = pairs.find(tradePair => tradePair.pair === market.pair);
  if (!tradePair) {
    const message = `trade pair ${pairToString(market.pair)} not found`;
    console.warn(message);
    return {
      isAvailable: false,
      reason: message,
    };
  }
  const tradePairLp = protocol.getLiquidityPool(tradePair.id.lpId);
  return tradePairLp?.getPairAvailability({
    pair: market.pair,
  });
};
