import { HandleTokenManagerInstance } from "handle-sdk/dist/components/token-manager/HandleTokenManager";
import * as sdk from "handle-sdk";
import {
  Trade,
  PRICE_DECIMALS,
} from "handle-sdk/dist/components/trade/platforms/legacyInterface";
import { pairFromString } from "handle-sdk/dist/utils/general";
import { formatUnits } from "ethers/lib/utils";
import { HandleApiCallArgs } from "./index";
import { isEtherAddress } from "handle-sdk/dist/components/trade/utils";

export const fetchAssetPrice = async ({
  request: {
    args: [assetSymbol, quoteCurrency],
  },
  platform,
}: HandleApiCallArgs): Promise<string> => {
  try {
    const price = await fetchPriceRouter(assetSymbol, quoteCurrency, platform);
    return `${price} ${quoteCurrency}`;
  } catch (_) {
    return `no ${quoteCurrency} price found for ${assetSymbol}`;
  }
};

const fetchPriceRouter = async (
  assetSymbol: string,
  quoteCurrency: string,
  platform: Trade,
): Promise<number> => {
  const fetchers = [
    () => fetchPriceInternal(assetSymbol, quoteCurrency, platform),
    () => {
      const tokenAddress = getTokenSymbolByAddress(assetSymbol);
      return fetchPriceExternal(tokenAddress, quoteCurrency);
    },
  ];
  for (let fetcher of fetchers) {
    try {
      return await fetcher();
    } catch (e) {
      console.error(e);
    }
  }
  throw new Error();
};

const fetchPriceInternal = (
  assetSymbol: string,
  quoteCurrency: string,
  platform: Trade,
): Promise<number> => {
  if (quoteCurrency.toLowerCase() !== "usd") {
    throw new Error("Only USD quotes are supported");
  }
  return Promise.resolve(
    +formatUnits(
      platform.getPrice({
        pair: pairFromString(`${assetSymbol}/USD`),
      }).index,
      PRICE_DECIMALS,
    ),
  );
};

const fetchPriceExternal = (
  address: string,
  quoteCurrency: string,
): Promise<number> =>
  !isEtherAddress(address)
    ? sdk.prices.coingecko
        .fetchCoinGeckoTokenPriceData("ethereum", address, quoteCurrency, 1)
        .then(prices => prices[0].price)
    : sdk.prices.coingecko
        .fetchCoinGeckoNativeTokenPriceData("ethereum", quoteCurrency, 1)
        .then(prices => prices[0].price);

const getTokenSymbolByAddress = (symbol: string): string => {
  try {
    return HandleTokenManagerInstance.getTokenBySymbol(symbol, "ethereum")
      .address;
  } catch (_) {
    // Try using uppercase symbol.
    return HandleTokenManagerInstance.getTokenBySymbol(
      symbol.toUpperCase(),
      "ethereum",
    ).address;
  }
};
