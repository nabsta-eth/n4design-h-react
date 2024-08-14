import React from "react";
import SelectToken, { Props as SelectTokenProps } from "./SelectToken";
import { bridgeSDK, protocolSDK } from "../context/Protocol";
import { FxTokenAndForexSymbol } from "../types/tokens";

type Props = Omit<
  SelectTokenProps<FxTokenAndForexSymbol>,
  "options" | "includeNative"
>;

/// Token symbol array.
const options = [
  ...Object.keys(bridgeSDK.config.fxTokenAddresses),
  protocolSDK.forexToken.symbol,
];

const SelectBridgeToken: React.FC<Props> = (props: Props) => {
  return <SelectToken options={options} {...props} />;
};

export default SelectBridgeToken;
