import * as React from "react";
import { Vault, SingleCollateralVault, Network } from "handle-sdk";
import { ethers } from "ethers";
import { useBalance, useUserBalanceStore } from "../context/UserBalances";
import { InputNumberValue } from "./InputNumber/InputNumber";
import { InputNumberState } from "../hooks/useInputNumberState";
import { useAccount } from "../context/Account";
import {
  useConnectedAccount,
  useConnectedNetwork,
} from "@handle-fi/react-components/dist/context/UserWallet";
import { Allowance } from "../hooks/useAllowance";
import { InputNumberWithBalance } from ".";
import { bnToDisplayString } from "../utils/format";
import ButtonSmart from "./ButtonSmart/ButtonSmart";
import Button from "./Button";
import { isSameAddress } from "handle-sdk/dist/utils/general";

type Props = {
  vault: Vault | SingleCollateralVault | undefined;
  fxTokenSymbol: string | undefined;
  sendingTransaction: boolean;
  network: Network;
  reduceDebtBy: InputNumberState;
  futureVault: Vault | SingleCollateralVault | undefined;
  allowance: Allowance;
  setSendingTransaction: (sendingTransaction: boolean) => void;
  onChangeReduceDebtBy: (value: InputNumberValue) => void;
  fetchVault: () => Promise<void>;
  repay: () => Promise<void>;
};

const RepayForm: React.FC<Props> = props => {
  const account = useAccount();
  const connectedAccount = useConnectedAccount();
  const network = useConnectedNetwork();
  const { refreshBalance } = useUserBalanceStore();

  const { balance } = useBalance({
    tokenSymbol: props.fxTokenSymbol,
    network: props.network,
  });
  const { allowance, updateAllowance, fetchAllowance } = props.allowance;

  const disableInputs = !props.futureVault || props.sendingTransaction;
  const hasEnoughFx = balance && balance.gte(props.reduceDebtBy.value.bn);

  const sufficientAllowance =
    !!allowance && allowance.gte(props.reduceDebtBy.value.bn);

  const meetsMinimumDebt =
    !!props.futureVault?.debt.lte(0) ||
    !!props.futureVault?.debt.gte(props.futureVault.minimumDebt);

  const isCorrectAccount = isSameAddress(connectedAccount, account);
  const isCorrectNetwork = props.network === network;

  const canRepay =
    isCorrectAccount &&
    isCorrectNetwork &&
    !props.reduceDebtBy.value.bn.isZero() &&
    hasEnoughFx &&
    meetsMinimumDebt &&
    !disableInputs;

  const repayButtonText = !connectedAccount
    ? "connect wallet"
    : !isCorrectAccount
    ? "change accounts"
    : !isCorrectNetwork
    ? `change network to ${props.network}`
    : !hasEnoughFx
    ? "insufficient balance"
    : !meetsMinimumDebt && !props.reduceDebtBy.value.bn.isZero()
    ? `minimum debt is ${
        props.futureVault
          ? ethers.utils.formatEther(props.futureVault?.minimumDebt)
          : "-"
      }`
    : props.sendingTransaction
    ? "processing..."
    : canRepay &&
      allowance &&
      !sufficientAllowance &&
      props.reduceDebtBy.value.bn.gt(0)
    ? `approve ${props.fxTokenSymbol}`
    : "repay";

  const onClick = async () => {
    props.setSendingTransaction(true);
    try {
      if (sufficientAllowance) {
        await props.repay();
        await Promise.all([props.fetchVault(), refreshBalance(props.network)]);
        props.reduceDebtBy.reset();
      } else {
        await updateAllowance(ethers.constants.MaxInt256);
        await fetchAllowance();
      }
    } catch (error) {
      // dont do anything here as it is handled in sendTransaction
    }
    props.setSendingTransaction(false);
  };

  const displayDebt = props.vault && bnToDisplayString(props.vault.debt, 18, 2);

  const singleVaultMax = () => {
    if (!props.vault || !balance)
      throw new Error("Single Vault: no vault detected");
    // if the debt is greater than the user balance, fill the balance
    if (props.vault.debt.gt(balance)) {
      const repayThreshold = props.vault.debt.sub(ethers.constants.WeiPerEther);
      const repayAmount = balance.gt(repayThreshold) ? repayThreshold : balance;
      const string = ethers.utils.formatUnits(
        repayAmount,
        props.vault.fxToken.decimals,
      );
      return props.onChangeReduceDebtBy({ string, bn: repayAmount });
    }
    // if not, repay the full loan
    const string = ethers.utils.formatUnits(
      props.vault.debt,
      props.vault.fxToken.decimals,
    );
    if (props.vault.debt.lte(0))
      return console.warn("Single Vault: collateral ratio too low");
    props.onChangeReduceDebtBy({ string, bn: props.vault.debt });
  };

  const multiVaultMax = () => {
    if (!balance || !props.vault || !displayDebt)
      throw new Error("Multi vault: no vault, balance, or displayDebt found");
    const maxValidRepayAmount = balance.gte(props.vault.debt)
      ? props.vault.debt
      : balance;
    props.onChangeReduceDebtBy({
      // The actual value is the user's balance instead of the vault debt.
      // This is needed because interest accrues every second, so if
      // the user balance is used the contract has access to more funds
      // than it needs, being able to fully repay the debt and
      // "returning" the change.
      bn: balance,
      string: ethers.utils.formatEther(maxValidRepayAmount),
    });
  };

  const maxButton = (
    <div className="uk-flex">
      <Button
        className="hfi-input-button"
        disabled={!balance || !props.vault}
        onClick={
          !Array.isArray(props.vault?.collateral)
            ? singleVaultMax
            : multiVaultMax
        }
      >
        max
      </Button>
    </div>
  );

  return (
    <form key="repayForm" noValidate autoComplete="off">
      <InputNumberWithBalance
        id="fx-amount"
        network={props.network}
        label="amount"
        rightLabel={displayDebt && `debt: ${displayDebt}`}
        value={props.reduceDebtBy.value}
        tokenSymbol={props.fxTokenSymbol}
        onChange={props.onChangeReduceDebtBy}
        disabled={disableInputs}
        placeholder="amount to repay"
        rightComponent={maxButton}
        disableMaxButton={true}
      />

      <ButtonSmart
        className="uk-margin-top"
        network={props.network}
        expand={true}
        onClick={onClick}
        disabled={!canRepay}
        alert={!canRepay && !props.reduceDebtBy.value.bn.isZero()}
      >
        {repayButtonText}
      </ButtonSmart>
    </form>
  );
};

export default RepayForm;
