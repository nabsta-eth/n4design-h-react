import { ethers } from "ethers";
import {
  FxKeeperPoolPool,
  LpStakingData,
  RewardPoolData,
  SECONDS_IN_A_YEAR_BN,
} from "handle-sdk";
import { FxTokenPriceMap } from "../../context/Prices";
import {
  CHAINLINK_PRICE_DECIMALS,
  COIN_GECKO_PRICE_DECIMALS,
  FOREX_AND_FX_TOKEN_DECIMALS,
  DAYS_IN_A_YEAR,
} from "../../config/constants";
import { fxTokenSymbolToCurrency } from "../format";
import { bigNumberToFloat, transformDecimals } from "../general";

export const LP_SYMBOL_SUBSTITUTES = {
  EURS: "fxEUR",
  "2CRV": "fxUSD",
} as Record<string, string>;

export const formatFxKeeperPoolName = (token: string) =>
  `fxKeeper${fxTokenSymbolToCurrency(token)}`;

export const getFxKeeperTvlInUsd = (
  pool: FxKeeperPoolPool,
  fxTokensUsd: FxTokenPriceMap,
) =>
  pool.totalDeposited
    .mul(fxTokensUsd[pool.fxToken].bn)
    .div(ethers.BigNumber.from("10").pow(COIN_GECKO_PRICE_DECIMALS));

export const getUSDValueOfDistributedYearlyRewards = (
  ratePerSecond: ethers.BigNumber,
  forexPriceInUsd: number,
) => {
  const forexPerYear = ratePerSecond.mul(SECONDS_IN_A_YEAR_BN);

  return forexPerYear
    .mul(
      ethers.utils.parseUnits(
        forexPriceInUsd.toString(),
        COIN_GECKO_PRICE_DECIMALS,
      ),
    )
    .div(ethers.BigNumber.from("10").pow(COIN_GECKO_PRICE_DECIMALS));
};

export const getFxKeeperYearlyRewardsUSDValue = (
  pool: FxKeeperPoolPool,
  rewardPoolData: RewardPoolData,
  forexPriceInUsd: number,
) => {
  const poolName = formatFxKeeperPoolName(pool.fxToken);
  if (!rewardPoolData.pools[poolName]) return ethers.constants.Zero;

  return getUSDValueOfDistributedYearlyRewards(
    rewardPoolData.forexDistributionRate
      .mul(rewardPoolData.pools[poolName].ratio)
      .div(ethers.constants.WeiPerEther),
    forexPriceInUsd,
  );
};

export const getFxKeeperApy = (
  pool: FxKeeperPoolPool,
  rewardPoolData: RewardPoolData,
  fxTokensUsd: FxTokenPriceMap, // 8 decimals
  forexPriceInUsd: number, // 6 decimals
) =>
  getFxKeeperTvlInUsd(pool, fxTokensUsd).isZero()
    ? ethers.constants.Zero
    : getFxKeeperYearlyRewardsUSDValue(pool, rewardPoolData, forexPriceInUsd)
        .mul(ethers.constants.WeiPerEther)
        .div(getFxKeeperTvlInUsd(pool, fxTokensUsd))
        .mul("100");

export const getFxKeeperDailyRewards = (
  fxTokenDeposited: ethers.BigNumber,
  tokenPrice: ethers.BigNumber, // 8 decimals
  apy: ethers.BigNumber,
) =>
  transformDecimals(
    tokenPrice,
    CHAINLINK_PRICE_DECIMALS,
    FOREX_AND_FX_TOKEN_DECIMALS,
  )
    .mul(fxTokenDeposited)
    .div(ethers.constants.WeiPerEther)
    .mul(apy)
    .div(ethers.constants.WeiPerEther)
    .div(DAYS_IN_A_YEAR);

export const parseLpTokenSymbol = (symbol: string) =>
  LP_SYMBOL_SUBSTITUTES[symbol] || symbol;

export const getLpTvlInUsd = (
  pool: LpStakingData,
  fxTokensUsd: FxTokenPriceMap, // 8 decimals
  forexPriceInUsd: number, // 6 decimals
  ethPriceUsd: number, // 6 decimals
) =>
  pool.tokensInLp.reduce((progress, token) => {
    const mappedToken = parseLpTokenSymbol(token.symbol);
    const tokenPrice: number =
      token.symbol === "FOREX"
        ? forexPriceInUsd
        : token.symbol === "WETH"
        ? ethPriceUsd
        : fxTokensUsd[mappedToken].number;

    return (
      progress + tokenPrice * bigNumberToFloat(token.balance, token.decimals)
    );
  }, 0);

export const getValueOfStakedLpTokens = (
  pool: LpStakingData,
  lpTotalValueInUsd: number,
) =>
  pool.account
    ? ethers.utils
        .parseEther(lpTotalValueInUsd.toFixed(18))
        .mul(pool.account.deposited)
        .div(pool.lpTokenTotalSupply)
    : ethers.constants.Zero;

export const getHasLpDistributionPeriodEnded = (pool: LpStakingData) =>
  pool.distributionPeriodEnds.toNumber() * 1000 < Date.now();

export const getLpApy = (
  pool: LpStakingData,
  fxTokensUsd: FxTokenPriceMap, // 8 decimals
  forexPriceInUsd: number, // 6 decimals
  ethPriceUsd: number, // 6 decimals
) =>
  getValueOfStakedLpTokens(
    pool,
    getLpTvlInUsd(pool, fxTokensUsd, forexPriceInUsd, ethPriceUsd),
  ).isZero() || getHasLpDistributionPeriodEnded(pool)
    ? ethers.constants.Zero
    : getUSDValueOfDistributedYearlyRewards(
        pool.distributionRate,
        forexPriceInUsd,
      )
        .mul(ethers.constants.WeiPerEther)
        .mul("100")
        .div(
          getValueOfStakedLpTokens(
            pool,
            getLpTvlInUsd(pool, fxTokensUsd, forexPriceInUsd, ethPriceUsd),
          ),
        );

export const getLpDailyRewards = (
  valueOfStakedLpTokens: ethers.BigNumber,
  apy: ethers.BigNumber,
) =>
  valueOfStakedLpTokens
    .mul(apy)
    .div(ethers.constants.WeiPerEther)
    .div(DAYS_IN_A_YEAR);

export const fxTokenToFxKeeperName = (fxToken: string) =>
  `fxKeeper${fxToken.substring(2)}`;

export const FxKeeperNameToFxToken = (fxKeeperName: string) =>
  `fx${fxKeeperName.substring(fxKeeperName.length - 3)}`;
