import { ethers } from "ethers";
import React from "react";
import { Network } from "handle-sdk";
import { useAccount } from "../context/Account";
import { useSigner } from "@handle-fi/react-components/dist/context/UserWallet";
import { Erc20__factory } from "../contracts";
import { getMockSigner } from "@handle-fi/react-components/dist/utils/web3";
import { useToken } from "../context/TokenManager";
import useSendTransaction from "./useSendTransaction";
import { getAllowanceNotifications } from "../config/notifications";

export type Allowance = {
  allowance: ethers.BigNumber | undefined;
  updatingAllowance: boolean;
  updateAllowance: (amount: ethers.BigNumber) => Promise<void>;
  fetchAllowance: () => Promise<void>;
};

const useAllowance = (
  tokenSymbol: string | undefined,
  spender: string | undefined,
  network: Network | undefined,
): Allowance => {
  const signer = useSigner();
  const account = useAccount();
  const { sendTransaction, sendingTransaction } = useSendTransaction();
  const [allowance, setAllowance] = React.useState<ethers.BigNumber>();

  const token = useToken(tokenSymbol, network);

  const fetchAllowance = React.useCallback(async () => {
    if (!account || !token || !spender || !network) {
      return;
    }
    if (token.extensions?.isNative) {
      setAllowance(ethers.constants.MaxUint256);
    } else {
      const contract = Erc20__factory.connect(
        token.address,
        getMockSigner(network),
      );
      contract.allowance(account, spender).then(setAllowance);
    }
  }, [account, spender, token, network]);

  const updateAllowance = React.useCallback(
    async (amount: ethers.BigNumber) => {
      if (
        !account ||
        !token ||
        token.extensions?.isNative ||
        !network ||
        !spender ||
        !signer
      ) {
        return;
      }
      const contract = Erc20__factory.connect(token.address, signer);

      await sendTransaction(
        gasPrice => contract.approve(spender, amount, { gasPrice }),
        getAllowanceNotifications(token),
        {
          callback: fetchAllowance,
        },
      );
    },
    [account, token, network, spender, signer, fetchAllowance, sendTransaction],
  );

  React.useEffect(() => {
    setAllowance(undefined);
    fetchAllowance();
  }, [fetchAllowance]);

  return {
    allowance,
    updatingAllowance: sendingTransaction,
    updateAllowance,
    fetchAllowance,
  };
};

export default useAllowance;
