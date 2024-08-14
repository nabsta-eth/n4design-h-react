import { BigNumber, ethers } from "ethers";
import { Network } from "handle-sdk";
import {
  PRICE_DECIMALS as GLP_PRICE_DECIMALS,
  PositionId,
} from "handle-sdk/dist/components/trade/platforms/legacyInterface";
import { hlp } from "handle-sdk/dist/components/trade/platforms";
import { Pair } from "handle-sdk/dist/types/trade";
import { isFxToken, replaceWrappedSymbolForNative } from "../general";
import {
  closeAllNotifications,
  showNotification,
} from "@handle-fi/react-components/dist/utils/notifications";
import { TranslationMap } from "../../types/translation";
import { isSamePair, pairToString } from "handle-sdk/dist/utils/general";
import { getUnderlyingFxSymbol } from "handle-sdk/dist/utils/fxToken";
import { TRADE_LP_DEFAULT_CURRENCY_SYMBOL } from "../../config/trade";
import {
  AMOUNT_DECIMALS,
  PRICE_DECIMALS,
} from "handle-sdk/dist/components/trade";
import { parseUnits } from "ethers/lib/utils";
import { bnToDisplayString } from "../format";
import { NETWORK_NAME_TO_LOGO_URL } from "@handle-fi/react-components";
import { networkNameToShow } from "@handle-fi/react-components/dist/utils/general";

export const USD_DISPLAY_DECIMALS = 2;
export const LOT_SIZE_MAX_DECIMALS = 6;
export const LOT_SIZE_LESS_THAN_ONE_DISPLAY_DECIMALS = 4;

/**
 *
 * @param price The price to format.
 * @param displayDecimals The exact number of decimals to display. Defaults to `USD_DISPLAY_DECIMALS`.
 * @param currency The currency to display as a suffix.
 * @param decimals The decimals of the BigNumber. Defaults to `PRICE_DISPLAY_DECIMALS`.
 */
export const formatPrice = (
  price: BigNumber,
  displayDecimals = USD_DISPLAY_DECIMALS,
  currency?: string,
  decimals = GLP_PRICE_DECIMALS,
) => {
  if (!price) return "";
  return `${bnToDisplayString(price, decimals, displayDecimals)}${
    currency ? " " + currency : ""
  }`;
};

export function expandDecimals(n: number, decimals: number) {
  return ethers.utils.parseUnits(n.toString(), decimals);
}

export const GLP_PRICE_UNIT = expandDecimals(1, GLP_PRICE_DECIMALS);

export const PRICE_UNIT = expandDecimals(1, PRICE_DECIMALS);

export const checkCorrectNetworkAndSendNotification = (
  t: TranslationMap,
  connectedNetwork: Network,
  activePath: string,
) => {
  if (
    connectedNetwork &&
    connectedNetwork !== "arbitrum-sepolia" &&
    connectedNetwork !== hlp.config.DEFAULT_HLP_NETWORK &&
    activePath === "/trade"
  ) {
    closeAllNotifications();
    const networkImageToShow = NETWORK_NAME_TO_LOGO_URL[connectedNetwork]
      ? `<img src="${NETWORK_NAME_TO_LOGO_URL[connectedNetwork]}"
            alt="${connectedNetwork}"
            width="20"
            class="uk-margin-xsmall-right"
          />`
      : `<i class="far fa-chart-network uk-margin-xsmall-right"></i>`;
    showNotification({
      status: "error",
      message: `${
        t.tradeUnavailableOn
      } ${networkImageToShow}${networkNameToShow(connectedNetwork)}`,
    });
  }
};

export const formatBorrowRateAsPercentage = (rate: number) =>
  `${((100 * rate) / hlp.config.FUNDING_RATE_PRECISION).toFixed(4)} % / 1h`;

export const formatPositivePrice = (
  price: BigNumber,
  decimals = 2,
  currency?: string,
) =>
  price.lte(0)
    ? formatPrice(ethers.constants.Zero, decimals, currency)
    : formatPrice(price, decimals, currency);

/**
 * Returns the opposing asset symbol and amount to the input symbol.
 * e.g. if passing USD as `primarySymbol` for the USD/JPY pair,
 * the function will treat JPY as the secondary asset.
 */
