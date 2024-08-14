import classNames from "classnames";
import { MarketPrice } from "handle-sdk/dist/components/trade/interface";
import { useLanguageStore } from "../../context/Translation";
import { useUiStore } from "../../context/UserInterface";
import {
  addWholeNumberSeparatorsToNumberString,
  bnToDisplayString,
} from "../../utils/format";
import { getLocaleNumberSeparators, getUkTooltip } from "../../utils/general";
import Button from "../Button";
import InputNumber, { InputNumberValue } from "../InputNumber/InputNumber";
import classes from "./PositionSizeInput.module.scss";
import {
  PRICE_UNIT,
  getInputString,
  USD_DISPLAY_DECIMALS,
  LOT_SIZE_MAX_DECIMALS,
} from "../../utils/trade";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import { trade } from "handle-sdk";
import { TRADE_LP_DEFAULT_CURRENCY_SYMBOL } from "../../config/trade";
import {
  PositionInputType,
  TradeFormInputHook,
} from "../../hooks/trade/useTradeFormInput";
import { InputNumberState } from "../../hooks/useInputNumberState";
import { BigNumber } from "ethers";
import { parseUnits } from "ethers/lib.esm/utils";
import { getSwitchInputTypeTooltipText } from "../../config/tooltips/trade";
import { useTradeSize } from "../../context/TradeSize";
import { useTrade } from "../../context/Trade";
import { useEffect, KeyboardEvent, FC } from "react";
import { TranslationMap } from "../../types/translation";

type Props = {
  id: string;
  input: TradeFormInputHook;
  onClickDegenMax: () => void;
  marketPrice: MarketPrice;
  inputState: InputNumberState;
  isLong: boolean;
  alert?: boolean;
  disabled?: boolean;
  onKeyDown?: (
    e: KeyboardEvent<HTMLInputElement>,
    inputStateValue: InputNumberValue,
  ) => void;
};

const PositionSizeInput: FC<Props> = ({
  id,
  input,
  marketPrice,
  inputState,
  isLong,
  alert,
  disabled,
  onKeyDown,
  onClickDegenMax,
}: Props) => {
  const { t } = useLanguageStore();
  const { isMobile } = useUiStore();
  const { setSize: setContextSize, setSizeLpc: setContextSizeLpc } =
    useTradeSize();
  const { account } = useTrade();
  const isDisabled = account?.getAvailableEquity().lt(0) ?? disabled;
  const entryPrice = marketPrice.getTradePrice(isLong);

  const onClickInputType = () => {
    input.setUserInputType(type => {
      if (type == "Lot") {
        return "Lpc";
      }
      return "Lot";
    });
  };

  useEffect(() => {
    onChange(inputState.value);
  }, [isLong, inputState.value.bn]);

  const onChange = (inputStateValue: InputNumberValue) => {
    const longFactor = isLong ? 1 : -1;

    // Truncate size decimals if input value
    // is in liquidity pool currency units and
    // has more than USD_DISPLAY_DECIMALS.
    inputStateValue.string = getParsedInputStateValueString(
      input,
      inputStateValue,
    );

    inputState.onChange(inputStateValue);
    if (input.userInputType === "Lpc") {
      setContextSize(
        inputStateValue.bn.mul(PRICE_UNIT).div(entryPrice).mul(longFactor),
      );
      input.setValueLpc(inputStateValue.bn, entryPrice);
      setContextSizeLpc(inputStateValue.bn.mul(longFactor));
      return;
    }
    input.setSize(inputStateValue.bn, entryPrice);
    setContextSize(inputStateValue.bn.mul(longFactor));
    setContextSizeLpc(
      inputStateValue.bn.mul(entryPrice).div(PRICE_UNIT).mul(longFactor),
    );
  };

  useEffect(() => {
    /// Whenever the type changes, `inputState` should be synchronised.
    if (input.userInputValue.eq(0) && inputState.value.bn.eq(0)) {
      // Abort if there's no change and both equal zero,
      // to prevent going from "" to "0.0" unnecessarily.
      return;
    }

    inputState.onChange({
      bn: input.userInputValue,
      string: getInputString(
        input.userInputValue,
        input.userInputType === "Lpc",
        input.decimals,
      ),
    });
  }, [input.userInputType]);

  const inputLabel = getInputTypeLabel(
    input.userInputType,
    input.userInputValue,
  );
  const reverseLabel = entryPrice.isZero()
    ? ""
    : getReversedLabel(input.userInputType, input.userInputValue, entryPrice);

  const autoWholeNumberSeparators = () => {
    if (inputState.value.bn.isZero()) {
      return;
    }
    const val = inputState.value.string;
    const commaVal = addWholeNumberSeparatorsToNumberString(val);
    inputState.onChange({
      bn: inputState.value.bn,
      string: commaVal,
    });
  };

  return (
    <InputNumber
      wrapperClassName="uk-margin-small-top"
      value={inputState.value}
      decimals={trade.AMOUNT_DECIMALS}
      id={id}
      label={t.size}
      placeholder={t.positionSize}
      onChange={onChange}
      onKeyDown={onKeyDown}
      rightLabel={reverseLabel}
      alert={alert}
      onBlur={autoWholeNumberSeparators}
      disabled={isDisabled}
      rightComponent={
        <div className="uk-flex uk-flex-middle">
          <span id={`${id}-input-type`} className={classes.currencySymbol}>
            {inputLabel}
          </span>
          <Button
            id={`${id}-switch-input-type`}
            onClick={onClickInputType}
            className={classNames(
              "hfi-input-button uk-margin-small-left",
              classes.button,
            )}
            tooltip={
              isMobile
                ? undefined
                : {
                    text: getSwitchInputTypeTooltipText(input.userInputType),
                    position: "left",
                  }
            }
          >
            <FontAwesomeIcon icon={["fal", "exchange"]} />
          </Button>
          <DegenApeMaxButton
            id={id}
            onClickDegenMax={onClickDegenMax}
            disabled={isDisabled}
            isMobile={isMobile}
            t={t}
          />
        </div>
      }
    />
  );
};

