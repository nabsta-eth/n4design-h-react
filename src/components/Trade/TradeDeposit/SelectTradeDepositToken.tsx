import React from "react";
import SelectToken, { Props as TokenSelectProps } from "../../SelectToken";
import { TRADE_DEPOSIT_TOKENS } from "../../../config/trade";
import { useConnectedNetwork } from "@handle-fi/react-components/dist/context/UserWallet";
import { getTradeNetworkOrNull } from "../../../context/Trade";

export type DepositTokenSymbol = (typeof TRADE_DEPOSIT_TOKENS)[number];

type Props = Omit<
  TokenSelectProps<DepositTokenSymbol>,
  "options" | "network"
> & {
  sort?: boolean;
};

const SelectTradeDepositToken: React.FC<Props> = (props: Props) => {
  const tradeNetwork = getTradeNetworkOrNull(useConnectedNetwork());
  if (!tradeNetwork) {
    return <></>;
  }
  return (
    <SelectToken
      options={TRADE_DEPOSIT_TOKENS}
      network={tradeNetwork}
      useImageBackground
      sort
      {...props}
    />
  );
};

export default SelectTradeDepositToken;
