import { BigNumber } from "ethers";

export const DEFAULT_MIN_GAS_ESTIMATE = BigNumber.from(400_000);
export const DISABLED_PAIRS: [string, string][] = [];
// Threshold for showing a price impact warning in convert (5%)
export const PRICE_IMPACT_WARNING_THRESHOLD = 5;
export const MAX_CONVERT_TOKENS_TO_DISPLAY = 10;
export const PRICE_IMPACT_IGNORED_SYMBOLS = ["FOREX"];
