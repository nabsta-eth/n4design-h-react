import { ethers } from "ethers";
import {
  FxKeeperPoolPool,
  GovernanceLockData,
  LpStakingData,
  Network,
  RewardPoolData,
  RewardPoolRaw,
  LpPlatform,
  utils,
} from "handle-sdk";
import { SECONDS_IN_A_YEAR_BN } from "handle-sdk/dist/constants";
import {
  COIN_GECKO_PRICE_DECIMALS,
  MAX_REWARD_BOOST,
  MIN_REWARD_BOOST,
} from "../../config/constants";
import { FxTokenPriceMap } from "../../context/Prices";
import { bnToDisplayString, fxTokenSymbolToCurrency } from "../format";
import { bigNumberToFloat, digits } from "../general";
import { LOCK_TOKEN_SYMBOL } from "../../components/GovernancePool";
import { parseEther, parseUnits } from "ethers/lib/utils";

export type EarnTableData = {
  title: string;
  network: Network;
  platform: LpPlatform;
  estApr: string;
  exactApr?: string;
  tvlInUSD?: string;
  totalDeposits: string;
  link?: string;
  comingSoon?: boolean;
  externalOnly?: boolean;
  isLoading?: boolean;
};

export const GOVERNANCE_POOL_TITLE = "balancer fxUSD/FOREX";

export const getGovernancePoolEarnTableRowData = (
  rewardPoolData: RewardPoolData,
  rewardPool: RewardPoolRaw,
  governanceLock: GovernanceLockData,
  forexPriceUsd: number,
  lockTokenPriceUsd: number,
): EarnTableData => {
  const forexDistributedPerYear = rewardPoolData.forexDistributionRate
    .mul(rewardPoolData.pools.governanceLock.ratio)
    .div(ethers.constants.WeiPerEther)
    .mul(SECONDS_IN_A_YEAR_BN);
  const totalDepositedUsd = rewardPool.totalRealDeposits
    .mul(parseEther(String(lockTokenPriceUsd)))
    .div(ethers.constants.WeiPerEther);
  const forexPriceUsdBn = ethers.utils.parseUnits(
    forexPriceUsd.toFixed(COIN_GECKO_PRICE_DECIMALS),
    COIN_GECKO_PRICE_DECIMALS,
  );
  const priceUnit = parseUnits("1", COIN_GECKO_PRICE_DECIMALS);
  const forexDistributedPerYearUsd = forexDistributedPerYear
    .mul(forexPriceUsdBn)
    .div(priceUnit);
  const aprBn = totalDepositedUsd.isZero()
    ? ethers.constants.WeiPerEther
    : forexDistributedPerYearUsd
        .mul(ethers.constants.WeiPerEther)
        .div(totalDepositedUsd);
  const estApr = calculateAndFormatAprRange(
    +ethers.utils.formatEther(aprBn),
    rewardPoolData.pools.governanceLock.averagePoolBoost,
  );
  const exactApr = calculateAndFormatUserApr(
    rewardPoolData.pools.governanceLock.userBoost,
    +ethers.utils.formatEther(aprBn),
    rewardPoolData.pools.governanceLock.averagePoolBoost,
  );
  const tvlUsd = governanceLock.totalForexLocked
    .mul(forexPriceUsdBn)
    .div(priceUnit);
  return {
    title: GOVERNANCE_POOL_TITLE,
    platform: "handle",
    network: "arbitrum",
    estApr,
    exactApr,
    totalDeposits: `${bnToDisplayString(
      governanceLock.totalForexLocked,
      18,
      2,
    )} ${LOCK_TOKEN_SYMBOL}`,
  };
};

const getUSDValueOfRewardsDistributedOverAYear = (
  forexDistributionRatePerSecond: ethers.BigNumber,
  forexPriceInUSD: number,
): ethers.BigNumber => {
  const numberOfForexDistributedPerYear =
    forexDistributionRatePerSecond.mul(SECONDS_IN_A_YEAR_BN);

  return numberOfForexDistributedPerYear
    .mul(
      ethers.utils.parseUnits(
        forexPriceInUSD.toString(),
        COIN_GECKO_PRICE_DECIMALS,
      ),
    )
    .div(ethers.BigNumber.from("10").pow(COIN_GECKO_PRICE_DECIMALS));
};