/// Converts from "Lpc" to e.g. "USD" and parses "Lot" as plural if needed.
export const getInputTypeLabel = (
  type: PositionInputType,
  value: BigNumber,
): string => {
  if (type == "Lpc") {
    return TRADE_LP_DEFAULT_CURRENCY_SYMBOL;
  }
  if (value.eq(parseUnits("1", trade.AMOUNT_DECIMALS))) {
    return "lot";
  }
  return "lots";
};

const getReversedLabel = (
  inputType: PositionInputType,
  inputValue: BigNumber,
  price: BigNumber,
): string => {
  // If lots, reverse to LPC amount.
  // If LP amount, reverse to lots.
  const reversedAmount =
    inputType == "Lot"
      ? inputValue.mul(price).div(PRICE_UNIT)
      : inputValue.mul(PRICE_UNIT).div(price);
  const typeLabel = getInputTypeLabel(
    inputType == "Lot" ? "Lpc" : "Lot",
    reversedAmount,
  );
  return `${bnToDisplayString(
    reversedAmount,
    trade.AMOUNT_DECIMALS,
    USD_DISPLAY_DECIMALS,
    inputType == "Lot" ? USD_DISPLAY_DECIMALS : LOT_SIZE_MAX_DECIMALS,
  )} ${typeLabel}`;
};

const getParsedInputStateValueString = (
  input: TradeFormInputHook,
  inputStateValue: InputNumberValue,
): string => {
  const localeNumberSeparators = getLocaleNumberSeparators();
  const inputStateValueStringParts = inputStateValue.string.split(
    localeNumberSeparators.decimalSeparator,
  );
  const shouldTruncateDecimals =
    !!inputStateValueStringParts[1] &&
    inputStateValueStringParts[1].length > input.decimals;
  if (!shouldTruncateDecimals) return inputStateValue.string;

  const returnValueFromString = `${inputStateValueStringParts[0]}${
    localeNumberSeparators.decimalSeparator
  }${inputStateValueStringParts[1].slice(0, input.decimals)}`;
  return returnValueFromString;
};

type DegenApeMaxButtonProps = {
  id: string;
  onClickDegenMax: () => void;
  isMobile: boolean;
  disabled?: boolean;
  t: TranslationMap;
};

const DegenApeMaxButton = ({
  id,
  onClickDegenMax,
  disabled,
  isMobile,
  t,
}: DegenApeMaxButtonProps) => (
  <div
    id={`${id}-degen-max-button`}
    className={classNames(
      "uk-margin-small-left hfi-border-remove uk-padding-remove",
      classes.grillzButton,
      {
        "cursor-pointer": !disabled,
      },
    )}
    role="button"
    tabIndex={0}
    onClick={disabled ? undefined : onClickDegenMax}
    onKeyDown={disabled ? undefined : onClickDegenMax}
    uk-tooltip={
      isMobile || disabled
        ? undefined
        : getUkTooltip({
            title: t.maxPositionSizeButtonText,
            position: "bottom",
            classes: "uk-active tooltip-orange",
          })
    }
  >
    {/* TODO: move to spritesheet */}
    <img
      src="/assets/images/grillzOrange.png"
      alt="degen max button"
      width="30"
    />
  </div>
);

export default PositionSizeInput;
