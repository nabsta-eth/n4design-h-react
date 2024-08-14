import {
  Vault,
  Collateral,
  SingleCollateralVault,
  Network,
  CollateralSymbolWithNative,
} from "handle-sdk";
import { ethers } from "ethers";
import InputNumber, { InputNumberValue } from "../InputNumber/InputNumber";
import { InputNumberState } from "../../hooks/useInputNumberState";
import { useAccount } from "../../context/Account";
import {
  useConnectedAccount,
  useConnectedNetwork,
} from "@handle-fi/react-components/dist/context/UserWallet";
import { Balance, useUserBalanceStore } from "../../context/UserBalances";
import SelectCollateral from "../SelectCollateral";
import { bnToDisplayString } from "../../utils/format";
import ButtonSmart from "../ButtonSmart/ButtonSmart";
import { VaultCollateralToken } from "handle-sdk/dist/types/vaults";
import { KASHI_COLLATERAL_RATIO_TOLERANCE } from "../../config/kashi";
import { DEFAULT_MIN_CR } from "../../config/constants";
import React from "react";
import classNames from "classnames";
import classes from "./WithdrawCollateralForm.module.scss";
import CrSlider from "../CrSlider/CrSlider";
import { isSameAddress } from "handle-sdk/dist/utils/general";

type SelectedCollateral<T extends string> = {
  symbol: T;
  decimals: number;
  deposited: ethers.BigNumber;
};

type CollateralWithDeposited = Collateral & {
  deposited: ethers.BigNumber | undefined;
};

type Props<T extends string> = {
  reduceCollateralBy: InputNumberState;
  vault: Vault | SingleCollateralVault | undefined;
  futureVault: Vault | SingleCollateralVault | undefined;
  selectedCollateral: SelectedCollateral<T> | undefined;
  sendingTransaction: boolean;
  network: Network;
  balance: Balance;
  availableToWithdraw: ethers.BigNumber;
  collaterals?: CollateralWithDeposited[];
  setSendingTransaction: (sending: boolean) => void;
  onChangeReduceCollateralBy: (value: InputNumberValue) => void;
  onChangeSelectedCollateral?: (value: T) => void;
  fetchVault: () => Promise<void>;
  withdraw: () => Promise<void>;
};

