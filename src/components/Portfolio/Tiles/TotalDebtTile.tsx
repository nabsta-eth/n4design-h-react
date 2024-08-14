import { BigNumber, utils } from "ethers";
import { useNativeTokenPrice } from "../../../context/Prices";
import { useConnectedNetwork } from "@handle-fi/react-components/dist/context/UserWallet";
import PortfolioTile, { TileProps } from "./PortfolioTile";
import { DisplayAmount } from "../DisplayAmount";

type Props = TileProps & {
  debtInEth?: BigNumber;
};

const TotalDebtTile = ({
  debtInEth,
  isLoading,
  title,
  leftText,
  children,
  ...rest
}: Props) => {
  const connectedNetwork = useConnectedNetwork();
  const nativePrice = useNativeTokenPrice(connectedNetwork || "arbitrum");
  const debt =
    debtInEth && nativePrice && +utils.formatEther(debtInEth) * nativePrice;
  const totalDebtToDisplay = `${
    debt?.toLocaleString(undefined, {
      minimumFractionDigits: 2,
    }) || "0.00"
  } USD`;

  return (
    <PortfolioTile
      key="totalDebt"
      isLoading={isLoading}
      title="total debt"
      leftText={<DisplayAmount amount={totalDebtToDisplay} />}
      color={debtInEth?.gt(0) ? "red" : undefined}
      {...rest}
    />
  );
};

export default TotalDebtTile;
