import React from "react";
import SelectToken, { Props as TokenSelectProps } from "./SelectToken";
import { CollateralSymbolWithNative, Network } from "handle-sdk";
import { collateralsSDK } from "../context/Protocol";
import { useNativeToken } from "../context/TokenManager";
import { config } from "../config";
import { useUserWalletStore } from "@handle-fi/react-components/dist/context/UserWallet";

// currently collateral is only supported on arbitrum
const NETWORK: Network = "arbitrum";

type Props = Omit<
  TokenSelectProps<CollateralSymbolWithNative>,
  "options" | "network"
> & {
  sort?: boolean;
  includeNative: boolean;
};

const SelectCollateral: React.FC<Props> = (props: Props) => {
  const { isDev } = useUserWalletStore();
  const tokens = !isDev
    ? collateralsSDK.tokens.filter(
        t => !config.disabledCollaterals.includes(t.symbol),
      )
    : collateralsSDK.tokens;
  const native = useNativeToken(NETWORK);
  const options = props.includeNative && native ? [native, ...tokens] : tokens;

  return (
    <SelectToken
      // @ts-ignore This is because native symbol is of type string, but it will be ETH given \
      // the network is arbitrum. This will fit the type CollateralSymbolWithNatuve
      options={options.map(o => o.symbol)}
      network={NETWORK}
      {...props}
    />
  );
};

export default SelectCollateral;
