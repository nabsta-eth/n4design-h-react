import { BigNumber, ethers } from "ethers";
import PortfolioTile, { TileProps } from "./PortfolioTile";
import { useTokenUsdPrice } from "../../../context/Prices";
import React from "react";
import { toDisplaySymbolAmount } from "../../../utils/general";
import classNames from "classnames";
import classes from "./PortfolioTiles.module.scss";
import { DisplayAmount } from "../DisplayAmount";

type Props = TileProps & {
  forexRebates: BigNumber | undefined;
};

const ClaimableRebates = ({
  forexRebates,
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

  const totalClaimableRebates = forexRebates || ethers.constants.Zero;
  const totalClaimableRebatesInUsd = totalClaimableRebates
    .mul(forexUsdPrice)
    .div(ethers.constants.WeiPerEther);
  const totalClaimableRebatesToDisplay = toDisplaySymbolAmount(
    totalClaimableRebatesInUsd,
    "USD",
  );
  const totalClaimableForexRebatesToDisplay = toDisplaySymbolAmount(
    totalClaimableRebates,
    "FOREX",
  );

  return (
    <PortfolioTile
      key="claimableRebates"
      isLoading={isLoading}
      title="unclaimed rebates"
      leftText={<DisplayAmount amount={totalClaimableRebatesToDisplay} />}
      rightText={<DisplayAmount amount={totalClaimableForexRebatesToDisplay} />}
      {...rest}
    />
  );
};

export default ClaimableRebates;
