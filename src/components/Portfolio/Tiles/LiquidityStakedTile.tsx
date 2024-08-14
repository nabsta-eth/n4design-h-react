import { ethers } from "ethers";
import PortfolioTile, { TileProps } from "./PortfolioTile";
import { CurveTokenData } from "../../../hooks/useDashboard/useDashboardAssets";
import { expandDecimals } from "../../../utils/trade";
import { TokenWithBalanceAndPrice } from "../../../types/tokenInfo";
import { toDisplaySymbolAmount } from "../../../utils/general";
import { DisplayAmount } from "../DisplayAmount";

type Props = TileProps & {
  hlp: TokenWithBalanceAndPrice | undefined;
  curve: CurveTokenData[] | undefined;
};

const LiquidityStakedTile = ({
  hlp,
  curve,
  isLoading,
  title,
  leftText,
  children,
  ...rest
}: Props) => {
  const hlpPrice = hlp?.price || 1;

  const hLPStakedValue = (hlp?.balance || ethers.constants.Zero).mul(hlpPrice);

  const curveStakedValue = curve?.reduce((acc, curr) => {
    if (!curr.balance || !curr.price) return acc;
    return acc.add(curr.balance.mul(curr.price).div(expandDecimals(1, 18)));
  }, ethers.constants.Zero);

  const totalLiquidityStakedToDisplay = toDisplaySymbolAmount(
    hLPStakedValue.add(curveStakedValue || ethers.constants.Zero),
    "USD",
    36,
  );

  return (
    <PortfolioTile
      key="liquidityStakedValue"
      isLoading={isLoading}
      title="total liquidity staked"
      leftText={<DisplayAmount amount={totalLiquidityStakedToDisplay} />}
      {...rest}
    />
  );
};

export default LiquidityStakedTile;
