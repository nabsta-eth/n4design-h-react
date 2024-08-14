import * as React from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Collateral,
  CollateralSymbolWithNative,
  FxToken,
  Network,
  SingleCollateralVaultNetwork,
  Vault,
  VaultController,
  vaultUtils,
} from "handle-sdk";
import {
  BorrowForm,
  RepayForm,
  WithdrawCollateralForm,
  VaultDetails,
  VaultCollateralList,
  SelectFxToken,
  VaultLayout,
  VaultActionTabs,
} from "../components";
import { useVault } from "../context/Vaults";
import useSetAccount from "../hooks/useSetAccount";
import {
  useCollateral,
  useFxToken,
  useProtocolStore,
} from "../context/Protocol";
import useManageVault from "../hooks/useManageVault";
import { useBalance } from "../context/UserBalances";
import {
  useCollateralDepositAllowance,
  useRepayAllowance,
} from "../hooks/useAllowanceFromSDK";
import useVaultInputsState from "../hooks/useVaultInputsState";
import { ethers } from "ethers";
import { getInputNumberValue } from "../hooks/useInputNumberState";
import { InputNumberValue } from "../components/InputNumber/InputNumber";
import { VaultAction } from "../types/vault";
import {
  calculateCollateralAmountValueAsFx,
  calculateUpdatedAvailableToMintAfterCollateralDeposit,
} from "../utils/vault";

type Params = {
  account: string;
  network: SingleCollateralVaultNetwork;
  fxToken: string;
  action?: VaultAction;
};

const NETWORK: Network = "arbitrum";
const DEFAULT_ACTION: VaultAction = "borrow";

