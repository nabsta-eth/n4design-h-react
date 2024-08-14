import * as React from "react";
import { ethers } from "ethers";
import {
  CollateralSymbol,
  SingleCollateralVaultNetwork,
  SingleCollateralVaultSymbol,
  Network,
  BridgeNetwork,
} from "handle-sdk";
import { useAccount } from "../context/Account";
import {
  useConnectedNetwork,
  useSigner,
} from "@handle-fi/react-components/dist/context/UserWallet";
import { getMockSigner } from "@handle-fi/react-components/dist/utils/web3";
import { collateralsSDK, fxTokensSDK, bridgeSDK } from "../context/Protocol";
import { Allowance } from "./useAllowance";
import { FxTokenAndForexSymbol } from "../types/tokens";
import useSendTransaction from "./useSendTransaction";
import { getAllowanceNotifications } from "../config/notifications";
import { useToken } from "../context/TokenManager";

const useAllowanceFromSDK = <T extends string | undefined>(
  token: T | undefined,
  network: Network,
  getAllowance: (
    token: T,
    account: string,
    signer: ethers.Signer,
  ) => Promise<ethers.BigNumber>,
  setAllowance: (
    token: T,
    amount: ethers.BigNumber,
    signer: ethers.Signer,
  ) => Promise<ethers.ContractTransaction>,
): Allowance => {
  const account = useAccount();
  const signer = useSigner();
  const { sendTransaction, sendingTransaction } = useSendTransaction();
  const [allowance, setAllowanceState] = React.useState<ethers.BigNumber>();
  const connectedNetwork = useConnectedNetwork();
  const tokenInfo = useToken(token, connectedNetwork);

  const fetchAllowance = React.useCallback(async () => {
    if (!account || !token) {
      return;
    }

    const mockSigner = getMockSigner(network);
    const allowance = await getAllowance(token, account, mockSigner);
    setAllowanceState(allowance);
  }, [token, account, network, getAllowance]);

  const updateAllowance = React.useCallback(
    async (amount: ethers.BigNumber) => {
      if (!signer || !tokenInfo) return;
      await sendTransaction(
        // token is found from the symbol so has to have a symbol with type T
        () => setAllowance(tokenInfo.symbol as T, amount, signer),
        getAllowanceNotifications(tokenInfo),
      );
      await fetchAllowance();
    },
    [signer, sendTransaction, tokenInfo, fetchAllowance, setAllowance],
  );

  React.useEffect(() => {
    setAllowanceState(undefined);
    fetchAllowance();
  }, [fetchAllowance]);

  return {
    allowance,
    updatingAllowance: sendingTransaction,
    updateAllowance,
    fetchAllowance,
  };
};

export const useCollateralDepositAllowance = (
  collateral: CollateralSymbol | undefined,
  action: "deposit" | "mintAndDeposit",
) => {
  const getAllowance = React.useCallback(
    (symbol: CollateralSymbol, account: string, signer: ethers.Signer) =>
      collateralsSDK.getDepositAllowance(symbol, account, action, signer),
    [action],
  );

  const setAllowance = React.useCallback(
    (
      symbol: CollateralSymbol,
      amount: ethers.BigNumber,
      signer: ethers.Signer,
    ) => collateralsSDK.setDepositAllowance(symbol, amount, action, signer),
    [action],
  );

  return useAllowanceFromSDK(
    collateral,
    "arbitrum",
    getAllowance,
    setAllowance,
  );
};

export const useRepayAllowance = (fxToken: string | undefined) =>
  useAllowanceFromSDK(
    fxToken,
    "arbitrum",
    fxTokensSDK.getRepayAllowance,
    fxTokensSDK.setRepayAllowance,
  );

export const useSingleCollateralDepositAllowance = (
  vaultSymbol: SingleCollateralVaultSymbol | undefined,
  network: SingleCollateralVaultNetwork,
) => {
  const getAllowance = React.useCallback(
    (
      symbol: SingleCollateralVaultSymbol,
      account: string,
      signer: ethers.Signer,
    ) =>
      collateralsSDK.getSingleCollateralDepositAllowance(
        symbol,
        account,
        network,
        signer,
      ),
    [network],
  );

  const setAllowance = React.useCallback(
    (
      symbol: SingleCollateralVaultSymbol,
      amount: ethers.BigNumber,
      signer: ethers.Signer,
    ) =>
      collateralsSDK.setSingleCollateralDepositAllowance(
        symbol,
        amount,
        network,
        signer,
      ),
    [network],
  );

  return useAllowanceFromSDK(vaultSymbol, network, getAllowance, setAllowance);
};

export const useSingleCollateralRepayAllowance = (
  fxToken: string | undefined,
  network: SingleCollateralVaultNetwork,
) => {
  const getAllowance = React.useCallback(
    (fxToken: string, account: string, signer: ethers.Signer) =>
      fxTokensSDK.getSingleCollateralRepayAllowance(
        fxToken,
        account,
        network,
        signer,
      ),
    [network],
  );

  const setAllowance = React.useCallback(
    (fxToken: string, amount: ethers.BigNumber, signer: ethers.Signer) =>
      fxTokensSDK.setSingleCollateralRepayAllowance(
        fxToken,
        amount,
        network,
        signer,
      ),
    [network],
  );

  return useAllowanceFromSDK(fxToken, network, getAllowance, setAllowance);
};

export const useBridgeDepositAllowance = (
  token: FxTokenAndForexSymbol | undefined,
  network: BridgeNetwork,
) => {
  const getAllowance = React.useCallback(
    (token: FxTokenAndForexSymbol, account: string, signer: ethers.Signer) =>
      bridgeSDK.getDepositAllowance(account, token, network, signer),
    [network],
  );

  const setAllowance = React.useCallback(
    (
      fxToken: FxTokenAndForexSymbol,
      amount: ethers.BigNumber,
      signer: ethers.Signer,
    ) => bridgeSDK.setDepositAllowance(fxToken, network, amount, signer),
    [network],
  );

  return useAllowanceFromSDK(token, network, getAllowance, setAllowance);
};