export const getPairSecondaryAsset = (
  primarySymbol: string,
  primaryAmount: BigNumber,
  pair: Pair,
  pairPrice: BigNumber,
) => {
  if (pair.baseSymbol !== primarySymbol && pair.quoteSymbol !== primarySymbol) {
    throw new Error(
      "getSecondaryTokenAmount: primary symbol not present in pair",
    );
  }
  const baseSymbol = replaceWrappedSymbolForNative(pair.baseSymbol);
  const isPrimaryBase = baseSymbol === primarySymbol;
  // Prevent division by zero error.
  if (pairPrice.isZero()) {
    console.warn("getSecondaryTokenAmount: prevent division by zero");
    pairPrice = ethers.constants.One;
  }
  const size = !isPrimaryBase
    ? primaryAmount.mul(GLP_PRICE_UNIT).div(pairPrice)
    : primaryAmount.mul(pairPrice).div(GLP_PRICE_UNIT);
  return {
    size,
    symbol: isPrimaryBase
      ? replaceWrappedSymbolForNative(pair.quoteSymbol)
      : baseSymbol,
  };
};

export const pairStringToPair = (pair: string) => {
  const symbols = pair.split("/");
  return {
    baseSymbol: symbols[0],
    quoteSymbol: symbols[1],
  };
};

// converts a chart tab id to a pair,
// e.g. ETH_USD_12 to
// { baseSymbol: "ETH", quoteSymbol: "USD"}.
// The suffix is simply a sequential
// number to differentiate between
// tabs for the same chart pair
// so may be ignored in this use-case.
export const pairIdToPair = (pairId: string) => {
  const symbols = pairId.split("_");
  return {
    baseSymbol: symbols[0],
    quoteSymbol: symbols[1],
  };
};

export const pairStringToNativePairString = (pair: string) => {
  const pairObject = pairStringToPair(pair);
  pairObject.baseSymbol = replaceWrappedSymbolForNative(pairObject.baseSymbol);
  return pairToString(pairObject);
};

export const isSamePositionId = (a: PositionId, b: PositionId): boolean =>
  isSamePair(a.pair, b.pair) &&
  a.isLong === b.isLong &&
  a.collateralAddress.toLowerCase() === b.collateralAddress.toLowerCase();

// TODO: may need moving to SDK?
export const getUnderlyingTradePair = (pair: Pair): Pair => {
  const underlyingBaseSymbol = isFxToken(pair.baseSymbol)
    ? getUnderlyingFxSymbol(pair.baseSymbol)
    : pair.baseSymbol;
  const underlyingQuoteSymbol = isFxToken(pair.quoteSymbol)
    ? getUnderlyingFxSymbol(pair.quoteSymbol)
    : pair.quoteSymbol;
  return {
    baseSymbol: underlyingBaseSymbol,
    quoteSymbol: underlyingQuoteSymbol,
  };
};

export const tickerSymbolFromPair = (pair: Pair): string =>
  (pair?.baseSymbol !== TRADE_LP_DEFAULT_CURRENCY_SYMBOL &&
    pair?.quoteSymbol !== TRADE_LP_DEFAULT_CURRENCY_SYMBOL) ||
  pair?.quoteSymbol === TRADE_LP_DEFAULT_CURRENCY_SYMBOL
    ? pair?.baseSymbol
    : pair?.quoteSymbol;

export const getInputString = (
  bn: BigNumber,
  isLpc: boolean,
  lotsDisplayDecimals: number,
): string => {
  const decimals = isLpc ? USD_DISPLAY_DECIMALS : lotsDisplayDecimals;
  if (bn.lt(parseUnits("1", AMOUNT_DECIMALS - decimals)) && !bn.isZero()) {
    // If the input would show zero, but isn't actually zero, don't limit the decimals.
    return bnToDisplayString(
      bn,
      AMOUNT_DECIMALS,
      USD_DISPLAY_DECIMALS,
      AMOUNT_DECIMALS,
    );
  }
  return bnToDisplayString(bn, AMOUNT_DECIMALS, USD_DISPLAY_DECIMALS, decimals);
};

export const isSamePairEvenIfReversed = (a: Pair, b: Pair): boolean =>
  isSamePair(a, b) ||
  (a.baseSymbol === b.quoteSymbol && a.quoteSymbol === b.baseSymbol);
