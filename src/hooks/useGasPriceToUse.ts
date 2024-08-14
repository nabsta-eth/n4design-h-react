import { ethers } from "ethers";
import { useMemo } from "react";
import { config } from "../config";
import {
  useConnectedNetwork,
  useUserWalletStore,
} from "@handle-fi/react-components/dist/context/UserWallet";
import {
  isCustomGasPrice,
  TransactionSpeedPreset,
} from "../types/transaction-speed";

const useGasPriceToUse = (
  overrideTransactionSpeed?: TransactionSpeedPreset,
): ethers.BigNumber | undefined => {
  const { currentGasPrice, transactionSpeed } = useUserWalletStore();
  const network = useConnectedNetwork();
  return useMemo(() => {
    const txSpeed = overrideTransactionSpeed || transactionSpeed;

    if (isCustomGasPrice(txSpeed)) {
      return ethers.utils.parseUnits(txSpeed.toString(), "gwei");
    }

    const multiplier = config.transactionSpeedMultipliers[txSpeed];
    return currentGasPrice?.mul(Math.floor(multiplier * 10)).div(10);
  }, [currentGasPrice, transactionSpeed, overrideTransactionSpeed, network]);
};

export default useGasPriceToUse;