export const getKeeperPoolEarnTableRowsData = (
  fxKeeperPools: FxKeeperPoolPool[],
  rewardPoolData: RewardPoolData,
  forexTokensUsd: FxTokenPriceMap,
  forexTokenPriceUsd: number,
): EarnTableData[] =>
  fxKeeperPools.map(pool => {
    const rewardPoolName = `fxKeeper${fxTokenSymbolToCurrency(pool.fxToken)}`;
    const isRewardPoolEnabled = !!rewardPoolData.pools[rewardPoolName];
    // If the pool is not enabled, then the yearly reward is zero.
    const rewardsYearlyUSDValue = isRewardPoolEnabled
      ? getUSDValueOfRewardsDistributedOverAYear(
          rewardPoolData.forexDistributionRate
            .mul(rewardPoolData.pools[rewardPoolName].ratio)
            .div(ethers.constants.WeiPerEther),
          forexTokenPriceUsd,
        )
      : ethers.constants.Zero;
    // Convert the pool deposits to USD using CoinGecko as the price source.
    const tvlInUSD = pool.totalDeposited
      .mul(forexTokensUsd[pool.fxToken].bn)
      .div(ethers.BigNumber.from("10").pow(COIN_GECKO_PRICE_DECIMALS));

    // Calculate the APY from the TVL and yearly reward rate.
    const bnPoolApr = tvlInUSD.isZero()
      ? ethers.constants.Zero
      : rewardsYearlyUSDValue.mul(ethers.constants.WeiPerEther).div(tvlInUSD);

    const poolApr = +ethers.utils.formatEther(bnPoolApr);
    const poolBoostData = isRewardPoolEnabled
      ? {
          userBoost: rewardPoolData.pools[rewardPoolName].userBoost,
          averagePoolBoost:
            rewardPoolData.pools[rewardPoolName].averagePoolBoost,
        }
      : { userBoost: undefined, averagePoolBoost: 1 };

    return {
      title: `fxKeeper - ${pool.fxToken}`,
      platform: "handle",
      network: "arbitrum",
      estApr: calculateAndFormatAprRange(
        poolApr,
        poolBoostData.averagePoolBoost,
      ),
      exactApr: calculateAndFormatUserApr(
        poolBoostData.userBoost,
        poolApr,
        poolBoostData.averagePoolBoost,
      ),
      tvlInUSD: `$${bnToDisplayString(tvlInUSD, 18, 2)}`,
      totalDeposits: `${bnToDisplayString(pool.totalDeposited, 18, 2)} ${
        pool.fxToken
      }`,
    };
  });

export const LP_TOKEN_PEG_WITH_FX_TOKEN = {
  EURS: "fxEUR",
  "2CRV": "fxUSD",
} as Record<string, string>;

export const getLpStakingDataEarnTableRowData = (
  stakingPools: LpStakingData[],
  forexTokenPriceUsd: number,
  fxTokensUsd: FxTokenPriceMap,
  ethPriceUsd: number,
): EarnTableData[] => {
  // this is a shortcut to getting the earn page working.
  // we need to get the prices of the tokens staked in the LPs.
  // The issue is some of these tokens dont have price feeds. Instead of getting
  // prices in multiple different ways we map to tokens we do have the prices of.
  //  For example, EURS can use fxEUR price as both tokens are pegged to EUR.

  return stakingPools.map(pool => {
    const usdValueOfTokensInLpPool = pool.tokensInLp.reduce(
      (progress, token) => {
        const mappedToken =
          LP_TOKEN_PEG_WITH_FX_TOKEN[token.symbol] || token.symbol;

        const tokenPrice = (() => {
          if (token.symbol === "FOREX") return forexTokenPriceUsd;
          if (token.symbol === "WETH") return ethPriceUsd;
          return fxTokensUsd[mappedToken].number;
        })();

        return (
          progress +
          tokenPrice * bigNumberToFloat(token.balance, token.decimals)
        );
      },
      0,
    );

    const valueOfStakedLpTokens = ethers.utils
      .parseEther(usdValueOfTokensInLpPool.toFixed(18))
      .mul(pool.totalDeposited)
      .div(pool.lpTokenTotalSupply);

    const rewardsYearlyUSDValue = getUSDValueOfRewardsDistributedOverAYear(
      pool.distributionRate,
      forexTokenPriceUsd,
    );

    const hasDistributionPeriodEnded =
      pool.distributionPeriodEnds.toNumber() * 1000 < Date.now();

    const apy =
      valueOfStakedLpTokens.isZero() || hasDistributionPeriodEnded
        ? ethers.constants.Zero
        : rewardsYearlyUSDValue
            .mul(ethers.constants.WeiPerEther)
            .mul("100")
            .div(valueOfStakedLpTokens);

    return {
      title: pool.title,
      network: "arbitrum",
      platform: pool.platform,
      estApr: `${bnToDisplayString(apy, 18, 2)}%`,
      tvlInUSD: `$${usdValueOfTokensInLpPool.toLocaleString(
        undefined,
        digits(0, 2),
      )}`,
      totalDeposits: `${bnToDisplayString(pool.totalDeposited, 18, 2)} todo`,
      link: pool.url,
    };
  });
};

export const calculateAndFormatAprRange = (
  poolApr: number,
  averagePoolBoost: number,
) => {
  const minToDisplay = `${(
    100 *
    utils.reward.calculateUserApr(MIN_REWARD_BOOST, averagePoolBoost, poolApr)
  ).toFixed(2)}%`;

  const maxToDisplay = `${(
    100 *
    utils.reward.calculateUserApr(MAX_REWARD_BOOST, averagePoolBoost, poolApr)
  ).toFixed(2)}%`;
  return Array.from(new Set([minToDisplay, maxToDisplay])).join(" => ");
};

export const calculateAndFormatUserApr = (
  userBoost: number | undefined,
  poolApr: number,
  averagePoolBoost: number,
) =>
  userBoost
    ? `${(
        100 *
        utils.reward.calculateUserApr(userBoost, averagePoolBoost, poolApr)
      ).toFixed(2)}%`
    : undefined;

export const formatExactAprRow = (apr?: string) => apr && `your APR: ${apr}`;
