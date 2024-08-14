import { ethers } from "ethers";
import React from "react";
import { bnToDisplayString } from "../../../utils/format";
import PortfolioTile, { TileProps } from "./PortfolioTile";
import { GovernanceLockData } from "handle-sdk";
import { useTokenUsdPrice } from "../../../context/Prices";
import { DisplayAmount } from "../DisplayAmount";

type Props = TileProps & {
  governanceData: GovernanceLockData | undefined;
};

const GovernanceStakedTile = ({
  governanceData,
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

  const governanceStakedValue = (
    governanceData?.account?.forexLocked || ethers.constants.Zero
  ).mul(forexUsdPrice || ethers.constants.Zero);
  const totalGovernanceStakedToDisplay = `${bnToDisplayString(
    governanceStakedValue,
    36,
    2,
  )} USD`;

  return (
    <PortfolioTile
      key="governanceStaked"
      isLoading={isLoading}
      title="governance staked"
      leftText={<DisplayAmount amount={totalGovernanceStakedToDisplay} />}
      {...rest}
    />
  );
};

export default GovernanceStakedTile;
