import { constants, ethers } from "ethers";
import PortfolioTile, { TileProps } from "./PortfolioTile";
import { PRICE_DECIMALS } from "handle-sdk/dist/components/trade/platforms/legacyInterface";
import { expandDecimals } from "../../../utils/trade";
import { TokenWithBalanceAndPrice } from "../../../types/tokenInfo";
import { toDisplaySymbolAmount } from "../../../utils/general";
import { DisplayAmount } from "../DisplayAmount";

type Props = TileProps & {
  stakedFxTokens?: TokenWithBalanceAndPrice[];
};

const FxKeeperPoolStakedTile = ({
  stakedFxTokens,
  isLoading,
  title,
  leftText,
  children,
  ...rest
}: Props) => {
  const totalUsdStaked = stakedFxTokens?.reduce((acc, curr) => {
    if (!curr.balance || !curr.price) return acc;
    return acc.add(
      curr.balance.mul(curr.price).div(expandDecimals(1, curr.decimals)),
    );
  }, constants.Zero);

  const totalFxKeeperStakedToDisplay = toDisplaySymbolAmount(
    totalUsdStaked ?? ethers.constants.Zero,
    "USD",
    PRICE_DECIMALS,
  );

  return (
    <PortfolioTile
      key="fxKeeperStaked"
      isLoading={isLoading}
      title="total fxKeeper staked"
      leftText={<DisplayAmount amount={totalFxKeeperStakedToDisplay} />}
      {...rest}
    />
  );
};

export default FxKeeperPoolStakedTile;
