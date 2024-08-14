import { ethers } from "ethers";
import { bnToDisplayString } from "../../../utils/format";
import PortfolioTile, { TileProps } from "./PortfolioTile";
import { DisplayAmount } from "../DisplayAmount";

type Props = TileProps & {
  incomeData: {};
};

const PoolDailyRewardsTile = ({
  incomeData,
  isLoading,
  title,
  leftText,
  children,
  ...rest
}: Props) => {
  const totalDailyRewardsInUsd = ethers.BigNumber.from(12345);
  const totalDailyRewardsToDisplay = `${bnToDisplayString(
    totalDailyRewardsInUsd,
    2, //18,
    2,
  )} USD (mock)`;

  return (
    <PortfolioTile
      key="poolDailyRewards"
      isLoading={isLoading}
      title="total daily pool rewards"
      leftText={<DisplayAmount amount={totalDailyRewardsToDisplay} />}
      {...rest}
    />
  );
};

export default PoolDailyRewardsTile;
