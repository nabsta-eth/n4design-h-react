import { BigNumber, ethers } from "ethers";
import { Network, prices } from "handle-sdk";
import React from "react";
import {
  CHAINLINK_PRICE_DECIMALS,
  NUMBER_PRICE_DECIMALS,
} from "../config/constants";
import { useNativeTokenPrice } from "../context/Prices";
import { useBalances } from "../context/UserBalances";
import { useConnectedNetwork } from "@handle-fi/react-components/dist/context/UserWallet";
import { TokenWithOptionalPrice } from "../types/tokenInfo";

type Props = {
  token: TokenWithOptionalPrice;
  isNonProtocolToken?: boolean;
  selectedCurrency: string;
  selectedCurrencyUSDPrice: { bn: BigNumber; number: number } | undefined;
};

const DEFAULT_NETWORK = "arbitrum";

export const useTokenValue = (props: Props) => {
  const {
    token,
    selectedCurrency,
    selectedCurrencyUSDPrice,
    isNonProtocolToken,
  } = props;
  const network = useConnectedNetwork() || DEFAULT_NETWORK;
  const ethUsd = useNativeTokenPrice("ethereum");
  const balances = useBalances(network);
  const balance = balances[token.symbol];

  const [tokenPrice, setCgPrice] = React.useState<ethers.BigNumber>(
    ethers.constants.Zero,
  );

  const fetchCgPrice = React.useCallback(
    async (network: Network, token: TokenWithOptionalPrice) => {
      const tokenPrice = await prices.coingecko.fetchCoinGeckoTokenPrice(
        network,
        token,
        "usd",
      );
      if (tokenPrice)
        setCgPrice(ethers.utils.parseEther(String(tokenPrice.price)));
    },
    [],
  );

  React.useEffect(() => {
    if (!isNonProtocolToken) return;

    fetchCgPrice(network, token);
  }, [fetchCgPrice, network, token, isNonProtocolToken]);

  const one = ethers.utils.parseUnits(
    "1",
    token.decimals + NUMBER_PRICE_DECIMALS,
  );

  const finalTokenPrice =
    isNonProtocolToken && ethUsd
      ? tokenPrice
          .mul(ethers.utils.parseUnits("1", 2))
          .div(
            ethers.utils.parseUnits(ethUsd.toString(), NUMBER_PRICE_DECIMALS),
          )
      : token.price;

  const tokenPriceConvertedToUsd =
    token.symbol === "fxUSD" || !finalTokenPrice || !ethUsd
      ? one
      : ethers.utils
          .parseUnits(ethUsd.toString(), NUMBER_PRICE_DECIMALS)
          .mul(finalTokenPrice);

  const tokenPriceInUSD =
    finalTokenPrice && ethUsd ? tokenPriceConvertedToUsd : undefined;

  const tokenPriceInSelectedCurrency =
    tokenPriceInUSD && selectedCurrencyUSDPrice
      ? selectedCurrency === token.symbol
        ? one
        : selectedCurrency === "fxUSD"
        ? tokenPriceInUSD
        : tokenPriceInUSD
            .mul(ethers.utils.parseUnits("1", CHAINLINK_PRICE_DECIMALS))
            .div(selectedCurrencyUSDPrice.bn)
      : undefined;

  const value =
    balance &&
    tokenPriceInSelectedCurrency &&
    tokenPriceInSelectedCurrency.mul(balance).div(ethers.constants.WeiPerEther);

  return {
    tokenPriceInSelectedCurrency,
    value,
  };
};
