import React from "react";
import SelectToken, { Props as TokenSelectProps } from "../../SelectToken";
import { TRADE_WITHDRAW_TOKENS } from "../../../config/trade";
import { useConnectedNetwork } from "@handle-fi/react-components/dist/context/UserWallet";
import { getTradeNetworkOrNull } from "../../../context/Trade";

export type WithdrawTokenSymbol = (typeof TRADE_WITHDRAW_TOKENS)[number];

type Props = Omit<
  TokenSelectProps<WithdrawTokenSymbol>,
  "options" | "network"
> & {
  sort?: boolean;
};

const SelectTradeWithdrawToken: React.FC<Props> = (props: Props) => {
  const tradeNetwork = getTradeNetworkOrNull(useConnectedNetwork());
  if (!tradeNetwork) {
    return <></>;
  }
  return (
    <SelectToken
      options={TRADE_WITHDRAW_TOKENS}
      network={tradeNetwork}
      useImageBackground
      sort
      {...props}
    />
  );
};

export default SelectTradeWithdrawToken;
