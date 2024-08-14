import { ethers } from "ethers";
import { bnToDisplayString } from "../../../utils/format";
import PortfolioTile, { TileProps } from "./PortfolioTile";

type Props = TileProps & {
  expensesData: {};
};

const ExpensesTile = ({
  expensesData,
  isLoading,
  title,
  leftText,
  children,
  ...rest
}: Props) => {
  const interestPerDay = ethers.BigNumber.from(1234);
  const interestToDisplay = `${
    interestPerDay.isZero()
      ? "0.00"
      : bnToDisplayString(interestPerDay, 2 /* 18 */, 2 /*decimalPlacesToShow*/)
  } USD (mock)`;

  return (
    <PortfolioTile
      key="expenses"
      isLoading={isLoading}
      title="daily interest expenses"
      leftText={interestToDisplay}
      {...rest}
    />
  );
};

export default ExpensesTile;
