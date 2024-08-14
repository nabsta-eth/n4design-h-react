import { AxiosError, isAxiosError } from "axios";
import { collateralCapExceeded } from "./collateralCapExceeded";
import { glpRequestCancelled } from "./glpRequestCancelled";
import { h2soQuoteNotValidYet } from "./h2soQuoteNotValidYet";
import { hlpCooldown } from "./hlpCooldown";
import { hlpVaultForbidden } from "./hlpVaultForbidden";
import { insufficientFundsForGas } from "./insufficientFundsForGas";
import { insufficientFundsForTx } from "./insufficientFundsForTx";
import { insufficientHlpOutput } from "./insufficientHlpOutput";
import { insufficientUsdHlpOutput } from "./insufficientUsdHlpOutput";
import { intrinsicGasTooLow } from "./intrinsicGasTooLow";
import { liquidationFeesExceedCollateral } from "./liquidationFeesExceedCollateral";
import { poolAmountExceeded } from "./poolAmountExceeded";
import { priceNotFound } from "./priceNotFound";
import { transferAmountExceedsAllowance } from "./transferAmountExceedsAllowance";
import { transferAmountExceedsBalance } from "./transferAmountExceedsBalance";
import { vaultPriceFeedNewPrice } from "./vaultPriceFeedNewPrice";

const revertMaps: RevertErrorMap[] = [
  poolAmountExceeded,
  insufficientUsdHlpOutput,
  h2soQuoteNotValidYet,
  hlpVaultForbidden,
  vaultPriceFeedNewPrice,
  insufficientHlpOutput,
  insufficientFundsForGas,
  intrinsicGasTooLow,
  insufficientFundsForTx,
  transferAmountExceedsBalance,
  transferAmountExceedsAllowance,
  hlpCooldown,
  glpRequestCancelled,
  liquidationFeesExceedCollateral,
  collateralCapExceeded,
];

export type AxiosErrorMap = (error: AxiosError) => string | undefined;

const axiosMaps: AxiosErrorMap[] = [priceNotFound];

export type RevertErrorMap = {
  identifier: string;
  replacement: string;
};

// aliasing this type to make it more readable
type RevertString = string;

/// Tries to maps an error object into an user-friendly message.
export const getMappedError = (
  error: RevertString | AxiosError,
): string | undefined => {
  if (isAxiosError(error)) {
    return axiosMaps.find(map => map(error))?.(error);
  }
  return revertMaps.find(map => checkRevertErrorIdentifier(error, map))
    ?.replacement;
};

const checkRevertErrorIdentifier = (error: string, map: RevertErrorMap) =>
  error.includes(map.identifier);
