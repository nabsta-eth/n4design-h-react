import { ethers } from "ethers";
import { ConvertUtils, Network, TokenInfo } from "handle-sdk";
import React from "react";
import { Erc20__factory } from "../contracts";
import { getProvider } from "@handle-fi/react-components/dist/utils/web3";

export const useConvertAllowance = (
  allowanceTarget: ConvertUtils.AllowanceTarget | undefined,
  network: Network,
  user: string | undefined,
) => {
  const [tokensToApprove, setTokensToApprove] = React.useState<TokenInfo[]>();

  const refresh = React.useCallback(() => {
    if (!allowanceTarget || !user) return;
    setTokensToApprove(undefined);
    (async () => {
      const allowances = await Promise.all(
        allowanceTarget.map(async target => {
          // TODO remove this once 0.5.0 is out
          if (target.token.extensions?.isNative)
            return {
              required: ethers.constants.Zero,
              amount: ethers.constants.Zero,
              token: target.token,
            };
          const allowance = {
            required: target.amount,
            amount: await Erc20__factory.connect(
              target.token.address,
              getProvider(network),
            ).allowance(user, target.target),
            token: target.token,
          };
          return allowance;
        }),
      );

      setTokensToApprove(
        allowances
          .filter(allowance => allowance.amount.lt(allowance.required))
          .map(allowance => allowance.token),
      );
    })();
  }, [JSON.stringify(allowanceTarget), network, user]);

  React.useEffect(refresh, [refresh]);

  return {
    tokensToApprove,
    refresh,
  };
};
