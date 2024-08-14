import * as React from "react";
import {
  SingleCollateralVault,
  SingleCollateralVaultNetwork,
} from "handle-sdk";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  BorrowForm,
  RepayForm,
  VaultDetails,
  WithdrawCollateralForm,
  VaultLayout,
  VaultActionTabs,
  SelectFxToken,
  VaultTypeTabs,
  SelectToken,
  VaultCollateralList,
} from "../components";
import { useBalance } from "../context/UserBalances";
import {
  useSingleCollateralVault,
  useSingleCollateralVaults,
} from "../context/Vaults";
import {
  useSingleCollateralDepositAllowance,
  useSingleCollateralRepayAllowance,
} from "../hooks/useAllowanceFromSDK";
import useSetAccount from "../hooks/useSetAccount";
import useManageSingleCollateralVault from "../hooks/useManageSingleCollateralVault";
import useVaultInputsState from "../hooks/useVaultInputsState";
import { ethers } from "ethers";
import { VaultAction } from "../types/vault";
import { useFxToken } from "../context/Protocol";
import {
  getAvailableSingleCollateralVaultCollaterals,
  getAvailableSingleCollateralVaultFxTokens,
  getKashiPoolDetails,
} from "../utils/vault";
import { useConnectedNetwork } from "@handle-fi/react-components/dist/context/UserWallet";
import { KASHI_COLLATERAL_RATIO_TOLERANCE } from "../config/kashi";

type Params = {
  account: string;
  network: SingleCollateralVaultNetwork;
  fxToken: string;
  action?: VaultAction;
};

const DEFAULT_ACTION: VaultAction = "borrow";

