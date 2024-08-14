import React from "react";
import { InputAddressValue } from "../components/InputAddress";

export type InputNumberState = {
  value: InputAddressValue;
  onChange: (newValue: InputAddressValue) => void;
  reset: () => void;
};

const useInputAddressState = (
  initialValue?: InputAddressValue,
): InputNumberState => {
  const [value, setValue] = React.useState<InputAddressValue>(
    initialValue || { value: "", address: undefined },
  );

  const onChange = React.useCallback(
    (newValue: InputAddressValue) => {
      setValue(newValue);
    },
    [setValue],
  );

  const reset = React.useCallback(() => {
    setValue({ value: "", address: undefined });
  }, []);

  return {
    value,
    onChange,
    reset,
  };
};

export default useInputAddressState;
