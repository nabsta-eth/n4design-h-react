import * as React from "react";
import { ethers } from "ethers";
import { isValidBigNumber, isValidNumber } from "../../utils/general";
import {
  addWholeNumberSeparatorsToNumberString,
  bnToDisplayString,
  convertNumberStringToBigNumberCompatibleString,
} from "../../utils/format";
import { Button, Input } from "..";
import { useLanguageStore } from "../../context/Translation";
import { useMediaQuery as useReactResponsiveMediaQuery } from "react-responsive";
import classNames from "classnames";
import classes from "./InputNumber.module.scss";

export type InputNumberValue = {
  string: string;
  bn: ethers.BigNumber;
};

export type Props = Omit<
  React.DetailedHTMLProps<
    React.InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  >,
  | "id"
  | "value"
  | "onChange"
  | "key"
  | "min"
  | "max"
  | "className"
  | "ref"
  | "onKeyDown"
> & {
  id: string;
  value: InputNumberValue;
  onChange: (newValue: InputNumberValue) => void;
  onKeyDown?: (
    e: React.KeyboardEvent<HTMLInputElement>,
    newValue: InputNumberValue,
  ) => void;
  decimals: number | undefined;
  label?: string;
  rightLabel?: JSX.Element | string;
  wrapperClassName?: string;
  inputClassName?: string;
  alert?: boolean;
  min?: ethers.BigNumber;
  max?: ethers.BigNumber;
  fractionalMaxButtons?: number[];
  fractionalMaxDecimals?: number;
  rightComponent?: React.ReactNode;
  onMax?: () => void;
  inline?: boolean;
  ref?: React.RefObject<HTMLInputElement>;
};

const InputNumber: React.FC<Props> = ({
  value,
  decimals,
  disabled,
  alert,
  min,
  max,
  fractionalMaxButtons,
  fractionalMaxDecimals,
  onChange,
  onKeyDown,
  onMax,
  rightComponent,
  inline,
  ref,
  ...rest
}) => {
  const { t } = useLanguageStore();
  const isBelowThresholdToFit = useReactResponsiveMediaQuery({
    query: `(max-width: 380px)`,
  });

  const alertInternal =
    alert || (max && value.bn.gt(max)) || (min && value.bn.lt(min));

  const onChangeInternal = React.useCallback(
    (newValue: string) => {
      if (decimals === undefined) {
        console.error("Decimals must be defined before users interacts");
        return;
      }
      if (!isValidNumber(newValue, decimals)) return;

      // This needs to be done because BN doesn't accept
      // non-english number separators.
      const parsedNewValue =
        convertNumberStringToBigNumberCompatibleString(newValue);

      onChange({
        string: addWholeNumberSeparatorsToNumberString(newValue),
        bn: isValidBigNumber(parsedNewValue, decimals)
          ? ethers.utils.parseUnits(parsedNewValue, decimals)
          : ethers.constants.Zero,
      });
    },
    [decimals, onChange],
  );

  const isFirstRender = React.useRef(true);
  React.useEffect(() => {
    // There is no need to update the bn based on the string initially, since the
    // user passes in the initial value.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const parsedValue = convertNumberStringToBigNumberCompatibleString(
      value.string,
    );
    onChange({
      string: value.string,
      bn: isValidBigNumber(parsedValue, decimals)
        ? ethers.utils.parseUnits(parsedValue, decimals)
        : ethers.constants.Zero,
    });
    // Eslint wants onChange and values to be part of the dependency array, but this causes a loop
  }, [decimals]); //eslint-disable-line

  const onMaxInternal =
    (fraction: number) => (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      if (decimals === undefined) {
        console.error("Decimals must be defined before users interacts");
        return;
      }
      const adjustedMax = max?.mul(fraction * 10_000).div(10_000);
      const minFractionalDisplayDecimals =
        fraction < 1 && fractionalMaxDecimals ? fractionalMaxDecimals : 4;
      const maxFractionalDisplayDecimals =
        fraction < 1 && fractionalMaxDecimals ? fractionalMaxDecimals : 18;
      const maxValue = adjustedMax
        ? bnToDisplayString(
            adjustedMax,
            decimals,
            minFractionalDisplayDecimals,
            maxFractionalDisplayDecimals,
          )
        : "0";

      onChange({
        string: maxValue ?? "0",
        bn: adjustedMax ?? ethers.constants.Zero,
      });
    };

  const rightComponentInternal = (
    <div
      className={classNames({ "hfi-button-collection": fractionalMaxButtons })}
    >
      {!(isBelowThresholdToFit && fractionalMaxButtons) && rightComponent}
      {fractionalMaxButtons?.map(value => (
        <Button
          id={`${rest.id}-${value * 100}`}
          key={value}
          disabled={disabled}
          className={classNames("hfi-input-button", classes.inputButton, {
            "uk-margin-small-left": !!rightComponent,
          })}
          onClick={onMaxInternal(value)}
        >
          {value * 100}%
        </Button>
      ))}
      {(onMax || max) && (
        <Button
          id={`${rest.id}-max`}
          disabled={disabled}
          className={classNames("hfi-input-button", classes.inputButton, {
            "uk-margin-small-left": !fractionalMaxButtons && !!rightComponent,
          })}
          onClick={onMax ?? onMaxInternal(1)}
        >
          {t.max}
        </Button>
      )}
    </div>
  );

  return (
    <div>
      <Input
        ref={ref}
        value={value.string}
        disabled={disabled}
        alert={alertInternal}
        type="text"
        inputMode="decimal"
        onChange={onChangeInternal}
        onKeyDown={onKeyDown ? e => onKeyDown(e, value) : undefined}
        rightComponent={
          !(isBelowThresholdToFit && fractionalMaxButtons)
            ? rightComponentInternal
            : rightComponent
        }
        inline={inline}
        {...rest}
      />
      {isBelowThresholdToFit && fractionalMaxButtons && (
        <div className="uk-margin-small-top uk-flex uk-flex-right">
          {rightComponentInternal}
        </div>
      )}
    </div>
  );
};

export default InputNumber;