const SingleCollateralVaultPage: React.FC = () => {
  useSetAccount(`/vaults/single/:network/:fxToken/:account`);

  const {
    fxToken: fxTokenParam,
    network: paramsNetwork,
    account,
    action: actionParam,
  } = useParams() as Params;
  const connectedNetwork = useConnectedNetwork();

  const network = connectedNetwork || paramsNetwork;

  const availableCollaterals = React.useMemo(
    () => getAvailableSingleCollateralVaultCollaterals(network, fxTokenParam),
    [network, fxTokenParam],
  );

  const availableFxTokens = React.useMemo(
    () => getAvailableSingleCollateralVaultFxTokens(network),
    [network],
  );

  const [searchParams] = useSearchParams();

  const collateralSymbol = React.useMemo(() => {
    return searchParams.get("collateral") || availableCollaterals[0];
  }, [searchParams, availableCollaterals]);

  const action = actionParam || DEFAULT_ACTION;

  const navigate = useNavigate();

  const poolDetails = React.useMemo(
    () => getKashiPoolDetails(network, fxTokenParam, collateralSymbol),
    [network, fxTokenParam, collateralSymbol],
  );

  useSingleCollateralVaults({ network: paramsNetwork, fetch: true });

  const [vault, fetchVault] = useSingleCollateralVault({
    vaultSymbol: poolDetails.vaultSymbol,
    network: paramsNetwork,
    fetch: false,
  });

  const fxToken = useFxToken(fxTokenParam);

  const {
    sendingTransaction,
    additionalDebtState,
    additionalCollateralState,
    reduceDebtByState,
    reduceCollateralByState,
    onChangeAdditionalCollateral,
    onChangeAdditionalDebt,
    onChangeReduceDebtBy,
    onChangeReduceCollateralBy,
    setSendingTransaction,
  } = useVaultInputsState();

  const { futureVault, borrow, repay } = useManageSingleCollateralVault(
    {
      vault,
      additionalDebt: additionalDebtState.value.bn,
      additionalCollateral: additionalCollateralState.value.bn,
      reduceDebtBy: reduceDebtByState.value.bn,
      reduceCollateralBy: reduceCollateralByState.value.bn,
    },
    paramsNetwork,
  );

  const collateralAllowance = useSingleCollateralDepositAllowance(
    poolDetails.vaultSymbol,
    paramsNetwork,
  );

  const repayAllowance = useSingleCollateralRepayAllowance(
    vault?.fxToken.symbol,
    paramsNetwork,
  );

  const collateralBalance = useBalance({
    tokenSymbol: vault?.collateral.symbol,
    network,
  });

  const borrowCollateral = vault
    ? {
        ...vault.collateral,
        decimals: vault?.collateral?.decimals || 18,
        balance: collateralBalance,
        allowance: collateralAllowance,
      }
    : undefined;

  const withdrawCollateral = vault
    ? {
        ...vault.collateral,
        deposited: vault.collateral.amount,
      }
    : undefined;

  const onChangeAction = (newAction: VaultAction) => {
    if (!fxToken) {
      return;
    }

    navigate(
      `/vaults/single/${network}/${fxToken.symbol}/${account}/${newAction}`,
    );
  };

  const onChangeFxToken = (newFxToken: string) => {
    const newAvailableCollaterals =
      getAvailableSingleCollateralVaultCollaterals(network, newFxToken);
    const newCollateral = newAvailableCollaterals.includes(collateralSymbol)
      ? collateralSymbol
      : newAvailableCollaterals[0];
    navigate(
      `/vaults/single/${network}/${newFxToken}/${account}/${action}?collateral=${newCollateral}`,
    );
  };

  const onChangeCollateral = (newCollateral: string) => {
    navigate(
      `/vaults/single/${network}/${fxToken?.symbol}/${account}/${action}?collateral=${newCollateral}`,
    );
  };

  const max = () => {
    if (!vault) throw new Error("Single Vault: no vault detected");
    const minimumRatio = vault.minimumMintingRatio.add(
      KASHI_COLLATERAL_RATIO_TOLERANCE,
    );
    const maxDebt = vault.collateralAsFxToken
      .mul(ethers.constants.WeiPerEther)
      .div(minimumRatio);
    const debtDifference = maxDebt.sub(vault.debt);
    const string = ethers.utils.formatUnits(
      debtDifference,
      vault.fxToken.decimals,
    );
    if (debtDifference.lte(0))
      return console.warn(
        "Single Vault: difference in debt is less than or equal to zero",
      );
    onChangeAdditionalDebt({ string, bn: debtDifference });
  };

  const availableToWithdraw = vault?.collateral.amount || ethers.constants.Zero;

  return (
    <VaultLayout action={action} title="vault">
      {/* left */}
      <>
        <SelectFxToken
          id="select-fx-token"
          onChange={onChangeFxToken}
          value={fxTokenParam}
          network={network}
          displayOptions={availableFxTokens}
        />
        <VaultTypeTabs
          active="single-collateral"
          network={network}
          fxToken={fxTokenParam}
          account={account}
          action={action}
        />

        <SelectToken
          value={collateralSymbol}
          options={availableCollaterals}
          id="select-collateral"
          onChange={onChangeCollateral}
          network={network}
          showBalance={true}
          showSelected={true}
          wrapperClassName="uk-margin-bottom"
        />
        <VaultActionTabs
          active={action}
          onChange={onChangeAction}
          disabled={{
            repay: vault?.debt.eq(0),
            withdraw: availableToWithdraw.eq(0),
          }}
        />
        {action === "borrow" && (
          <BorrowForm<string>
            vault={vault}
            sendingTransaction={sendingTransaction}
            additionalDebt={additionalDebtState}
            additionalCollateral={additionalCollateralState}
            selectedCollateral={borrowCollateral}
            futureVault={futureVault}
            network={network}
            setSendingTransaction={setSendingTransaction}
            fetchVault={fetchVault}
            borrow={borrow}
            onChangeAdditionalDebt={onChangeAdditionalDebt}
            onChangeAdditionalCollateral={onChangeAdditionalCollateral}
            onMaxDebt={max}
          />
        )}
        {action === "repay" && (
          <RepayForm
            vault={vault}
            fxTokenSymbol={futureVault?.fxToken.symbol}
            sendingTransaction={sendingTransaction}
            network={network}
            reduceDebtBy={reduceDebtByState}
            futureVault={futureVault}
            allowance={repayAllowance}
            setSendingTransaction={setSendingTransaction}
            onChangeReduceDebtBy={onChangeReduceDebtBy}
            fetchVault={fetchVault}
            repay={repay}
          />
        )}
        {action === "withdraw" && (
          <WithdrawCollateralForm
            network={network}
            selectedCollateral={withdrawCollateral}
            vault={vault}
            futureVault={futureVault}
            reduceCollateralBy={reduceCollateralByState}
            sendingTransaction={sendingTransaction}
            balance={collateralBalance}
            availableToWithdraw={availableToWithdraw}
            setSendingTransaction={setSendingTransaction}
            onChangeReduceCollateralBy={onChangeReduceCollateralBy}
            fetchVault={fetchVault}
            withdraw={repay}
          />
        )}
      </>
      {/* right */}
      <>
        <VaultDetails
          fxToken={poolDetails.vaultSymbol.split("-")[0]}
          currentVault={vault}
          futureVault={futureVault}
          collateral={borrowCollateral}
          kashiVault
        />
        <h4 className={"uk-h4 uk-margin-small-bottom uk-margin-top"}>
          collateral
        </h4>
        <MultiCollateralVaultCollateralList
          currentVault={vault}
          futureVault={futureVault}
        />
      </>
    </VaultLayout>
  );
};

export default SingleCollateralVaultPage;

const MultiCollateralVaultCollateralList: React.FC<{
  currentVault: SingleCollateralVault | undefined;
  futureVault: SingleCollateralVault | undefined;
}> = ({ currentVault, futureVault }) => {
  const rows =
    currentVault && futureVault
      ? [
          {
            symbol: currentVault.collateral.symbol,
            decimals: currentVault.collateral.decimals,
            currentAmount: currentVault.collateral.amount,
            futureAmount: futureVault.collateral.amount,
            currentValue: currentVault.collateralAsFxToken,
            futureValue: futureVault.collateralAsFxToken,
          },
        ]
      : undefined;

  return (
    <VaultCollateralList
      fxTokenSymbol={currentVault?.fxToken.symbol}
      collaterals={rows?.length ? rows : undefined}
    />
  );
};