const VaultPage: React.FC = () => {
  useSetAccount("/vaults/multi/:fxToken/:account");
  const navigate = useNavigate();
  const { protocolParameters } = useProtocolStore();
  const activePath = useLocation().pathname;
  const routeBase = activePath.split("/")[1];
  const isBorrow = routeBase === "borrow";

  const {
    fxToken: fxTokenParam,
    account,
    action: actionParam,
  } = useParams() as Params;

  const action = actionParam || DEFAULT_ACTION;

  const onChangeAction = (newAction: VaultAction) => {
    navigate(`/vaults/multi/${fxTokenParam}/${account}/${newAction}`);
  };

  const {
    sendingTransaction,
    additionalDebtState,
    additionalCollateralState,
    reduceDebtByState,
    reduceCollateralByState,
    selectedDepositCollateral,
    selectedWithdrawCollateral,
    setSelectedCollateral,
    setSelectedWithdrawCollateral,
    onChangeAdditionalCollateral,
    onChangeAdditionalDebt,
    onChangeReduceDebtBy,
    onChangeReduceCollateralBy,
    setSendingTransaction,
  } = useVaultInputsState();

  const onChangeFxToken = (newFxToken: string) => {
    additionalDebtState.reset();
    additionalCollateralState.reset();
    //borrow route is separate from vaults due to slightly different UX.
    //they use the same components so make sure the correct route structure and UX is followed.
    navigate(
      `/${routeBase}/multi/${newFxToken}/${account}${isBorrow ? "" : "/"}${
        isBorrow ? "" : action
      }`,
    );
  };

  const [vault, fetchVault] = useVault({ fxToken: fxTokenParam, fetch: true });

  const { collaterals } = useProtocolStore();

  const fxToken = useFxToken(fxTokenParam);

  const { futureVault, borrow, repay, withdraw } = useManageVault({
    action,
    vault,
    depositCollateral: selectedDepositCollateral,
    additionalDebt: additionalDebtState.value.bn,
    additionalCollateral: additionalCollateralState.value.bn,
    reduceDebtBy: reduceDebtByState.value.bn,
    withdrawCollateral: selectedWithdrawCollateral,
    reduceCollateralBy: reduceCollateralByState.value.bn,
  });

  const collateral = useCollateral(
    selectedDepositCollateral === "ETH" ? "WETH" : selectedDepositCollateral,
  );

  const collateralBalance = useBalance({
    tokenSymbol: selectedDepositCollateral,
    network: NETWORK,
  });

  const collateralAllowance = useCollateralDepositAllowance(
    selectedDepositCollateral === "ETH" ? undefined : selectedDepositCollateral,
    !additionalDebtState.value.bn.isZero() &&
      !additionalCollateralState.value.bn.isZero()
      ? "mintAndDeposit"
      : "deposit",
  );

  const fxAllowance = useRepayAllowance(fxTokenParam);

  const borrowCollateral = {
    symbol: selectedDepositCollateral,
    balance: collateralBalance,
    allowance: collateralAllowance,
  };

  const withdrawCollateral = {
    symbol: selectedWithdrawCollateral,
    decimals: collateral?.decimals || 18,
    deposited:
      vault?.collateral.find(c => c.symbol === selectedWithdrawCollateral)
        ?.amount || ethers.constants.Zero,
  };

  const collateralsWithDepositedAmount = collaterals?.map(c => ({
    ...c,
    deposited: vault?.collateral.find(v => v.symbol === c.symbol)?.amount,
  }));

  const onChangeAdditionalDebtInternal = (additionalDebt: InputNumberValue) => {
    additionalDebtState.onChange(additionalDebt);

    if (
      !vault ||
      !fxToken ||
      !collateral ||
      !collaterals ||
      !protocolParameters
    ) {
      return;
    }

    const tempVaultController = new VaultController(
      vault,
      protocolParameters,
      fxToken,
      collaterals,
    );

    tempVaultController.addDebt(additionalDebt.bn);

    const additionalCollateralRequired =
      vaultUtils.calculateAdditionalCollateralRequired(
        tempVaultController.vault,
        collateral.symbol,
        collaterals,
        fxToken,
        protocolParameters,
      );

    if (additionalCollateralRequired.isZero()) {
      return;
    }

    onChangeAdditionalCollateral(
      getInputNumberValue(additionalCollateralRequired, collateral.decimals),
    );
  };

  const setSelectedCollateralInternal = (
    symbol: CollateralSymbolWithNative,
  ) => {
    setSelectedCollateral(symbol);
    additionalDebtState.reset();
    additionalCollateralState.reset();
  };

  const onMaxDebt = () => {
    if (
      !vault ||
      !collateralBalance.balance ||
      !collaterals ||
      !collateral ||
      !fxToken ||
      !protocolParameters
    ) {
      return;
    }

    // if user has already deposited collateral
    // and/or entered additional debt
    // use that collateral to base the max mint.
    // if not, use the amount of collateral user has in their wallet.
    const useDepositedOrAdditionalCollateral =
      vault.collateralAsFxToken.gt(0) &&
      additionalCollateralState.value.bn.lte(0);

    const availableToMint = useDepositedOrAdditionalCollateral
      ? vault.availableToMint
      : calculateUpdatedAvailableToMintAfterCollateralDeposit(
          collateralBalance.balance,
          collateral.symbol,
          vault,
          fxToken,
          collaterals,
          protocolParameters,
        );

    onChangeAdditionalDebt(getInputNumberValue(availableToMint, 18));
    // if the user hasn't already deposited, fill the collateral field with the minimum amount to meet the cr reqs
    if (!useDepositedOrAdditionalCollateral)
      onChangeAdditionalCollateral(
        getInputNumberValue(collateralBalance.balance, collateral.decimals),
      );
  };

  const availableToWithdraw =
    vault && collateral
      ? vaultUtils
          .calculateWithdrawableCollateral(vault, collateral)
          // we subtrack a smal amount to ensure the vault stays safe
          .sub(ethers.constants.One)
      : ethers.constants.Zero;

  if (
    (action === "repay" && vault?.debt.eq(0)) ||
    (action === "withdraw" && availableToWithdraw.lte(0))
  ) {
    onChangeAction(DEFAULT_ACTION);
  }

  return (
    <VaultLayout action={action} title="vault">
      {/* left */}
      <>
        <SelectFxToken
          id="select-fx-token"
          wrapperClassName="uk-margin-bottom"
          onChange={onChangeFxToken}
          value={fxTokenParam}
          network={NETWORK}
        />
        {/* uncomment when ready to go live with single colateral vaults */}
        {/* <VaultTypeTabs
          active="multi-collateral"
          network={NETWORK}
          fxToken={fxTokenParam}
          account={account}
          action={action}
        /> */}
        {!isBorrow && (
          <VaultActionTabs
            active={action}
            onChange={onChangeAction}
            disabled={{
              repay: vault?.debt.eq(0),
              withdraw: availableToWithdraw.lte(0),
            }}
          />
        )}

        {action === "borrow" && (
          <BorrowForm<CollateralSymbolWithNative>
            vault={vault}
            futureVault={futureVault}
            selectedCollateral={borrowCollateral}
            additionalDebt={additionalDebtState}
            additionalCollateral={additionalCollateralState}
            sendingTransaction={sendingTransaction}
            network={NETWORK}
            setSendingTransaction={setSendingTransaction}
            fetchVault={fetchVault}
            borrow={borrow}
            onChangeAdditionalDebt={onChangeAdditionalDebtInternal}
            onChangeAdditionalCollateral={onChangeAdditionalCollateral}
            onChangeSelectedCollateral={setSelectedCollateralInternal}
            onMaxDebt={onMaxDebt}
          />
        )}
        {action === "repay" && (
          <RepayForm
            vault={vault}
            fxTokenSymbol={fxTokenParam}
            allowance={fxAllowance}
            sendingTransaction={sendingTransaction}
            network={NETWORK}
            reduceDebtBy={reduceDebtByState}
            futureVault={futureVault}
            setSendingTransaction={setSendingTransaction}
            onChangeReduceDebtBy={onChangeReduceDebtBy}
            fetchVault={fetchVault}
            repay={repay}
          />
        )}
        {action === "withdraw" && (
          <WithdrawCollateralForm
            network={NETWORK}
            vault={vault}
            futureVault={futureVault}
            collaterals={collateralsWithDepositedAmount}
            selectedCollateral={withdrawCollateral}
            reduceCollateralBy={reduceCollateralByState}
            sendingTransaction={sendingTransaction}
            balance={collateralBalance}
            availableToWithdraw={availableToWithdraw}
            setSendingTransaction={setSendingTransaction}
            onChangeReduceCollateralBy={onChangeReduceCollateralBy}
            fetchVault={fetchVault}
            withdraw={withdraw}
            onChangeSelectedCollateral={setSelectedWithdrawCollateral}
          />
        )}
      </>
      {/* right */}
      <>
        <VaultDetails
          fxToken={fxTokenParam}
          collateral={collateral}
          currentVault={getVaultWithLiquidationPrice(vault, collateral)}
          futureVault={getVaultWithLiquidationPrice(futureVault, collateral)}
          kashiVault={false}
        />
        <h4 className={"uk-h4 uk-margin-small-bottom uk-margin-top"}>
          deposits
        </h4>
        <MultiCollateralVaultCollateralList
          currentVault={vault}
          fxToken={fxToken}
          futureVault={futureVault}
          collaterals={collaterals}
        />
      </>
    </VaultLayout>
  );
};

