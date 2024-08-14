import { useToken, useTokenManager } from "../../context/TokenManager";
import { BigNumber, ethers } from "ethers";
import { hlp } from "handle-sdk/dist/components/trade/platforms";
import usePromise from "@handle-fi/react-components/dist/hooks/usePromise";
import { LP_TOKEN_PEG_WITH_FX_TOKEN } from "../../utils/earn";
import {
  FxKeeperPoolPool,
  GovernanceLockData,
  LpStakingData,
  Network,
  SingleCollateralVault,
  Vault,
} from "handle-sdk";
import { transformDecimals } from "../../utils/general";
import {
  getMultiVaultCollateral,
  getSingleVaultCollateral,
} from "../../utils/dashboard/dashboard-assets";
import { useTradePrices } from "../../context/TradePrices";
import { useUserBalancesWithPrices } from "../useUserBalancesWithPrices";
import { TokenWithBalanceAndPrice } from "../../types/tokenInfo";
import { useNetworkOrDefault } from "../useNetworkOrDefault";
import { PRICE_DECIMALS } from "handle-sdk/dist/components/trade";
import { DEFAULT_HLP_NETWORK } from "handle-sdk/dist/components/trade/platforms/hlp/config";
import { useMemo } from "react";

export type DashboardAssetsHookArgs = {
  network: Network;
  account: string;
  lpStakingPools?: LpStakingData[];
  fxKeeperPools?: FxKeeperPoolPool[];
  multiCollateralVaults?: Vault[];
  singleCollateralVaults?: SingleCollateralVault[];
  governanceLockData?: GovernanceLockData;
};

export type CurveTokenData = {
  address: string;
  symbol: string;
  price?: BigNumber;
  balance?: BigNumber;
};

export type DashboardAssetsHookValue = {
  // all ERC20's in wallet (price in USD, to 18 decimals)
  wallet?: {
    assets: TokenWithBalanceAndPrice[];
    // All prices in USD, to 30 decimals
    // 1. hLP (which is actually staked hLP),
    // 2. staked curve LP tokens,
    // 3. staked fx tokens in keeper pools
    // 4. veFOREX balance
    areLoading: boolean;
    currency: string;
  };
  stakedTokens: {
    hlp?: TokenWithBalanceAndPrice;
    curve?: CurveTokenData[];
    fxTokens?: TokenWithBalanceAndPrice[];
    veForex?: BigNumber;
  };
  // total collateral from handle & kashi vaults (in ETH)
  // price is in 30 decimals, in USD
  vaultCollateral: {
    handle?: TokenWithBalanceAndPrice[];
    kashi?: TokenWithBalanceAndPrice[];
  };
};

const useDashboardAssets = ({
  network: inputNetwork,
  lpStakingPools,
  fxKeeperPools,
  multiCollateralVaults,
  singleCollateralVaults,
  governanceLockData,
}: DashboardAssetsHookArgs): DashboardAssetsHookValue => {
  const network = useNetworkOrDefault(inputNetwork);
  const {
    tokens: assets,
    isLoading: areAssetsLoading,
    isLoadingPrices: arePricesLoading,
    currency,
  } = useUserBalancesWithPrices({
    network,
  });
  const wallet = {
    assets: assets,
    areLoading: areAssetsLoading || arePricesLoading,
    currency,
  };
  const { getPrice } = useTradePrices();
  const tokenManager = useTokenManager();

  // hLP staking data
  const [hlpPrice] = usePromise(() => hlp.internals.getHlpPrice());
  // only try to fetch hLP on arbitrum, otherwise pass in (and return) undefined
  const hlpToken = useToken(
    network === "arbitrum" ? "hLP" : undefined,
    network,
  );
  const hlpStakingData: TokenWithBalanceAndPrice | undefined = hlpToken && {
    ...hlpToken,
    balance: wallet.assets.find(t => t.symbol === "hLP")?.balance,
    price: hlpPrice && transformDecimals(hlpPrice.maximum, PRICE_DECIMALS, 18),
  };

  const priceGetter = (baseSymbol: string) =>
    getPrice({
      baseSymbol,
      quoteSymbol: "USD",
    })?.index ?? ethers.constants.Zero;

  // curve pool staking data
  const curvePools = lpStakingPools?.filter(p => p.platform === "curve");
  const curveTokens = curvePools?.map(p => {
    const peggedFxToken = LP_TOKEN_PEG_WITH_FX_TOKEN[p.lpToken.symbol];
    const price = peggedFxToken
      ? transformDecimals(priceGetter(peggedFxToken), PRICE_DECIMALS, 18)
      : undefined;
    return {
      ...p.lpToken,
      balance: p.account?.deposited,
      price,
    };
  });

  // fx keeper pool staking data
  const fxKeeperData = fxKeeperPools?.map(p => {
    const token = tokenManager.getTokenBySymbol(p.fxToken, DEFAULT_HLP_NETWORK);
    return {
      ...token,
      balance: p.account?.fxLocked,
      price: priceGetter(token.symbol),
    };
  });

  // handle vaults are multi collateral
  const handleCollateral =
    multiCollateralVaults &&
    getMultiVaultCollateral(multiCollateralVaults, priceGetter);
  // kashi vaults are single collateral
  const kashiCollateral =
    singleCollateralVaults &&
    getSingleVaultCollateral(singleCollateralVaults, priceGetter);

  const value = useMemo(() => {
    return {
      wallet,
      stakedTokens: {
        hlp: hlpStakingData,
        curve: curveTokens,
        fxTokens: fxKeeperData,
        veForex: governanceLockData?.account?.veForexBalance,
      },
      vaultCollateral: {
        handle: handleCollateral,
        kashi: kashiCollateral,
      },
    };
  }, [
    wallet,
    hlpStakingData,
    curveTokens,
    fxKeeperData,
    governanceLockData?.account?.veForexBalance,
    handleCollateral,
    kashiCollateral,
  ]);

  return value;
};

export default useDashboardAssets;
