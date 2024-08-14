import { BigNumber, ethers } from "ethers";
import { bnToDisplayString } from "../../../utils/format";
import PortfolioTile, { TileProps } from "./PortfolioTile";
import { DisplayAmount } from "../DisplayAmount";

type Props = TileProps & {
  veForex?: BigNumber;
};

const VeForexTile = ({
  veForex,
  isLoading,
  title,
  leftText,
  children,
  ...rest
}: Props) => {
  const totalGovernanceVeForexToDisplay = `${bnToDisplayString(
    veForex || ethers.constants.Zero,
    18,
    2,
  )} veFOREX`;

  return (
    <PortfolioTile
      key="governanceVeForex"
      isLoading={isLoading}
      title="governance veFOREX"
      leftText={<DisplayAmount amount={totalGovernanceVeForexToDisplay} />}
      {...rest}
    />
  );
};

export default VeForexTile;
