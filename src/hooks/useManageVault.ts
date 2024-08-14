import * as React from "react";
import { ethers } from "ethers";
import { CollateralSymbol, Vault, VaultController } from "handle-sdk";
import useVaultSDK from "../hooks/useVaultSdk";
import {
  useConnectedNetwork,
  useSigner,
} from "@handle-fi/react-components/dist/context/UserWallet";
import { CollateralSymbolWithNative } from "handle-sdk";
import { useAccount } from "../context/Account";
import { useProtocolStore } from "../context/Protocol";
import useSendTransaction from "./useSendTransaction";
import {
  getBorrowNotifications,
  getWithdrawCollateralNotifications,
  getRepayNotifications,
} from "../config/notifications";
import { useToken } from "../context/TokenManager";
import { useBalance } from "../context/UserBalances";

const useManageVault = (data: {
  action: string;
  vault?: Vault;
  depositCollateral: CollateralSymbolWithNative;
  additionalDebt: ethers.BigNumber | undefined;
  additionalCollateral: ethers.BigNumber | undefined;
  reduceDebtBy: ethers.BigNumber | undefined;
  withdrawCollateral: CollateralSymbol;
  reduceCollateralBy: ethers.BigNumber | undefined;
}) => {
  const {
    action,
    vault,
    depositCollateral,
    additionalDebt,
    additionalCollateral,
    reduceDebtBy,
    withdrawCollateral,
    reduceCollateralBy,
  } = data;

  const { collaterals, fxTokens, protocolParameters } = useProtocolStore();
  const vaultSDK = useVaultSDK();
  const signer = useSigner();
  const account = useAccount();

  const fxToken = fxTokens?.find(fx => fx.symbol === vault?.fxToken.symbol);
  const network = useConnectedNetwork();
  const fxTokenExtended = useToken(vault?.fxToken.symbol, network);

  const balance = useBalance({
    tokenSymbol: fxToken?.symbol,
    network: "arbitrum",
  });

  const vaultController = React.useMemo(() => {
    if (
      !vault ||
      !collaterals ||
      !collaterals.length ||
      !protocolParameters ||
      !fxToken
    ) {
      return undefined;
    }
    // this will error in the VaultController with a div by zero error
    if (fxToken.price.isZero()) throw new Error("FxToken price is zero");
    return new VaultController(vault, protocolParameters, fxToken, collaterals);
  }, [vault, protocolParameters, collaterals, fxToken]);

  const [currentVault, setCurrentVault] = React.useState<Vault>();
  const [futureVault, setFutureVault] = React.useState<Vault>();
  const { sendTransaction } = useSendTransaction();

  const depositCollateralToken = useToken(depositCollateral, "arbitrum");
  const withdrawCollateralToken = useToken(withdrawCollateral, "arbitrum");

  React.useEffect(() => {
    if (!vaultController) {
      return;
    }

    setCurrentVault(vaultController.vault);
    setFutureVault(vaultController.vault);
  }, [vaultController]);

  React.useEffect(() => {
    if (!vaultController) {
      return;
    }

    setCurrentVault(vaultController.vault);
    setFutureVault(vaultController.vault);
  }, [action, vaultController]);

  React.useEffect(() => {
    if (vaultController) {
      vaultController.resetCollateral();
      setFutureVault(vaultController.vault);
    }
  }, [depositCollateral, vaultController, setFutureVault]);

  const safeWrapper = React.useCallback(
    (
      value: ethers.BigNumber | undefined,
      onValidated: (bnValue: ethers.BigNumber, vc: VaultController) => void,
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
      vc.addCollateral(
        depositCollateral === "ETH" ? "WETH" : depositCollateral,
        value,
      );
      setFutureVault(vc.vault);
    });
  }, [additionalCollateral, depositCollateral, safeWrapper]);

  React.useEffect(() => {
    safeWrapper(reduceCollateralBy, (value, vc) => {
      vc.removeCollateral(withdrawCollateral, value);
      setFutureVault(vc.vault);
    });
  }, [reduceCollateralBy, withdrawCollateral, safeWrapper]);

  const borrow = React.useCallback(async () => {
    if (
      !vaultSDK ||
      !currentVault ||
      !futureVault ||
      !signer ||
      !account ||
      !depositCollateralToken ||
      !fxTokenExtended
    ) {
      return;
    }

    const currentVaultCollateral = currentVault.collateral.find(
      c =>
        c.symbol === (depositCollateral === "ETH" ? "WETH" : depositCollateral),
    );
    const futureVaultCollateral = futureVault.collateral.find(
      c =>
        c.symbol === (depositCollateral === "ETH" ? "WETH" : depositCollateral),
    );

    if (!currentVaultCollateral || !futureVaultCollateral) {
      return;
    }

    const fxToken = futureVault.fxToken.symbol;

    const debtChange = futureVault.debt.sub(currentVault.debt);

    const collateralChange = futureVaultCollateral.amount.sub(
      currentVaultCollateral.amount,
    );

    const transaction = (gasPrice: ethers.BigNumber | undefined) =>
      !debtChange.isZero()
        ? vaultSDK.mint(
            {
              amount: debtChange,
              fxToken,
              collateral: !collateralChange.isZero()
                ? {
                    symbol: depositCollateral,
                    amount: collateralChange,
                  }
                : undefined,
            },
            signer,
            { gasPrice },
          )
        : vaultSDK.depositCollateral(
            {
              account,
              fxToken,
              collateral: depositCollateral,
              amount: collateralChange,
            },
            signer,
            { gasPrice },
          );

    await sendTransaction(
      transaction,
      getBorrowNotifications({
        borrowAmount: debtChange,
        borrowToken: fxTokenExtended,
        depositAmount: collateralChange,
        depositToken: depositCollateralToken,
      }),
    );
  }, [
    account,
    depositCollateral,
    currentVault,
    futureVault,
    signer,
    vaultSDK,
    depositCollateralToken,
    sendTransaction,
    fxTokenExtended,
  ]);

  const repay = React.useCallback(async () => {
    if (
      !vaultSDK ||
      !currentVault ||
      !futureVault ||
      !signer ||
      !account ||
      !balance.balance ||
      !fxTokenExtended
    ) {
      return;
    }

    const fxToken = futureVault.fxToken.symbol;

    const amount = futureVault.debt.lte(0)
      ? balance.balance
      : currentVault.debt.sub(futureVault.debt);

    await sendTransaction(
      gasPrice =>
        vaultSDK.burn(
          {
            fxToken,
            amount,
          },
          signer,
          { gasPrice },
        ),
      getRepayNotifications({
        amount: futureVault.debt.lte(0) ? currentVault.debt : amount,
        token: fxTokenExtended,
      }),
    );
  }, [
    account,
    currentVault,
    futureVault,
    signer,
    vaultSDK,
    balance.balance,
    sendTransaction,
    fxTokenExtended,
  ]);

  const withdraw = React.useCallback(async () => {
    if (
      !vaultSDK ||
      !currentVault ||
      !futureVault ||
      !signer ||
      !account ||
      !withdrawCollateralToken ||
      !fxTokenExtended
    ) {
      return;
    }

    const fxToken = futureVault.fxToken.symbol;

    const currentVaultCollateral = currentVault.collateral.find(
      c => c.symbol === withdrawCollateral,
    );
    const futureVaultCollateral = futureVault.collateral.find(
      c => c.symbol === withdrawCollateral,
    );

    if (!currentVaultCollateral || !futureVaultCollateral) {
      return;
    }

    const amount = currentVaultCollateral.amount.sub(
      futureVaultCollateral.amount,
    );

    await sendTransaction(
      gasPrice =>
        vaultSDK.withdrawCollateral(
          {
            account,
            fxToken,
            collateral: withdrawCollateral,
            amount,
          },
          signer,
          { gasPrice },
        ),
      getWithdrawCollateralNotifications({
        amount,
        token: withdrawCollateralToken,
      }),
    );
  }, [
    withdrawCollateral,
    account,
    currentVault,
    futureVault,
    signer,
    vaultSDK,
    withdrawCollateralToken,
    sendTransaction,
    fxTokenExtended,
  ]);

  return {
    currentVault,
    futureVault,
    borrow,
    repay,
    withdraw,
  };
};

export default useManageVault;
