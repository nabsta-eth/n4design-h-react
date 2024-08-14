import { PricePoint, Network, prices, TokenInfo, utils } from "handle-sdk";
import { getFiatPriceData } from "../fiat-data";
import { isFxToken } from "../general";
import {
  PriceProviders,
  TokenPairPriceData,
} from "../../context/PriceChartData";

const sortPricePoint = (a: PricePoint, b: PricePoint) =>
  a.date > b.date ? 1 : -1;

const closestPrice = (array: PricePoint[], goal: PricePoint) => {
  return array.reduce((prev: PricePoint, curr: PricePoint) => {
    return Math.abs(curr.date - goal.date) < Math.abs(prev.date - goal.date)
      ? curr
      : prev;
  });
};

export const getTokenPriceData = async (
  token: TokenInfo,
  network: Network,
  period: number,
): Promise<{
  data: PricePoint[];
  provider: PriceProviders;
}> => {
  if (token.extensions?.isNative) {
    return {
      data: await prices.coingecko.fetchCoinGeckoNativeTokenPriceData(
        network,
        "usd",
        period,
      ),
      provider: "coingecko",
    };
  }
  if (isFxToken(token.symbol)) {
    const data = await getFiatPriceData(
      utils.fxToken.getUnderlyingFxSymbol(token.symbol),
      "usd",
      period,
    );
    if (!data)
      throw new Error(
        `Could not fetch fiat price data for token ${token.symbol} (${token.address})`,
      );
    return {
      data,
      provider: "twelvedata",
    };
  }
  if (token.extensions?.isLiquidityToken) {
    // getHistoricHlpData accepts seconds, not ms
    const now = Math.floor(Date.now() / 1000);
    // currently there is only data for the daily graph, so the period is ignored here
    // so that a graph will always appear
    const raw = await utils.hlp.getHistoricHlpData(0, now, network);
    const pricePoint: PricePoint[] = raw.map(d => ({
      date: d.timestamp * 1000, // convert seconds to ms
      price: d.hlpPrice,
    }));
    return {
      data: pricePoint,
      provider: "handle",
    };
  }
  return {
    data: await prices.coingecko.fetchCoinGeckoTokenPriceData(
      network,
      token.address,
      "usd",
      period,
    ),
    provider: "coingecko",
  };
};

export const getPriceDataOverTime = async (
  fromToken: TokenInfo,
  toToken: TokenInfo,
  network: Network,
  period: number,
): Promise<TokenPairPriceData> => {
  // If totoken is fxUSD we can ignore mapping as the data being returned is already vs. USD;
  // If fromToken is fxUSD then simply use the toToken data and invert the price.

  const [fromTokenPriceData, toTokenPriceData] = await Promise.all([
    getTokenPriceData(
      fromToken.symbol === "fxUSD" ? toToken : fromToken,
      network,
      period,
    ),
    fromToken.symbol === "fxUSD" || toToken.symbol === "fxUSD"
      ? { data: [], provider: undefined }
      : getTokenPriceData(toToken, network, period),
  ]);

  fromTokenPriceData.data.sort(sortPricePoint);
  toTokenPriceData.data.sort(sortPricePoint);

  let data: PricePoint[];
  if (toToken.symbol === "fxUSD") {
    // since fromToken is quoted in USD, if toToken is fxUSD just return from token prices
    data = fromTokenPriceData.data;
  } else if (fromToken.symbol === "fxUSD") {
    // since toToken is quoted in USD, if fromToken is fxUSD just return the reciprocal
    // of from token prices
    data = fromTokenPriceData.data.map(fromPriceData => ({
      date: fromPriceData.date,
      price: 1 / fromPriceData.price,
    }));
  } else {
    data = toTokenPriceData.data.map(toPriceData => {
      // gets the fromToken price with the closest timestamp to the toToken price
      const closestMatch = fromTokenPriceData.data.find(
        fromPriceData =>
          fromPriceData === closestPrice(fromTokenPriceData.data, toPriceData),
      );

      if (!closestMatch) {
        throw Error("No match found");
      }
      return {
        date: toPriceData.date,
        // closestMatch quoted against the toToken price
        price: closestMatch?.price / toPriceData.price,
      };
    });
  }

  const providers = [fromTokenPriceData.provider];
  if (toTokenPriceData.provider) {
    providers.push(toTokenPriceData.provider);
  }

  return {
    data,
    providers,
  };
};
