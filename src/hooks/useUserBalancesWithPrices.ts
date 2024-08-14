import { fetchTokenPriceUsd, Network } from "handle-sdk";
import { useUserBalanceStore } from "../context/UserBalances";
import * as sdk from "handle-sdk";
import usePromise from "@handle-fi/react-components/dist/hooks/usePromise";
import { getIsHandleToken, transformDecimals } from "../utils/general";
import { expandDecimals, PRICE_UNIT } from "../utils/trade";
import { TokenWithBalance, TokenWithBalanceAndPrice } from "../types/tokenInfo";
import { useNetworkOrDefault } from "./useNetworkOrDefault";
import { getFxTokenPriceUsdH2so } from "../utils/oracle";
import { PRICE_DECIMALS } from "handle-sdk/dist/components/trade";
import { useEffect, useMemo, useState } from "react";

type Props = {
  network: Network;
};

type UseWalletAssetsReturnValue = {
  tokens: TokenWithBalanceAndPrice[];
  currency: string;
  setCurrency: (currency: string) => void;
  refreshBalance: () => Promise<void>;
  isLoading: boolean;
  isLoadingPrices: boolean;
};

// Group fetch tokens are those that are all fetched from
// a single call to the Coingecko API call method.
// This excludes any "handle" tokens which have their own H2SO price method.
const isGroupFetchToken = (token: TokenWithBalance) =>
  !token.extensions?.isHlpToken &&
  !token.extensions?.isNative &&
  !token.extensions?.isLiquidityToken;

export const useUserBalancesWithPrices = ({
  network: inputNetwork,
}: Props): UseWalletAssetsReturnValue => {
  const network = useNetworkOrDefault(inputNetwork);
  const { balances, isLoadingBalances, refreshBalance, currency, setCurrency } =
    useUserBalanceStore();
  const isLoading = isLoadingBalances[network];
  const tokensWithBalance = balances[network];

  const tokensWithBalanceForGroupPriceFetch = useMemo(
    () =>
      tokensWithBalance.filter(t => isGroupFetchToken(t) && t.balance?.gt(0)),
    [tokensWithBalance],
  );

  const contractList = useMemo(
    () => tokensWithBalanceForGroupPriceFetch.map(token => token.address),
    [tokensWithBalanceForGroupPriceFetch],
  );

  const getPrices = async (contractList: string[]) => {
    try {
      const prices =
        contractList.length > 0
          ? await sdk.prices.coingecko.fetchCoinGeckoTokenPricesData(
              network,
              contractList,
            )
          : {};
      return prices;
    } catch (e) {
      console.error("Error fetching price for", contractList, e);
      return;
    }
  };

  const [prices, , isLoadingGroupPrices] = usePromise(
    () => getPrices(contractList),
    [tokensWithBalanceForGroupPriceFetch],
  );

  /// Price is always in USD, and is adjusted for the currency later. Prices are returned to 18 decimals
  const appendPrice = async (
    token: TokenWithBalance,
  ): Promise<TokenWithBalanceAndPrice> => {
    try {
      const isHandleToken = getIsHandleToken(token);
      if (isHandleToken) {
        const price = await fetchTokenPriceUsd(token.symbol, token);
        if (!price) {
          throw new Error(`no price for ${token.symbol}`);
        }
        return {
          ...token,
          price: transformDecimals(price, PRICE_DECIMALS, 18),
        };
      } else {
        return {
          ...token,
          price: expandDecimals(
            prices?.[token.address.toLowerCase()]?.usd || 0,
            18,
          ),
        };
      }
    } catch (e) {
      console.error("Error fetching price for", token, e);
      return {
        ...token,
        price: expandDecimals(
          prices?.[token.address.toLowerCase()]?.usd || 0,
          18,
        ),
      };
    }
  };

  const [tokensWithBalanceAndPrice, , isLoadingPrice] = usePromise(
    () => Promise.all(tokensWithBalance.map(appendPrice)),
    [tokensWithBalance, prices],
  );

  const [tokensForCurrencyConversion, setTokensForCurrencyConversion] =
    useState<TokenWithBalanceAndPrice[]>();
  useEffect(() => {
    const numberOfGroupFetchTokens =
      tokensWithBalanceAndPrice?.filter(t => isGroupFetchToken(t))?.length ?? 0;
    const arePricesForGroupFetchTokensReady =
      numberOfGroupFetchTokens === 0 ||
      tokensWithBalanceAndPrice?.some(
        t => isGroupFetchToken(t) && t.price?.gt(0),
      );
    const areTokensWithPricesReadyToShow =
      tokensWithBalanceAndPrice &&
      tokensWithBalanceAndPrice?.length > 0 &&
      arePricesForGroupFetchTokensReady;
    if (areTokensWithPricesReadyToShow) {
      setTokensForCurrencyConversion(tokensWithBalanceAndPrice);
    }
  }, [tokensWithBalanceAndPrice]);

  const tokensAdjustedForSelectedCurrency = useMemo(
    () =>
      tokensForCurrencyConversion?.map(t => {
        const selectedCurrencyPrice = getFxTokenPriceUsdH2so(currency);
        return {
          ...t,
          price: t.price?.mul(PRICE_UNIT).div(selectedCurrencyPrice),
        };
      }),
    [tokensForCurrencyConversion, currency],
  );

  const value = useMemo(() => {
    return {
      currency,
      setCurrency,
      refreshBalance,
      tokens: tokensAdjustedForSelectedCurrency || [],
      isLoading: !tokensForCurrencyConversion || isLoading,
      isLoadingPrices: isLoadingPrice || isLoadingGroupPrices,
    };
  }, [
    currency,
    tokensAdjustedForSelectedCurrency,
    isLoading,
    isLoadingPrice,
    isLoadingGroupPrices,
  ]);
  return value;
};
