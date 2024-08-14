import {
  Vault,
  SingleCollateralVault,
  Network,
  CollateralSymbolWithNative,
  config as sdkConfig,
} from "handle-sdk";
import { ethers } from "ethers";
import { InputNumberState } from "../../hooks/useInputNumberState";
import { checkVaultSafety } from "../../utils/vault";
import { useAccount } from "../../context/Account";
import {
  useConnectedAccount,
  useConnectedNetwork,
  useUserWalletStore,
} from "@handle-fi/react-components/dist/context/UserWallet";
import { Balance, useUserBalanceStore } from "../../context/UserBalances";
import useAllowance, { Allowance } from "../../hooks/useAllowance";
import InputNumber, { InputNumberValue } from "../InputNumber/InputNumber";
import SelectCollateral from "../SelectCollateral";
import { bnToDisplayString } from "../../utils/format";
import ButtonSmart from "../ButtonSmart/ButtonSmart";
import { ensureHasAllowance } from "../../utils/ensureHasAllowance";
import useSendTransaction from "../../hooks/useSendTransaction";
import { useToken } from "../../context/TokenManager";
import React from "react";
import classes from "./BorrowForm.module.scss";
import InputNumberWithBalance from "../InputNumberWithBalance";
import { useProtocolStore } from "../../context/Protocol";
import {
  COIN_GECKO_PRICE_DECIMALS,
  DEFAULT_MIN_CR,
} from "../../config/constants";
import classNames from "classnames";
import {
  useFxTokensUsdPrice,
  useNativeTokenPrice,
  useTokenUsdPrice,
} from "../../context/Prices";
import DisplayValue from "../DisplayValue/DisplayValue";
import CrSlider from "../CrSlider/CrSlider";
import { useTermsAndConditions } from "../../context/TermsAndCondtions";
import { isSameAddress } from "handle-sdk/dist/utils/general";

type SelectedCollateral<T extends string> = {
  symbol: T;
  balance: Balance;
  allowance: Allowance;
};

type Props<T extends string> = {
  vault: Vault | SingleCollateralVault | undefined;
  futureVault: Vault | SingleCollateralVault | undefined;
  selectedCollateral: SelectedCollateral<T> | undefined;
  additionalDebt: InputNumberState;
  additionalCollateral: InputNumberState;
  network: Network;
  sendingTransaction: boolean;
  setSendingTransaction: (sending: boolean) => void;
  onChangeAdditionalDebt: (value: InputNumberValue) => void;
  onChangeAdditionalCollateral: (value: InputNumberValue) => void;
  fetchVault: () => Promise<void>;
  borrow: () => Promise<void>;
  onChangeSelectedCollateral?: (value: T) => void;
  onMaxDebt: () => void;
};

const DEFAULT_NETWORK: Network = "arbitrum";
const ALLOWANCE_TARGET = sdkConfig.protocol.arbitrum.protocol.comptroller;

