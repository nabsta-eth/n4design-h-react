import { AMOUNT_DECIMALS, Instrument } from "handle-sdk/dist/components/trade";
import {
  FLI_ACTIVE,
  TIPR_ACTIVE,
  TIPR_MINIMUM_ELIGIBLE_TRADE_VALUE_LPC,
} from "../../config/trade";
import { BigNumber } from "ethers";
import { TranslationMap } from "src/types/translation";
import { bnToDisplayString } from "../format";
import { TRADE_LP_DEFAULT_CURRENCY_SYMBOL } from "@handle-fi/react-components";
import { TiprState } from "../../context/Incentives/Incentives";
import { pairToString } from "handle-sdk/dist/utils/general";

export const getIsTiprActive = () => TIPR_ACTIVE;

export const getInstrumentEligibilityForTipr = (
  instrument: Instrument,
  state: TiprState | undefined,
): boolean =>
  getIsTiprActive() &&
  !!state?.eligiblePairs.map(p => pairToString(p)).includes(instrument.pair);

export const getTiprEligibilityMessage = (
  instrument: Instrument,
  sizeLpc: BigNumber,
  t: TranslationMap,
  state: TiprState | undefined,
) => {
  if (!getInstrumentEligibilityForTipr(instrument, state)) {
    return "";
  }
  if (sizeLpc.isZero()) {
    return "";
  }
  if (sizeLpc.lt(TIPR_MINIMUM_ELIGIBLE_TRADE_VALUE_LPC)) {
    return getTiprIneligibleTradeMessage(t);
  }
  return t.tiprEligibleTrade;
};

const getTiprIneligibleTradeMessage = (t: TranslationMap) =>
  t.tiprIneligibleTrade.replace(
    "#tiprMininimumTradeValue#",
    `${bnToDisplayString(
      TIPR_MINIMUM_ELIGIBLE_TRADE_VALUE_LPC,
      AMOUNT_DECIMALS,
      0,
    )} ${TRADE_LP_DEFAULT_CURRENCY_SYMBOL}`,
  );

export const getIsFliActive = () => FLI_ACTIVE;