export default VaultPage;

const MultiCollateralVaultCollateralList: React.FC<{
  currentVault: Vault | undefined;
  futureVault: Vault | undefined;
  fxToken: FxToken | undefined;
  collaterals: Collateral[] | undefined;
}> = ({ currentVault, futureVault, fxToken, collaterals }) => {
  const rows = [];
  if (currentVault && futureVault && fxToken && collaterals) {
    for (const collateral of collaterals) {
      const currentVaultCollateral = currentVault.collateral.find(
        c => c.symbol === collateral.symbol,
      );
      const futureVaultCollateral = futureVault.collateral.find(
        c => c.symbol === collateral.symbol,
      );

      if (
        !currentVaultCollateral ||
        !futureVaultCollateral ||
        (currentVaultCollateral.amount.lte(0) &&
          futureVaultCollateral.amount.lte(0))
      ) {
        continue;
      }

      rows.push({
        symbol: collateral.symbol,
        decimals: collateral.decimals,
        price: collateral.price,
        currentAmount: currentVaultCollateral.amount,
        futureAmount: futureVaultCollateral.amount,
        currentValue: calculateCollateralAmountValueAsFx(
          currentVaultCollateral.amount,
          collateral,
          fxToken,
        ),
        futureValue: calculateCollateralAmountValueAsFx(
          futureVaultCollateral.amount,
          collateral,
          fxToken,
        ),
      });
    }
  }

  return (
    <VaultCollateralList
      fxTokenSymbol={fxToken?.symbol}
      collaterals={
        currentVault && futureVault && fxToken && collaterals ? rows : undefined
      }
    />
  );
};

const getVaultWithLiquidationPrice = (
  vault: Vault | undefined,
  collateral: Collateral | undefined,
) => {
  if (!vault || !collateral) {
    return undefined;
  }

  const vaultHasOneOrLessCollateralsDeposited =
    vault.collateral.filter(c => c.amount.gt(0)).length <= 1;

  if (!vaultHasOneOrLessCollateralsDeposited) {
    return {
      ...vault,
      liquidationPrice: ethers.constants.Zero,
    };
  }

  return {
    ...vault,
    liquidationPrice:
      vaultUtils.calculateLiquidationPriceOfVaultWithOneCollateral(
        vault,
        collateral,
      ),
  };
};
