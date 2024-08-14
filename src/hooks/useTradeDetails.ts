import { useUserWalletStore } from "@handle-fi/react-components/dist/context/UserWallet";
import { getExplorerMetadata } from "../utils/general";
import { useMediaQueries } from "./useMediaQueries";
import { useLanguageStore } from "../context/Translation";
import {
  AMOUNT_DECIMALS,
  PRICE_DECIMALS,
  TradeAction,
} from "handle-sdk/dist/components/trade";
import { bnToDisplayString } from "../utils/format";
import { PRICE_UNIT, USD_DISPLAY_DECIMALS, formatPrice } from "../utils/trade";
import { Network } from "handle-sdk/dist";
import { useInstrumentOrThrow } from "./trade/useInstrumentOrThrow";
import { pairToString } from "handle-sdk/dist/utils/general";

export const useTradeDetails = (trade: TradeAction, showSizeInUsd: boolean) => {
  const { connection } = useUserWalletStore();
  const maxTablet = useMediaQueries().maxTablet;
  const { t } = useLanguageStore();

  const { timestamp } = trade;
  const isLiquidation = trade.isLiquidation();
  const isLong = trade.size.gt(0);
  const isLongDisplay = isLong ? t.buy : t.sell;
  const pnl = trade.realisedEquity;
  const displayAmount = showSizeInUsd
    ? trade.size.mul(trade.price).div(PRICE_UNIT)
    : trade.size;

  const instrument = useInstrumentOrThrow(pairToString(trade.pairId.pair));
  const priceToDisplay = formatPrice(
    trade.price,
    instrument.getDisplayDecimals(trade.price),
    "",
    PRICE_DECIMALS,
  );
  const isPositive = pnl.gt(0);
  const isNegative = pnl.lt(0);
  const pnlSign = () => {
    if (isPositive) return "+";
    if (isNegative) return "-";
    return "";
  };

  const pnlToDisplay = `${pnlSign()}${bnToDisplayString(
    pnl.abs(),
    AMOUNT_DECIMALS,
    USD_DISPLAY_DECIMALS,
  )}`;
  const tradeTxHash = trade.txHash;
  const network: Network | null =
    connection.chain.isConnected && connection.chain.isSupportedNetwork
      ? connection.chain.network
      : null;
  const explorerMetadata = network
    ? getExplorerMetadata(tradeTxHash, "tx", network)
    : null;

  return {
    network,
    maxTablet,
    isLong,
    displayAmount,
    priceToDisplay,
    isLiquidation,
    isPositive,
    isNegative,
    pnlToDisplay,
    timestamp,
    isLongDisplay,
    explorerMetadata,
    pair: trade.pairId.pair,
  };
};
