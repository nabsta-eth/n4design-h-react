import React from "react";
import { useProtocolStore } from "../context/Protocol";
import { fxTokenSymbolToCurrency } from "../utils/format";
import { FxToken } from "handle-sdk";
import Select, { Props as SelectProps } from "./Select/Select";
import { SelectOption } from "../types/select";

export type Props = Omit<SelectProps<string>, "options" | "isSelected"> & {
  value: string;
};

const SelectCurrency: React.FC<Props> = props => {
  const { value, ...rest } = props;
  const { fxTokens } = useProtocolStore();
  if (!fxTokens) {
    return null;
  }
  const options: SelectOption<string>[] = fxTokens?.map((fxToken: FxToken) => {
    return {
      item: fxToken.symbol,
      label: fxTokenSymbolToCurrency(fxToken.symbol),
      offset: 2,
      icon: {
        type: "spritesheet",
        value: fxToken.symbol,
      },
    };
  });
  return (
    <Select
      options={options}
      isSelected={(token: string) => token === value}
      {...rest}
    />
  );
};

export default SelectCurrency;
