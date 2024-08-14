import * as React from "react";
import { ethers } from "ethers";
import {
  SingleCollateralVaultController,
  SingleCollateralVault,
  SingleCollateralVaultNetwork,
} from "handle-sdk";
import useVaultSDK from "../hooks/useVaultSdk";
import { useSigner } from "@handle-fi/react-components/dist/context/UserWallet";
import { useAccount } from "../context/Account";
import { useProtocolStore } from "../context/Protocol";
import useSingleCollateralVaultDepositApproval from "./useSingleCollateralVaultDepositApproval";
import useSendTransaction from "./useSendTransaction";
import { DEFAULT_NOTIFICATIONS } from "../config/notifications";

const useManageSingleCollateralVault = (
  data: {
    vault?: SingleCollateralVault;
    additionalDebt: ethers.BigNumber | undefined;
    additionalCollateral: ethers.BigNumber | undefined;
    reduceDebtBy: ethers.BigNumber | undefined;
    reduceCollateralBy: ethers.BigNumber | undefined;
  },
  network: SingleCollateralVaultNetwork,
) => {
  const {
    vault,
    additionalDebt,
    additionalCollateral,
    reduceDebtBy,
    reduceCollateralBy,
  } = data;

  const vaultSDK = useVaultSDK();
  const signer = useSigner();
  const account = useAccount();
  const { fxTokens } = useProtocolStore();

  const [signedDepositApproval, signDepositApproval] =
    useSingleCollateralVaultDepositApproval(account, network);

  const vaultController = React.useMemo(() => {
    if (!vault || !fxTokens) {
      return undefined;
    }

    const fxToken = fxTokens?.find(fx => fx.symbol === vault.fxToken.symbol);

    if (!fxToken) {
      return;
    }

    return new SingleCollateralVaultController(vault, fxToken);
  }, [vault, fxTokens]);

  const [currentVault, setCurrentVault] =
    React.useState<SingleCollateralVault>();
  const [futureVault, setFutureVault] = React.useState<SingleCollateralVault>();
  const { sendTransaction } = useSendTransaction();

  React.useEffect(() => {
    if (!vaultController) {
      return;
    }

    setCurrentVault(vaultController.vault);
    setFutureVault(vaultController.vault);
  }, [vaultController]);

  const safeWrapper = React.useCallback(
    (
      value: ethers.BigNumber | undefined,
      onValidated: (
        bnValue: ethers.BigNumber,
        vc: SingleCollateralVaultController,
      ) => void,
    ) => {
      if (!vaultController || !currentVault) {
        return;
      }

      if (!value) {
        setFutureVault(currentVault);
        return;
      }

      onValidated(value, vaultController);
    },
    [vaultController, currentVault],
  );

  React.useEffect(() => {
    safeWrapper(additionalDebt, (value, vc) => {
      vc.addDebt(value);
      setFutureVault(vc.vault);
    });
  }, [additionalDebt, safeWrapper]);

  React.useEffect(() => {
    safeWrapper(reduceDebtBy, (value, vc) => {
      vc.removeDebt(value);
      setFutureVault(vc.vault);
    });
  }, [reduceDebtBy, safeWrapper]);

  React.useEffect(() => {
    safeWrapper(additionalCollateral, (value, vc) => {
      vc.addCollateral(value);
      setFutureVault(vc.vault);
    });
  }, [additionalCollateral, safeWrapper]);

  React.useEffect(() => {
    safeWrapper(reduceCollateralBy, (value, vc) => {
      vc.removeCollateral(value);
      setFutureVault(vc.vault);
    });
  }, [reduceCollateralBy, safeWrapper]);

  const borrow = React.useCallback(async () => {
    if (!vaultSDK || !currentVault || !futureVault || !signer || !account) {
      return;
    }

    const mintAmount = futureVault.debt.sub(currentVault.debt);

    const depositAmount = futureVault.collateral.amount.sub(
      currentVault.collateral.amount,
    );

    let approveKashiSignature: ethers.Signature | undefined;

    if (!signedDepositApproval) {
      approveKashiSignature = await signDepositApproval();
    }

    await sendTransaction(
      gasPrice =>
        vaultSDK.mintAndDepositSingleCollateral(
          {
            mintAmount: mintAmount,
            depositAmount: depositAmount,
            network,
            vaultSymbol: currentVault.vaultSymbol,
            approveKashiSignature,
          },
          signer,
          { gasPrice },
        ),
      DEFAULT_NOTIFICATIONS,
    );
  }, [
    account,
    currentVault,
    futureVault,
    signer,
    vaultSDK,
    signedDepositApproval,
    network,
    signDepositApproval,
    sendTransaction,
  ]);

  const repay = React.useCallback(async () => {
    if (!vaultSDK || !currentVault || !futureVault || !signer || !account) {
      return;
    }

    const burnAmount = currentVault.debt.sub(futureVault.debt);

    const withdrawAmount = currentVault.collateral.amount.sub(
      futureVault.collateral.amount,
    );

    await sendTransaction(
      gasPrice =>
        vaultSDK.burnAndWithdrawSingleCollateral(
          {
            network,
            vaultSymbol: currentVault.vaultSymbol,
            burnAmount,
            withdrawAmount,
          },
          signer,
          { gasPrice },
        ),
      DEFAULT_NOTIFICATIONS,
    );
  }, [
    account,
    currentVault,
    futureVault,
    signer,
    network,
    vaultSDK,
    sendTransaction,
  ]);

  return {
    currentVault,
    futureVault,
    network,
    borrow,
    repay,
  };
};

export default useManageSingleCollateralVault;
