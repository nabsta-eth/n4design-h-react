import { BigNumber, ethers } from "ethers";
import { LeverageDisplay } from "../../config";
import { isValidNumber } from "../general";
import { convertNumberStringToBigNumberCompatibleString } from "../format";

export const LEVERAGE_PRECISION = 2;

export const isLeverageValidWithinRange = (
  leverage: string,
  display: LeverageDisplay,
): boolean => {
  if (!isValidNumber(leverage, LEVERAGE_PRECISION)) return false;

  const leverageBn = leverageStringToBigNumber(leverage);
  return (
    leverageBn.gte(
      ethers.utils.parseUnits(display.min.toString(), LEVERAGE_PRECISION),
    ) &&
    leverageBn.lte(
      ethers.utils.parseUnits(display.max.toString(), LEVERAGE_PRECISION),
    )
  );
};

export const leverageStringToBigNumber = (leverage: string): BigNumber =>
  ethers.utils.parseUnits(
    convertNumberStringToBigNumberCompatibleString(leverage),
    LEVERAGE_PRECISION,
  );
