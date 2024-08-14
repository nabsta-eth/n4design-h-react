import React from "react";
import SelectToken, { Props as SelectTokenProps } from "./SelectToken";
import { fxTokensSDK } from "../context/Protocol";

type Props = Omit<SelectTokenProps<string>, "options" | "includeNative">;

const SelectFxToken: React.FC<Props> = (props: Props) => {
  return (
    <SelectToken
      options={fxTokensSDK.tokens.map(token => token.symbol)}
      {...props}
    />
  );
};

export default SelectFxToken;
