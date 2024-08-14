import { DISABLED_PAIRS } from "../../config/convert";

export const isPairDisabled = (
  fromSymbol: string,
  toSymbol: string,
): boolean => {
  return DISABLED_PAIRS.some(
    disabledPair =>
      disabledPair.includes(fromSymbol) && disabledPair.includes(toSymbol),
  );
};
