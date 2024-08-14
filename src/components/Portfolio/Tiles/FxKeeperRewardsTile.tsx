import { ethers } from "ethers";
import { FxKeeperPoolPool } from "handle-sdk";
import React from "react";
import { useTokenUsdPrice } from "../../../context/Prices";
import { bnToDisplayString } from "../../../utils/format";
import PortfolioTile, { TileProps } from "./PortfolioTile";
import { DisplayAmount } from "../DisplayAmount";

type Props = TileProps & {
  unclaimedRewards: {
    keeperPools: FxKeeperPoolPool[];
    userBalance: ethers.BigNumber;
  };
};

const FxKeeperRewardsTile = ({
  unclaimedRewards,
  isLoading,
  title,
  leftText,
  children,
  ...rest
}: Props) => {
  const forexPrice = useTokenUsdPrice({ tokenSymbol: "FOREX", fetch: false });
  const forexUsdPrice = React.useMemo(
    () => ethers.utils.parseEther((forexPrice || 1).toString()),
    [forexPrice],
  );
  const one = ethers.utils.parseEther("1");

  const totalFxKeeperRewards =
    unclaimedRewards?.userBalance || ethers.constants.Zero;
  const totalFxKeeperRewardsInUsd = totalFxKeeperRewards
    .mul(forexUsdPrice)
    .div(one);

  const totalFxKeeperRewardsToDisplay = `${bnToDisplayString(
    totalFxKeeperRewardsInUsd,
    18,
    2,
  )} USD`;

  return (
    <PortfolioTile
      key="fxKeeperRewards"
      isLoading={isLoading}
      title="fxKeeper claimable rewards"
      leftText={<DisplayAmount amount={totalFxKeeperRewardsToDisplay} />}
      {...rest}
    />
  );
};

export default FxKeeperRewardsTile;
