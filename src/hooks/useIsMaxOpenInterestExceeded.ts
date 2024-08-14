import { BigNumber, constants } from "ethers";
import { useTrade } from "../context/Trade";

export const useIsMaxOpenInterestExceeded = (sizeSigned: BigNumber) => {
  const isLong = sizeSigned.gt(constants.Zero);
  const { selectedTradePair, selectedTradePairLp } = useTrade();
  const openInterest = selectedTradePairLp.getOpenInterest(selectedTradePair);
  const { maxOpenInterestLong, maxOpenInterestShort } = selectedTradePair;
  const maxOpenInterestForSide =
    (isLong ? maxOpenInterestLong : maxOpenInterestShort) ?? constants.Zero;
  const openInterestForSide = isLong ? openInterest.long : openInterest.short;
  const nextOpenInterestForSide = openInterestForSide.add(sizeSigned.abs());
  const isMaxOpenInterestExceeded = nextOpenInterestForSide.gt(
    maxOpenInterestForSide,
  );
  return isMaxOpenInterestExceeded;
};
