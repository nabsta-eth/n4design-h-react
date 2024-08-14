import {
  SimulateTradeArgs,
  TradeAccount,
  TradePair,
  TradeProtocol,
  TradeSizeType,
} from "handle-sdk/dist/components/trade";
import { BigNumber } from "ethers";
import {
  AMOUNT_UNIT,
  parseAmount,
} from "handle-sdk/dist/components/trade/reader";
import { PRICE_UNIT } from "./index";

export const calculateApeMaxPositionSize = (
  account: TradeAccount,
  tradePair: TradePair,
  protocol: TradeProtocol,
  inputType: TradeSizeType,
  defaultEntryPrice: BigNumber,
  tradeGasFee: BigNumber,
  isLong: boolean,
) => {
  // The last attempt of calculating the value analytically
  // can be seen here: https://www.desmos.com/calculator/wn9kiuceo5
  const one = AMOUNT_UNIT;
  const L = one.mul(one).div(tradePair.initialMarginFraction);
  const openPosition = account.getPosition(tradePair.id);
  // Use the account with a simulated closed position to calculate
  // the ideal position size before starting iterations.
  const currentAccountWithClosedPosition = account.simulateTrade({
    pairId: tradePair.id,
    gasFee: tradeGasFee,
    size: openPosition.size.mul(-1),
  }).nextAccount;
  const availableEquityClosedPosition =
    currentAccountWithClosedPosition.getAvailableEquity();
  const idealTradeSizeLpc = isLong
    ? L.mul(availableEquityClosedPosition).div(one)
    : L.mul(availableEquityClosedPosition).div(one).mul(-1);
  const idealTradeSizeLots =
    openPosition.size.isZero() || isLong === openPosition.isLong
      ? idealTradeSizeLpc.mul(PRICE_UNIT).div(defaultEntryPrice)
      : idealTradeSizeLpc
          .mul(PRICE_UNIT)
          .div(defaultEntryPrice)
          .sub(openPosition.size);
  let hasEnoughEquity = false;
  let degenSizeLots = idealTradeSizeLots;
  let degenEntryPrice = protocol.getPrice(tradePair.id, degenSizeLots);
  for (let i = 1; i < 99; i++) {
    // Iterate 1% at a time.
    const iterationFraction = one.sub(parseAmount(String(i)).div(100));
    degenSizeLots = idealTradeSizeLots.mul(iterationFraction).div(one);
    degenEntryPrice = protocol.getPrice(tradePair.id, degenSizeLots);
    const simulationArgs: SimulateTradeArgs = {
      pairId: tradePair.id,
      gasFee: tradeGasFee,
      size: degenSizeLots,
    };
    const simulatedAccount = account.simulateTrade(simulationArgs);
    hasEnoughEquity = simulatedAccount.nextAccount.getAvailableEquity().gt(0);
    if (hasEnoughEquity) {
      break;
    }
  }
  const degenSizeLotsUnsigned = degenSizeLots.abs();
  if (inputType === "Lot") {
    return degenSizeLotsUnsigned;
  }
  // Return as LPC.
  const tradePrice = degenEntryPrice.getTradePrice(isLong);
  return degenSizeLotsUnsigned.mul(tradePrice).div(PRICE_UNIT);
};