const WithdrawCollateralForm = <T extends string>(props: Props<T>) => {
  const account = useAccount();
  const connectedAccount = useConnectedAccount();
  const network = useConnectedNetwork();
  const { refreshBalance } = useUserBalanceStore();

  const vaultIsSafe =
    !!props.futureVault &&
    (props.futureVault.debt.isZero() ||
      props.futureVault.collateralRatio.gt(
        props.futureVault.minimumMintingRatio,
      ));

  const loading = !props.futureVault;

  const disableInputs = loading || props.sendingTransaction;

  const hasEnoughCollateral =
    props.selectedCollateral?.deposited &&
    props.reduceCollateralBy.value.bn.lte(props.selectedCollateral.deposited);

  const displayAvailableCollateral =
    props.selectedCollateral &&
    bnToDisplayString(
      props.availableToWithdraw,
      props.selectedCollateral.decimals,
      4,
    );

  const isCorrectAccount = isSameAddress(connectedAccount, account);
  const isCorrectNetwork = props.network === network;

  const canWithdraw =
    isCorrectAccount &&
    isCorrectNetwork &&
    !props.reduceCollateralBy.value.bn.isZero() &&
    hasEnoughCollateral &&
    vaultIsSafe &&
    !disableInputs;

  const withdrawButtonText = () => {
    if (!connectedAccount) return "connect wallet";
    if (!isCorrectAccount) return "change accounts";
    if (!isCorrectNetwork) return `change network to ${props.network}`;
    if (!vaultIsSafe && !props.reduceCollateralBy.value.bn.isZero())
      return "unsafe vault";
    if (!hasEnoughCollateral) return "insufficient balance";
    if (props.sendingTransaction) return "processing...";
    return `withdraw ${props.selectedCollateral?.symbol}`;
  };

  const onClick = async () => {
    props.setSendingTransaction(true);
    try {
      await props.withdraw();
      await Promise.all([props.fetchVault(), refreshBalance()]);
      props.reduceCollateralBy.reset();
    } catch (error) {
      // dont do anything here as it is handled in sendTransaction
    }
    props.setSendingTransaction(false);
  };

  const singleVaultMax = () => {
    if (!props.vault) throw new Error("Single Vault: no vault provided");
    const collateral = props.vault.collateral as VaultCollateralToken<string>;
    const minimumRatio = props.vault.minimumMintingRatio.add(
      KASHI_COLLATERAL_RATIO_TOLERANCE,
    );
    const minimumCollateralAmount = collateral.amount
      .mul(minimumRatio)
      .div(props.vault.collateralRatio);
    const collateralDifference = collateral.amount.sub(minimumCollateralAmount);
    const string = ethers.utils.formatUnits(
      collateralDifference,
      collateral.decimals,
    );
    if (collateralDifference.lte(0))
      return console.warn(
        "Single Vault: collateral difference is less than or equal to zero",
      );
    props.onChangeReduceCollateralBy({ string, bn: collateralDifference });
  };

  const [collateralRatio, setCollateralRatio] = React.useState<number>(
    props?.futureVault?.collateralRatio
      ? Number(ethers.utils.formatEther(props?.futureVault.collateralRatio)) *
          100
      : 0,
  );

  const onChangeCollateralRatio = (newCr: number) => {
    const minCr = props?.vault?.minimumMintingRatio || ethers.constants.Zero;
    const currentCr = props?.vault?.collateralRatio || ethers.constants.Zero;
    const newCrBn = ethers.utils.parseEther(String(newCr)).div(1e2);
    if (newCrBn.lt(minCr) || newCrBn.gt(currentCr)) return;
    const ratioToWithdraw = currentCr
      .sub(newCrBn)
      .mul(ethers.constants.WeiPerEther)
      .div(currentCr.sub(minCr));
    const withdrawAmount = props.availableToWithdraw
      .mul(ratioToWithdraw)
      .div(ethers.constants.WeiPerEther);

    props.onChangeReduceCollateralBy({
      string: bnToDisplayString(withdrawAmount, 18, 18),
      bn: withdrawAmount,
    });
    setCollateralRatio(newCr);
  };

  React.useEffect(() => {
    setCollateralRatio(
      Number(
        ethers.utils.formatEther(
          props.futureVault?.collateralRatio.mul(1e2) || ethers.constants.Zero,
        ),
      ),
    );
  }, [props.futureVault?.collateralRatio]);

  const minCrToShow = () => {
    const minCr =
      props.futureVault?.minimumMintingRatio.mul(1e2) ||
      props.vault?.minimumMintingRatio.mul(1e2);
    if (minCr?.gt(0)) return Number(bnToDisplayString(minCr, 18, 0));
    return DEFAULT_MIN_CR;
  };

  return (
    <form key="withdrawForm" noValidate autoComplete="off">
      {props.selectedCollateral && props.collaterals && (
        <SelectCollateral
          id="select-withdraw-collateral"
          wrapperClassName="uk-margin-small-top"
          value={props.selectedCollateral.symbol as CollateralSymbolWithNative}
          includeNative={false}
          showBalance={true}
          customBalances={props.collaterals?.reduce((balances, col) => {
            return {
              ...balances,
              [col.symbol]: col.deposited,
            };
          }, {})}
          onChange={c => {
            if (!props.onChangeSelectedCollateral) {
              return;
            }
            props.onChangeSelectedCollateral(c as T);
          }}
        />
      )}

      <h2 className="uk-h4 uk-margin-top uk-margin-small-bottom">withdraw</h2>

      <div
        className={classNames(
          "uk-flex uk-flex-middle uk-flex-between",
          classes.slider,
        )}
      >
        <CrSlider
          collateralRatio={collateralRatio}
          onChangeCollateralRatio={onChangeCollateralRatio}
          minCrToShow={minCrToShow()}
        />
      </div>

      <InputNumber
        id="withdraw-amount"
        wrapperClassName="uk-margin-top"
        label="amount"
        rightLabel={`avail: ${displayAvailableCollateral}`}
        value={props.reduceCollateralBy.value}
        onChange={props.onChangeReduceCollateralBy}
        decimals={props.selectedCollateral?.decimals || 18}
        disabled={disableInputs}
        min={ethers.constants.Zero}
        max={props.availableToWithdraw}
        placeholder="amount to withdraw"
        onMax={
          // Vault.collateral can be either an array or a single collateral token depending on the vault.
          // Only use singleVaultMax when collateral is not an Array -- that indicates the vault is a single collateral vault.
          !Array.isArray(props.vault?.collateral) ? singleVaultMax : undefined
        }
      />

      <ButtonSmart
        className="uk-width-expand uk-margin-top"
        network={props.network}
        onClick={onClick}
        disabled={!canWithdraw}
        alert={!canWithdraw && !props.reduceCollateralBy.value.bn.isZero()}
      >
        {withdrawButtonText()}
      </ButtonSmart>
    </form>
  );
};

export default WithdrawCollateralForm;
