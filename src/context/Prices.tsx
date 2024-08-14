import * as React from "react";
import * as sdk from "handle-sdk";
import { NetworkMap, Network, FxTokenSymbol } from "handle-sdk";
import { useToken } from "./TokenManager";
import { BigNumber } from "ethers";
import { useEffect, useState } from "react";
import { fetchBalancerLpTokenPrice } from "handle-sdk/dist/components/prices/sources/balancer";
import { BALANCER_FXUSD_FOREX_POOL_ID } from "handle-sdk/dist/config";
import { retryNetworkRequest } from "../utils/retry-network-request";
import {
  getUsdQuotedPair,
  pairsToStringCsv,
} from "handle-sdk/dist/utils/general";
import { stripFx } from "../utils/general";
import { useFocus } from "./Focus";
import { usePriceFeed } from "./PriceFeed";

export type FxTokenPriceMap = Record<
  FxTokenSymbol,
  { bn: BigNumber; number: number }
>;

export type TokenPriceMap = { [symbol: string]: number | undefined };

export type PricesValue = {
  nativeUsdPrices: NetworkMap<number> | undefined;
  tokenUsdPrices: TokenPriceMap;
  fxTokensUsdChainlink: FxTokenPriceMap | undefined; // currency only setup for ethereum
  fetchTokenUsdPrice: (token: {
    symbol: string;
    address: string;
  }) => Promise<void>;
  fetchNativeTokenPrices: () => Promise<void>;
  fetchFxTokensUsd: () => Promise<void>;
  isPriceClientLive: boolean;
};

const PricesContext = React.createContext<PricesValue | null>(null);

export const PricesProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { isFocused } = useFocus();
  const [nativeUsdPrices, setNativeUsdPrices] =
    React.useState<NetworkMap<number>>();
  const [tokenUsdPrices, setTokenUsdPrices] = React.useState<TokenPriceMap>({});
  const [fxTokensUsdChainlink, setFxTokensUsdChainlink] =
    React.useState<FxTokenPriceMap>();
  const [isPriceClientLive, setIsPriceClientLive] = useState(false);
  const { priceFeed } = usePriceFeed();
  useEffect(() => {
    // Fetch & set balancer price on load.
    fetchBalancerLpTokenPrice(BALANCER_FXUSD_FOREX_POOL_ID).then(price =>
      setTokenUsdPrices(previous => ({
        ...previous,
        [sdk.config.lp.arbitrum.balancerFxUsdForex.lpToken.symbol]: price,
      })),
    );
  }, []);

  useEffect(() => {
    if (!isFocused) {
      // If the app is unfocused, no subscriptions should be live.
      setIsPriceClientLive(false);
      return;
    }
    // Subscribe to all fxToken prices via H2SO.
    // This is not currently reactive.
    // To use these prices, call the global function `getFxTokenPriceUsdH2so`.
    const fxTokenPricePairs = sdk.config.fxTokenSymbols
      .map(symbol => getUsdQuotedPair(stripFx(symbol)))
      .filter(p => p.baseSymbol !== p.quoteSymbol);
    console.debug(
      `[Prices] subscribing to h2so: ${pairsToStringCsv(fxTokenPricePairs)}`,
    );
    const subscriptionId = priceFeed.subscribe(fxTokenPricePairs, () => {});
    setIsPriceClientLive(true);
    return () => {
      console.debug("[Prices] unsubscribing from h2so");
      if (isPriceClientLive) {
        try {
          priceFeed.unsubscribe(subscriptionId);
        } catch (e) {
          console.error(e);
        }
      }
      setIsPriceClientLive(false);
    };
  }, [isFocused]);

  const fetchFxTokensUsd = React.useCallback(async () => {
    const newPrices = await sdk.prices.fetchFxTokenTargetChainlinkUsdPrices();
    setFxTokensUsdChainlink(newPrices);
  }, []);

  const fetchNativeTokenPrices = React.useCallback(async () => {
    const prices = await sdk.prices.coingecko.fetchNativeUsdPrices();
    setNativeUsdPrices(prices);
  }, []);

  const fetchTokenUsdPrice = React.useCallback(
    async (token: { symbol: string; address: string }) => {
      // currently only need for forex price so hardcoding ethereum
      const price = await retryNetworkRequest(() =>
        sdk.prices.coingecko.fetchTokenPrice(token.address, "ethereum"),
      );
      setTokenUsdPrices(previous => ({ ...previous, [token.symbol]: price }));
    },
    [],
  );

  const value = React.useMemo(
    () => ({
      nativeUsdPrices,
      fxTokensUsdChainlink,
      tokenUsdPrices,
      fetchNativeTokenPrices,
      fetchTokenUsdPrice,
      fetchFxTokensUsd,
      isPriceClientLive,
    }),
    [
      nativeUsdPrices,
      fxTokensUsdChainlink,
      tokenUsdPrices,
      fetchTokenUsdPrice,
      fetchNativeTokenPrices,
      fetchFxTokensUsd,
      isPriceClientLive,
    ],
  );

  return (
    <PricesContext.Provider value={value}>{children}</PricesContext.Provider>
  );
};

export const usePricesStore = () => {
  const context = React.useContext(PricesContext);
  if (!context) {
    throw new Error("usePrices must be used within a PricesProvider");
  }
  return context;
};

export const useFxTokensUsdPrice = ({
  fetch,
}: {
  fetch: boolean;
}): FxTokenPriceMap | undefined => {
  const { fetchFxTokensUsd, fxTokensUsdChainlink } = usePricesStore();

  React.useEffect(() => {
    if (fetch) {
      fetchFxTokensUsd();
    }
  }, [fetch, fetchFxTokensUsd]);

  return fxTokensUsdChainlink;
};

export const useNativeTokenPrice = (network: Network): number | undefined => {
  const { nativeUsdPrices } = usePricesStore();
  return nativeUsdPrices?.[network];
};

// currently setup for ethereum only. Can be easily extended to be like balances in user balance store
export const useTokenUsdPrice = ({
  tokenSymbol,
  fetch,
}: {
  tokenSymbol: string | undefined;
  fetch: boolean;
}): number | undefined => {
  const token = useToken(tokenSymbol, "ethereum");
  const { fetchTokenUsdPrice, tokenUsdPrices } = usePricesStore();

  React.useEffect(() => {
    if (fetch && token) {
      fetchTokenUsdPrice(token);
    }
  }, [token, fetch, fetchTokenUsdPrice]);

  return tokenSymbol ? tokenUsdPrices[tokenSymbol] : undefined;
};
