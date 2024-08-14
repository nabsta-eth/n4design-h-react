import { ethers } from "ethers";
import PortfolioTile, { TileProps } from "./PortfolioTile";
import { useNativeTokenPrice, useTokenUsdPrice } from "../../../context/Prices";
import React from "react";
import { FxKeeperPoolPool } from "handle-sdk";
import { toDisplaySymbolAmount } from "../../../utils/general";
import classNames from "classnames";
import classes from "./PortfolioTiles.module.scss";
import { DisplayAmount } from "../DisplayAmount";

type Props = TileProps & {
  fxKeeperPools: FxKeeperPoolPool[] | undefined;
};

// TODO: dynamically support collateral types
const WETH_AMOUNT_IX = 0;
const FOREX_AMOUNT_IX = 1;

const ClaimableFxKeeperRewards = ({
  fxKeeperPools,
  isLoading,
  title,
  leftText,
  children,
  ...rest
}: Props) => {
  const wethPrice = useNativeTokenPrice("arbitrum");
  const forexPrice = useTokenUsdPrice({ tokenSymbol: "FOREX", fetch: false });
  const forexUsdPrice = React.useMemo(
    () => ethers.utils.parseEther((forexPrice ?? 1).toString()),
    [forexPrice],
  );
  const wethUsdPrice = React.useMemo(
    () => ethers.utils.parseEther((wethPrice ?? 1).toString()),
    [wethPrice],
  );

  const totalClaimableFxKeeperRewards = (
    ix: number,
    price: ethers.BigNumber,
  ) => {
    const totalRewards =
      fxKeeperPools?.reduce((acc, curr) => {
        if (!curr.account?.rewards.collateralAmounts[ix]) return acc;
        return acc.add(curr.account?.rewards.collateralAmounts[ix]);
      }, ethers.constants.Zero) ?? ethers.constants.Zero;
    return {
      totalRewards,
      totalRewardsInUsd:
        totalRewards?.mul(price).div(ethers.constants.WeiPerEther) ??
        ethers.constants.Zero,
    };
  };

  const {
    totalRewards: totalClaimableWethFxKeeperRewards,
    totalRewardsInUsd: totalClaimableWethFxKeeperRewardsInUsd,
  } = totalClaimableFxKeeperRewards(WETH_AMOUNT_IX, wethUsdPrice);

  const {
    totalRewards: totalClaimableForexFxKeeperRewards,
    totalRewardsInUsd: totalClaimableForexFxKeeperRewardsInUsd,
  } = totalClaimableFxKeeperRewards(FOREX_AMOUNT_IX, forexUsdPrice);

  const totalClaimableFxKeeperRewardsInUsd =
    totalClaimableWethFxKeeperRewardsInUsd.add(
      totalClaimableForexFxKeeperRewardsInUsd,
    );
  const totalClaimableFxKeeperRewardsInUsdToDisplay = toDisplaySymbolAmount(
    totalClaimableFxKeeperRewardsInUsd,
    "USD",
  );

  return (
    <PortfolioTile
      key="fxKeeperClaimableRebates"
      isLoading={isLoading}
      title="unclaimed fxKeeper rewards"
      leftText={
        <DisplayAmount amount={totalClaimableFxKeeperRewardsInUsdToDisplay} />
      }
      rightText={
        <span
          className={classNames(
            "uk-flex uk-flex-column uk-flex-bottom",
            classes.smaller,
          )}
        >
          <span>
            <DisplayAmount
              amount={toDisplaySymbolAmount(
                totalClaimableWethFxKeeperRewards,
                "WETH",
              )}
            />
          </span>
          <span>
            <DisplayAmount
              amount={toDisplaySymbolAmount(
                totalClaimableForexFxKeeperRewards,
                "FOREX",
              )}
            />
          </span>
        </span>
      }
      {...rest}
    />
  );
};

export default ClaimableFxKeeperRewards;