const BorrowForm = <T extends string>(props: Props<T>) => {
  const account = useAccount();
  const connectedAccount = useConnectedAccount();
  const connectedNetwork = useConnectedNetwork();
  const network = connectedNetwork || DEFAULT_NETWORK;
  const { connection } = useUserWalletStore();
  const { refreshBalance } = useUserBalanceStore();
  const { sendTransaction } = useSendTransaction();
  const collateralToken = useToken(
    props.selectedCollateral?.symbol,
    connectedNetwork,
  );
  const borrowToken = useToken(props.vault?.fxToken.symbol, connectedNetwork);
  const { allowance: currentAllowance, fetchAllowance } = useAllowance(
    collateralToken?.symbol,
    ALLOWANCE_TARGET,
    connectedNetwork,
  );
  const { isSigningDone, isTermsModalOpen, ensureTermsSigned } =
    useTermsAndConditions();
  const fxTokensInUsd = useFxTokensUsdPrice({ fetch: true });
  const isVaultSafe =
    (props.additionalDebt.value.bn.isZero() &&
      props.additionalCollateral.value.bn.isZero()) ||
    checkVaultSafety(props.futureVault);
  const [collateralRatio, setCollateralRatio] = React.useState<number>(0);
  //determine what minCR to show in the slider based upon vault and/or what collateral being used
  const { collaterals } = useProtocolStore();
  const collateralMinCrs = collaterals?.map(c => {
    return {
      symbol: c.symbol,
      amount: Number(
        bnToDisplayString(c.mintCR.mul(ethers.constants.WeiPerEther), 18, 0),
      ),
    };
  });

  const getDisplayMintCr = () => {
    const minCr =
      props.futureVault?.minimumMintingRatio.mul(1e2) ||
      props.vault?.minimumMintingRatio.mul(1e2);
    if (minCr?.gt(0)) return Number(bnToDisplayString(minCr, 18, 0));

    return (
      collateralMinCrs?.find(
        collateral => collateral.symbol === collateralToken?.symbol,
      )?.amount || DEFAULT_MIN_CR
    );
  };

  const isLoading = !props.futureVault;
  const shouldDisableInputs = isLoading || props.sendingTransaction;
  const hasEnoughCollateral =
    props.additionalCollateral.value.bn.isZero() ||
    (!!props.selectedCollateral?.balance.balance &&
      props.additionalCollateral.value.bn.lte(
        props.selectedCollateral.balance.balance,
      ));
  const doesMeetMinimumDebt =
    !!props.futureVault?.debt.gte(props.futureVault.minimumDebt) ||
    props.additionalDebt.value.bn.isZero();
  const hasUserEnteredAmount =
    !props.additionalDebt.value.bn.isZero() ||
    !props.additionalCollateral.value.bn.isZero();
  const isCorrectAccount = isSameAddress(connectedAccount, account);
  const isCorrectNetwork = props.network === connectedNetwork;
  const canBorrow =
    isCorrectAccount &&
    props.network === connectedNetwork &&
    hasUserEnteredAmount &&
    doesMeetMinimumDebt &&
    hasEnoughCollateral &&
    (isVaultSafe || props.additionalDebt.value.bn.isZero()) &&
    !shouldDisableInputs;

  const borrowButtonText = () => {
    if (!connectedAccount) return "connect wallet";
    if (!isCorrectAccount) return "change accounts";
    if (!isCorrectNetwork) return `change network to ${props.network}`;
    if (!hasEnoughCollateral) return "insufficient balance";
    if (!isVaultSafe && !props.additionalDebt.value.bn.isZero())
      return "below minimum CR";
    if (!doesMeetMinimumDebt && !props.additionalDebt.value.bn.isZero())
      return `minimum debt is ${
        props.futureVault
          ? ethers.utils.formatEther(props.futureVault?.minimumDebt)
          : "-"
      }`;
    if (props.sendingTransaction || isTermsModalOpen) return "processing...";
    if (
      canBorrow &&
      props.selectedCollateral?.balance.balance &&
      !currentAllowance &&
      props.additionalCollateral.value.bn.gt(0)
    )
      return `approve ${props.selectedCollateral?.symbol}`;

    if (canBorrow && !isSigningDone.current) return "sign terms of use";
    if (
      !props.additionalDebt.value.bn.isZero() &&
      !props.additionalCollateral.value.bn.isZero()
    )
      return "deposit & borrow";
    if (!props.additionalCollateral.value.bn.isZero()) return "deposit";
    return "borrow";
  };

  const onClick = async () => {
    if (!isSigningDone.current) {
      await ensureTermsSigned();
      return;
    }
    props.setSendingTransaction(true);
    if (!currentAllowance) return;
    await fetchAllowance();
    const collateralDeposit = props.additionalCollateral.value.bn;
    const hasEnoughAllowance = currentAllowance.gte(collateralDeposit);
    try {
      if (hasEnoughAllowance) {
        await props.borrow();
        await Promise.all([props.fetchVault(), refreshBalance()]);
        props.additionalDebt.reset();
        props.additionalCollateral.reset();
      } else {
        if (
          !connectedAccount ||
          !collateralToken ||
          !borrowToken ||
          !connection.user.isConnected
        ) {
          return;
        }
        await ensureHasAllowance(
          connectedAccount,
          collateralToken,
          ALLOWANCE_TARGET,
          connection.user.signer,
          collateralDeposit,
          sendTransaction,
          currentAllowance,
        );
      }
    } catch (_) {
      // This case is handled in sendTransaction.
    }
    props.setSendingTransaction(false);
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

  const onChangeCollateralRatio = (newCr: number | number[]) => {
    const newCrBn = ethers.utils.parseEther(String(newCr)).div(1e2);
    const newCollateral = newCrBn
      .mul(props?.futureVault?.debtAsEth || ethers.constants.Zero)
      .div(ethers.constants.WeiPerEther);
    const requiredAdditionalCollateral = newCollateral.sub(
      props?.vault?.collateralAsEth || ethers.constants.Zero,
    );
    if (!requiredAdditionalCollateral.eq(0))
      props.onChangeAdditionalCollateral({
        bn: requiredAdditionalCollateral,
        string: bnToDisplayString(requiredAdditionalCollateral, 18, 18),
      });
    setCollateralRatio(newCr as number);
  };

  const onChangeAdditionalDebtInternal = (newDebt: InputNumberValue) => {
    props.onChangeAdditionalDebt(newDebt);
  };
  const additionalDebtInUsdToDisplay = Number(
    ethers.utils.formatEther(
      props.additionalDebt.value.bn
        .mul(
          fxTokensInUsd?.[props?.vault?.fxToken.symbol || "fxUSD"].bn ||
            ethers.constants.Zero,
        )
        .div(10 ** COIN_GECKO_PRICE_DECIMALS),
    ),
  );

  const onChangeAdditionalCollateralInternal = (value: InputNumberValue) => {
    props.onChangeAdditionalCollateral(value);
  };
  const nativeTokenUsdPrice = ethers.utils.parseEther(
    String(useNativeTokenPrice(network) || 0),
  );

  const forexPrice = useTokenUsdPrice({ tokenSymbol: "FOREX", fetch: true });
  const forexUsdPrice = React.useMemo(
    () => ethers.utils.parseEther((forexPrice || 1).toString()),
    [forexPrice],
  );

  const collateralPriceToUse =
    props?.selectedCollateral?.symbol === "FOREX"
      ? forexUsdPrice
      : nativeTokenUsdPrice;
  const additionalCollateralInUsdToDisplay = Number(
    ethers.utils.formatEther(
      props.additionalCollateral.value.bn
        .mul(collateralPriceToUse)
        .div(ethers.constants.WeiPerEther),
    ),
  );

  return (
    <form key="borrowForm" noValidate autoComplete="off">
      <InputNumber
        id="borrow-amount"
        label="amount"
        rightLabel={
          props.vault?.debt
            ? `debt: ${bnToDisplayString(props.vault.debt, 18, 2)}`
            : undefined
        }
        value={props.additionalDebt.value}
        onChange={onChangeAdditionalDebtInternal}
        disabled={shouldDisableInputs}
        placeholder="amount to borrow"
        decimals={18}
        onMax={props.onMaxDebt}
        rightComponent={
          <React.Fragment>
            {props.additionalDebt.value.bn.gt(0) && (
              <DisplayValue value={additionalDebtInUsdToDisplay} />
            )}
          </React.Fragment>
        }
      />

      <h2 className="uk-h4 uk-margin-top uk-margin-small-bottom">deposit</h2>

      <div
        className={classNames(
          "uk-flex uk-flex-middle uk-flex-between",
          classes.slider,
        )}
      >
        <CrSlider
          collateralRatio={collateralRatio}
          onChangeCollateralRatio={onChangeCollateralRatio}
          minCrToShow={getDisplayMintCr()}
        />
      </div>

      {props.selectedCollateral && props.onChangeSelectedCollateral && (
        <SelectCollateral
          id="select-collateral"
          wrapperClassName="uk-margin-small-top"
          value={props.selectedCollateral.symbol as CollateralSymbolWithNative}
          showBalance={true}
          includeNative={true}
          onChange={c => {
            if (!props.onChangeSelectedCollateral) {
              return;
            }
            props.onChangeSelectedCollateral(c as T);
          }}
        />
      )}

      <InputNumberWithBalance
        id="deposit-amount"
        wrapperClassName="uk-margin-top"
        network={props.network}
        label="amount"
        value={props.additionalCollateral.value}
        tokenSymbol={props.selectedCollateral?.symbol}
        onChange={onChangeAdditionalCollateralInternal}
        disabled={shouldDisableInputs}
        placeholder="amount to deposit"
        rightComponent={
          <React.Fragment>
            {props.additionalCollateral.value.bn.gt(0) && (
              <DisplayValue value={additionalCollateralInUsdToDisplay} />
            )}
          </React.Fragment>
        }
      />

      <ButtonSmart
        network={props.network}
        className="uk-margin-top"
        onClick={onClick}
        disabled={!canBorrow || props.additionalCollateral.value.bn.lt(0)}
        expand={true}
        alert={!canBorrow && hasUserEnteredAmount}
      >
        {borrowButtonText()}
      </ButtonSmart>
    </form>
  );
};

export default BorrowForm;
