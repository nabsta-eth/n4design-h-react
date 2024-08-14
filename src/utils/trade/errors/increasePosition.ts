import { BigNumber, ethers } from "ethers";
import { LeverageDisplay } from "../../../config";
import { TranslationMap } from "../../../types/translation";
import {
  Trade,
  Position,
  SimulatePositionFees,
  TradePair,
} from "handle-sdk/dist/components/trade/platforms/legacyInterface";
import {
  OrderType,
  getIncreaseTriggerOrderError,
  getButtonActionText,
} from "../orders";
import { InputNumberState } from "../../../hooks/useInputNumberState";
import { isLeverageValidWithinRange } from "../leverage";

type Args = {
  t: TranslationMap;
  leverage: string;
  leverageDisplay: LeverageDisplay;
  pairPrice: BigNumber | null;
  collateralSizeUsd: BigNumber | null;
  platform: Trade;
  selectedTradePair: TradePair;
  existingPosition: Position | undefined;
  orderType: OrderType;
  simulatedPositionFees: SimulatePositionFees | undefined;
  collateralTokenBalance: BigNumber | undefined;
  collateralTokenAmount: BigNumber;
  triggerPrice: InputNumberState;
  isLong: boolean;
  isSigningDone: boolean;
  panelType: "buy" | "sell";
  sizeUsd: BigNumber;
  displayDecimals: number;
};

export type IncreasePositionText = {
  buttonText: string;
  canSubmit: boolean;
  tooltip?: string;
  alertTriggerOrderInput?: boolean;
};

/**
 * Returns [button text, can submit, optional tooltip].
 */
export const getIncreasePositionError = ({
  leverage,
  leverageDisplay,
  t,
  pairPrice,
  collateralSizeUsd,
  platform,
  selectedTradePair,
  existingPosition,
  orderType,
  simulatedPositionFees,
  collateralTokenAmount,
  collateralTokenBalance,
  triggerPrice,
  isLong,
  isSigningDone,
  panelType,
  sizeUsd,
  displayDecimals,
}: Args): IncreasePositionText => {
  if (!isLeverageValidWithinRange(leverage, leverageDisplay)) {
    return {
      buttonText: t.invalidLeverage,
      canSubmit: false,
    };
  }

  if (!pairPrice || !collateralSizeUsd) {
    return {
      buttonText: t.pricesLoading,
      canSubmit: false,
    };
  }

  const action = panelType === "buy" ? t.buy : t.sell;

  const sizeIsEntered = sizeUsd.gt(0);
  const collateralIsEntered = collateralTokenAmount.gt(0);
  if (!sizeIsEntered || !collateralIsEntered) {
    return {
      buttonText: action,
      canSubmit: false,
    };
  }

  const minimumCollateral = platform.getMinimumPositionCollateral({
    pair: selectedTradePair.pair,
    existingCollateral: existingPosition?.collateral || ethers.constants.Zero,
    isTriggerOrder: orderType !== OrderType.Market,
  });
  const fees = simulatedPositionFees?.totalAmountUsd || ethers.constants.Zero;

  // Check if position collateral after fees is less than minimum collateral.
  if (
    collateralSizeUsd?.gt(0) &&
    collateralSizeUsd?.lte(minimumCollateral.add(fees))
  ) {
    return {
      buttonText: t.positionTooSmall,
      canSubmit: false,
    };
  }
  // Check that balance is greater than collateral.
  if (collateralTokenBalance?.lt(collateralTokenAmount)) {
    return {
      buttonText: t.insufficientBalance,
      canSubmit: false,
    };
  }

  const triggerError = getIncreaseTriggerOrderError(
    t,
    triggerPrice,
    isLong,
    orderType,
    pairPrice,
  );
  if (triggerError) {
    return {
      buttonText: t.invalidOrder,
      canSubmit: false,
      tooltip: triggerError,
      alertTriggerOrderInput: true,
    };
  }

  if (!isSigningDone) {
    // Submitting here should only trigger the TOS signing, not a trade.
    return {
      buttonText: t.signTermsOfUse,
      canSubmit: true,
    };
  }

  return {
    buttonText: getButtonActionText(
      t,
      selectedTradePair.pair,
      displayDecimals,
      action,
      triggerPrice.value.bn,
      orderType,
    ),
    canSubmit: true,
  };
};
