import React from "react";
import { MAX_CONVERT_TOKENS_TO_DISPLAY } from "../config/convert";
import { useAllTokens } from "../context/TokenManager";
import { useBalances } from "../context/UserBalances";
import { useConnectedNetwork } from "@handle-fi/react-components/dist/context/UserWallet";
import TokenSelect, { Props as TokenSelectProps } from "./SelectToken";

type Props = Omit<TokenSelectProps<string>, "options"> & {
  displayOptionsWithBalance?: boolean;
};

const SelectEveryToken: React.FC<Props> = (props: Props) => {
  const {
    network,
    customBalances,
    displayOptions,
    displayOptionsWithBalance,
    onChange,
    ...rest
  } = props;
  const connectedNetwork = useConnectedNetwork();
  const walletBalances = useBalances(network);
  const balances = customBalances || walletBalances;

  const tokensWithBalances = Object.keys(balances).filter((symbol: string) =>
    balances[symbol]?.gt(0),
  );
  const tokensWithNoBalances = Object.keys(balances).filter((symbol: string) =>
    balances[symbol]?.eq(0),
  );

  const internalDisplayOptions = React.useMemo(() => {
    if (connectedNetwork) {
      return displayOptionsWithBalance && !!tokensWithBalances.length
        ? tokensWithBalances
        : [...tokensWithBalances, ...tokensWithNoBalances];
    } else {
      return displayOptions;
    }
  }, [
    connectedNetwork,
    displayOptions,
    displayOptionsWithBalance,
    tokensWithBalances,
    tokensWithNoBalances,
  ]);

  const options = useAllTokens(network);

  const symbols = React.useMemo(() => {
    return options?.map(({ symbol }) => symbol);
  }, [options]);

  return (
    <TokenSelect
      options={symbols || []}
      network={network}
      withSearch={true}
      searchPlaceholder="enter address or symbol/name"
      displayName={true}
      customBalances={customBalances}
      displayOptions={internalDisplayOptions}
      maxDisplayOptions={MAX_CONVERT_TOKENS_TO_DISPLAY}
      onChange={onChange}
      useImageBackground={true}
      {...rest}
    />
  );
};

export default SelectEveryToken;
