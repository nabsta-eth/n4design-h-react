import { ethers } from "ethers";
import React from "react";
import { InputNumberValue } from "../components/InputNumber/InputNumber";
import { addWholeNumberSeparatorsToNumberString } from "../utils/format";

export type InputNumberState = {
  value: InputNumberValue;
  onChange: (newValue: InputNumberValue) => void;
  onChangeBN: (newValue: ethers.BigNumber, decimals: number) => void;
  reset: () => void;
};

export const getInputNumberValue = (
  newValue: ethers.BigNumber,
  decimals: number,
): InputNumberValue => {
  return {
    string: addWholeNumberSeparatorsToNumberString(
      ethers.utils.formatUnits(newValue, decimals),
    ),
    bn: newValue,
  };
};

const useInputNumberState = (
  initialValue?: InputNumberValue,
): InputNumberState => {
  const [value, setValue] = React.useState<InputNumberValue>(
    initialValue || { string: "", bn: ethers.constants.Zero },
  );

  const onChange = React.useCallback(
    (newValue: InputNumberValue) => {
      setValue(newValue);
    },
    [setValue],
  );

  const reset = React.useCallback(() => {
    setValue({ string: "", bn: ethers.constants.Zero });
  }, []);

  const onChangeBN = React.useCallback(
    (newValue: ethers.BigNumber, decimals: number) => {
      setValue({
        string: addWholeNumberSeparatorsToNumberString(
          ethers.utils.formatUnits(newValue, decimals),
        ),
        bn: newValue,
      });
    },
    [],
  );

  return {
    value,
    onChange,
    onChangeBN,
    reset,
  };
};

export default useInputNumberState;
