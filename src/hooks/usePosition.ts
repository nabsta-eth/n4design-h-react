import { useTrade } from "../context/Trade";
import { USD_DISPLAY_DECIMALS, PRICE_UNIT } from "../utils/trade";
import { ethers } from "ethers";
import {
  bnToDisplayString,
  getPositionFundingFeeDisplay,
} from "../utils/format";
import { LEVERAGE_DISPLAY_DECIMALS } from "../config/constants";
import { trade } from "handle-sdk";
import { Position } from "handle-sdk/dist/components/trade/position";
import { useTradePrices } from "../context/TradePrices";
import {
  MarketPrice,
  TradeLiquidityPool,
} from "handle-sdk/dist/components/trade";
import { parseAmount } from "handle-sdk/dist/components/trade/reader";
import { useMemo } from "react";
import { useInstrumentOrThrow } from "./trade/useInstrumentOrThrow";
import { pairToString } from "handle-sdk/dist/utils/general";

export const usePosition = (position: Position) => {
  const { account: tradeAccount, protocol } = useTrade();
  const { getPrice } = useTradePrices();
  if (!tradeAccount) {
    throw new Error("tradeAccount must be set");
  }
  const lp: TradeLiquidityPool | undefined = useMemo(
    () =>
      protocol.getLiquidityPools().find(lp => lp.id === position.pairId.lpId),
    [position, protocol.getLiquidityPools()],
  );
  if (!lp) {
    throw new Error(
      `liquidity pool not found for position ${position.pairId.pair}/${position.pairId.lpId}`,
    );
  }
  const pairState = lp.getPairState(position.pairId.pair);
  const marketPrice = getPrice(position.pairId.pair) ?? MarketPrice.zero();
  const sideFactor = position.isLong ? "1" : "-1";
  const instrument = useInstrumentOrThrow(pairToString(position.pairId.pair));
  const accruedFundingFee = position.calculateAccruedFundingFee(
    pairState,
    marketPrice.index,
  );
  const accruedBorrowFee = position.calculateAccruedBorrowFee(
    pairState,
    marketPrice.index,
  );
  const totalPositionFees = accruedFundingFee.add(accruedBorrowFee);
  const totalPositionFeesDisplay =
    getPositionFundingFeeDisplay(totalPositionFees);

  const sizeInUsd = position.size.mul(position.entryPrice).div(PRICE_UNIT);

  const sizeInUsdDisplay = bnToDisplayString(
    sizeInUsd,
    trade.AMOUNT_DECIMALS,
    USD_DISPLAY_DECIMALS,
  );

  const markPrice = marketPrice.getTradePrice(!position.isLong);
  const pairPriceDecimals = instrument.getDisplayDecimals(markPrice);
  const markPriceDisplay = bnToDisplayString(
    markPrice,
    trade.PRICE_DECIMALS,
    pairPriceDecimals,
  );

  const equity = tradeAccount?.getEquity() ?? ethers.constants.Zero;
  const leverage = equity.gt(0)
    ? position.size.mul(markPrice).mul(sideFactor).div(equity)
    : ethers.constants.Zero;
  const leverageDisplay = bnToDisplayString(
    leverage,
    trade.AMOUNT_DECIMALS,
    LEVERAGE_DISPLAY_DECIMALS,
  );

  const entryPriceDisplay = bnToDisplayString(
    position.entryPrice,
    trade.PRICE_DECIMALS,
    pairPriceDecimals,
  );
  const tradePair = protocol.getTradePair(position.pairId);
  const initialMargin = tradePair.getInitialMargin(
    position.size,
    marketPrice.index,
  );
  const initialMarginDisplay = bnToDisplayString(
    initialMargin ?? ethers.constants.Zero,
    trade.AMOUNT_DECIMALS,
    USD_DISPLAY_DECIMALS,
  );

  const pnl = position.calculateFullUnrealizedEquityToBeRealized();
  const pnlDisplay = bnToDisplayString(
    pnl,
    trade.AMOUNT_DECIMALS,
    USD_DISPLAY_DECIMALS,
  );
  const pnlPercent = initialMargin.isZero()
    ? ethers.constants.Zero
    : pnl.mul(parseAmount("100")).div(initialMargin);
  const pnlPercentDisplay = bnToDisplayString(
    pnlPercent,
    trade.AMOUNT_DECIMALS,
    USD_DISPLAY_DECIMALS,
  );

  return {
    sizeInUsd,
    sizeInUsdDisplay,
    markPrice,
    markPriceDisplay,
    leverageDisplay,
    entryPriceDisplay,
    initialMargin,
    initialMarginDisplay,
    pnl,
    pnlDisplay,
    pnlPercent,
    pnlPercentDisplay,
    totalPositionFees,
    totalPositionFeesDisplay,
    accruedFundingFee,
    accruedBorrowFee,
    pairState,
    marketPrice,
  };
};
