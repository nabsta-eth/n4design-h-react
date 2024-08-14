import * as React from "react";
import { CollateralSymbol, CollateralSymbolWithNative } from "handle-sdk";
import useInputNumberState from "./useInputNumberState";
import { InputNumberValue } from "../components/InputNumber/InputNumber";

const useVaultInputsState = () => {
  const [sendingTransaction, setSendingTransaction] =
    React.useState<boolean>(false);
  const additionalDebtState = useInputNumberState();
  const additionalCollateralState = useInputNumberState();
  const reduceDebtByState = useInputNumberState();
  const reduceCollateralByState = useInputNumberState();

  const [selectedDepositCollateral, setSelectedCollateral] =
    React.useState<CollateralSymbolWithNative>("ETH");

  const [selectedWithdrawCollateral, setSelectedWithdrawCollateral] =
    React.useState<CollateralSymbol>("WETH");

  const onChangeAdditionalDebt = React.useCallback(
    (value: InputNumberValue) => {
      additionalDebtState.onChange(value);
      reduceDebtByState.reset();
      reduceCollateralByState.reset();
    },
    [additionalDebtState, reduceDebtByState, reduceCollateralByState],
  );

  const onChangeAdditionalCollateral = React.useCallback(
    (value: InputNumberValue) => {
      additionalCollateralState.onChange(value);
      reduceDebtByState.reset();
      reduceCollateralByState.reset();
    },
    [additionalCollateralState, reduceDebtByState, reduceCollateralByState],
  );

  const onChangeReduceDebtBy = React.useCallback(
    (value: InputNumberValue) => {
      reduceDebtByState.onChange(value);
      additionalDebtState.reset();
      additionalCollateralState.reset();
      reduceCollateralByState.reset();
    },
    [
      reduceDebtByState,
      additionalDebtState,
      additionalCollateralState,
      reduceCollateralByState,
    ],
  );

  const onChangeReduceCollateralBy = React.useCallback(
    (value: InputNumberValue) => {
      reduceCollateralByState.onChange(value);
      reduceDebtByState.reset();
      additionalDebtState.reset();
      additionalCollateralState.reset();
    },
    [
      reduceCollateralByState,
      reduceDebtByState,
      additionalDebtState,
      additionalCollateralState,
    ],
  );

  return {
    sendingTransaction,
    additionalDebtState,
    additionalCollateralState,
    reduceDebtByState,
    reduceCollateralByState,
    selectedDepositCollateral,
    selectedWithdrawCollateral,
    setSendingTransaction,
    onChangeAdditionalDebt,
    onChangeAdditionalCollateral,
    onChangeReduceDebtBy,
    onChangeReduceCollateralBy,
    setSelectedWithdrawCollateral,
    setSelectedCollateral,
  };
};

export default useVaultInputsState;
