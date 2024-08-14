import { constants } from "ethers";
import { bnToDisplayString } from "../../../utils/format";
import PortfolioTile, { TileProps } from "./PortfolioTile";
import { expandDecimals } from "../../../utils/trade";
import { PRICE_DECIMALS } from "handle-sdk/dist/components/trade/platforms/legacyInterface";
import { TokenWithBalanceAndPrice } from "../../../types/tokenInfo";
import { DisplayAmount } from "../DisplayAmount";

type Props = TileProps & {
  handle?: TokenWithBalanceAndPrice[];
  kashi?: TokenWithBalanceAndPrice[];
};

const TotalCdpCollateralTile = ({
  handle,
  kashi,
  isLoading,
  title,
  leftText,
  children,
  ...rest
}: Props) => {
  const collateral =
    handle &&
    kashi &&
    [...handle, ...kashi].reduce((acc, curr) => {
      if (!curr.balance || !curr.price) return acc;
      return acc.add(
        curr.balance.mul(curr.price).div(expandDecimals(1, curr.decimals)),
      );
    }, constants.Zero);

  const totalCdpCollateralValueToDisplay = collateral
    ? `${bnToDisplayString(collateral, PRICE_DECIMALS, 2)} USD`
    : "0.00 USD";

  return (
    <PortfolioTile
      key="totalCdpCollateral"
      isLoading={isLoading}
      title="total CDP collateral"
      leftText={<DisplayAmount amount={totalCdpCollateralValueToDisplay} />}
      {...rest}
    />
  );
};

export default TotalCdpCollateralTile;
