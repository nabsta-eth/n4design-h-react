import classNames from "classnames";
import { BigNumber, constants } from "ethers";
import { config, TokenInfo } from "handle-sdk";
import React, { useEffect, useState } from "react";
import { getTradeAccountDepositNotifications } from "../../../config/notifications";
import {
  getTradeNetworkOrNull,
  USE_GASLESS,
  useTrade,
} from "../../../context/Trade";
import { useTermsAndConditions } from "../../../context/TermsAndCondtions";
import { useToken } from "../../../context/TokenManager";
import { useLanguageStore } from "../../../context/Translation";
import { useUserBalanceStore } from "../../../context/UserBalances";
import { useUiStore } from "../../../context/UserInterface";
import useAllowance from "../../../hooks/useAllowance";
import useInputNumberState, {
  InputNumberState,
} from "../../../hooks/useInputNumberState";
import useSendTransaction, {
  handleSendTransactionError,
} from "../../../hooks/useSendTransaction";
import { transformDecimals, uniqueId } from "../../../utils/general";
import ButtonSmart from "../../ButtonSmart/ButtonSmart";
import { InputNumberValue } from "../../InputNumber/InputNumber";
import InputNumberWithBalance from "../../InputNumberWithBalance";
import SelectTradeDepositToken, {
  DepositTokenSymbol,
} from "./SelectTradeDepositToken";
import classes from "./TradeDeposit.module.scss";
import { TradeDepositRow } from "./TradeDepositRow";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import { Image } from "@handle-fi/react-components/dist/components/handle_uikit/components/Image";
import {
  useConnectedAccount,
  useConnectedNetwork,
  useSigner,
  useUserWalletStore,
} from "@handle-fi/react-components/dist/context/UserWallet";
import {
  closeAllNotifications,
  showNotification,
} from "@handle-fi/react-components/dist/utils/notifications";
import { DEFAULT_TRADE_DEPOSIT_TOKEN } from "../../../config/trade";
import { useCheckDepositAllowance } from "../../../utils/trade/ensureHasDepositAllowance";
import { RightArrow } from "../../RightArrow";
import { oldToNew } from "../../../utils/trade/oldToNew";
import { USD_DISPLAY_DECIMALS } from "../../../utils/trade";
import { shouldShowApprovalAndPendingNotification } from "../../../utils/wallet";
import { ensureHasAllowance } from "../../../utils/ensureHasAllowance";
import { getTokenTransferProxyAddress } from "handle-sdk/dist/utils/convert";
import { TokenTransferProxyNetwork } from "handle-sdk/dist/types/network";
import { AMOUNT_DECIMALS } from "handle-sdk/dist/components/trade";
import { useTradeAccountDisplay } from "../../../context/TradeAccountDisplay";
import { convertPartial } from "../../../utils/priceError";
import { useTradeSize } from "../../../context/TradeSize";
import { TradeDepositAndWithdrawButtonImage } from "../TradeDepositAndWithdrawButtonImage/TradeDepositAndWithdrawButtonImage";

export type TradeDepositProps = {
  onClose: () => void;
};

type TradeDepositButtonProps = {
  tokenSymbol: string;
  depositTokenAmount: InputNumberValue;
  allowance: BigNumber | undefined;
  depositToken: TokenInfo | undefined;
  isSigningDone?: boolean;
};

const TradeDeposit = ({ onClose }: TradeDepositProps) => {
  const connectedAccount = useConnectedAccount();
  const { walletChoice } = useUserWalletStore();
  const { isMobile } = useUiStore();
  const { isSigningDone, isTermsModalOpen, ensureTermsSigned } =
    useTermsAndConditions();
  const { t } = useLanguageStore();
  const { account } = useTrade();
  const signer = useSigner();
  const depositTokenAmount = useInputNumberState();
  const [depositToken, setDepositToken] = React.useState<DepositTokenSymbol>(
    DEFAULT_TRADE_DEPOSIT_TOKEN,
  );
  const connectedNetwork = useConnectedNetwork() ?? "arbitrum";
  // TODO: error handling if the network is not supported,
  // rather than defaulting?
  const network = getTradeNetworkOrNull(connectedNetwork);
  const depositTokenExtended = useToken(depositToken, network ?? undefined);
  const { allowance, fetchAllowance } = useAllowance(
    depositToken,
    network ? config.protocol[network].tradeAccount : undefined,
    network ?? undefined,
  );
  const [isOverBalance, setIsOverBalance] = useState(false);

  const isApprovalRequired =
    !USE_GASLESS &&
    !!(
      depositTokenAmount.value.bn.gt(0) &&
      allowance &&
      allowance.lt(depositTokenAmount.value.bn)
    );

  const { sendTransaction, sendingTransaction: isSendingTransaction } =
    useSendTransaction();
  const { refreshBalance, isLoadingBalances } = useUserBalanceStore();

  const [isDepositing, setIsDepositing] = React.useState(false);
  const checkDepositAllowance = useCheckDepositAllowance(
    depositToken,
    depositTokenAmount,
    sendTransaction,
  );
  const depositFunds = useDepositFunds(depositToken, depositTokenAmount);

  const deposit = async () => {
    if (!signer || !depositTokenExtended || !connectedAccount) {
      return;
    }

    if (!isSigningDone.current) {
      await ensureTermsSigned();
      return;
    }

    const notifications = getTradeAccountDepositNotifications({
      token: depositTokenExtended,
      amount: depositTokenAmount.value.bn,
    });

    const preDepositNotification = showNotification({
      status: shouldShowApprovalAndPendingNotification(walletChoice)
        ? "pending"
        : "info",
      message: shouldShowApprovalAndPendingNotification(walletChoice)
        ? notifications.awaitingApproval
        : notifications.pending,
    });

    setIsDepositing(true);
    try {
      if (!USE_GASLESS) {
        const hadAllowance = await checkDepositAllowance();
        if (!hadAllowance) {
          return;
        }
      }

      const didDepositSucceed = await depositFunds();
      if (!didDepositSucceed) {
        // Graceful failure.
        // Because it returned false rather than throwing,
        // the callee must have handled the UX such as
        // showing error notifications.
        return;
      }

      preDepositNotification.close();
      showNotification({
        status: "success",
        message: notifications.success,
      });
      depositTokenAmount.reset();
      account?.onUpdate?.();
      refreshBalance(network ?? undefined);
      onClose();
    } catch (e: any) {
      console.error("deposit error", e);
      closeAllNotifications();
      handleSendTransactionError(e);
    } finally {
      setIsDepositing(false);
    }
  };

  React.useEffect(() => {
    if (!isSendingTransaction) {
      fetchAllowance();
    }
  }, [isSendingTransaction]);
  const isProcessing = isDepositing || isSendingTransaction;

  const id = React.useMemo(() => `trade-deposit-${uniqueId(5)}`, []);
  const depositTokenSelectId = `${id}-token-select`;

  const onChangeDepositToken = (symbol: DepositTokenSymbol) => {
    depositTokenAmount.reset();
    setDepositToken(symbol);
  };

  const onChangeDepositTokenAmount = (input: InputNumberValue) => {
    depositTokenAmount.onChange(input);
  };
  const depositTokenAmountId = `${id}-amount`;

  const { currentAccountDisplay, simulated } = useTradeAccountDisplay(true);
  const { setEquityDelta } = useTradeSize();
  const {
    accountValueDisplay,
    availableEquityDisplay,
    leverageDisplay,
    marginUsageDisplay,
  } = currentAccountDisplay;

  useEffect(() => {
    const equityDelta = transformDecimals(
      depositTokenAmount.value.bn,
      depositTokenExtended?.decimals ?? AMOUNT_DECIMALS,
      AMOUNT_DECIMALS,
    );
    setEquityDelta(equityDelta);
    return () => {
      setEquityDelta(constants.Zero);
    };
  }, [depositTokenAmount.value.bn.toString(), depositTokenExtended?.address]);

  const {
    accountValueDisplay: nextAccountValueDisplay,
    availableEquityDisplay: nextAvailableEquityDisplay,
    leverageDisplay: nextLeverageDisplay,
    marginUsageDisplay: nextMarginUsageDisplay,
  } = convertPartial(simulated?.nextAccountDisplay);

  const isReadyToDeposit =
    network &&
    !isLoadingBalances[network] &&
    !isProcessing &&
    depositTokenAmount.value.bn.gt(0) &&
    !isOverBalance;

  return (
    <div
      id="trade-deposit-form"
      className={classNames(classes.wrapper, {
        [classes.mobileWrapper]: isMobile,
        "uk-margin-small-top": !isMobile,
      })}
    >
      {isMobile && (
        <div
          className={classNames(
            "uk-flex uk-flex-between",
            classes.mobileHeader,
          )}
        >
          <div>
            <FontAwesomeIcon
              className="uk-margin-small-right"
              icon={["far", "arrow-down-to-bracket"]}
            />
            {t.deposit}
          </div>
          <div onClick={onClose}>
            <FontAwesomeIcon icon={["far", "chevron-down"]} />
          </div>
        </div>
      )}

      <div>
        <SelectTradeDepositToken
          id={depositTokenSelectId}
          onChange={onChangeDepositToken}
          value={(depositTokenExtended?.symbol as DepositTokenSymbol) || ""}
          showBalance
          showSelected
        />

        <InputNumberWithBalance
          wrapperClassName="uk-margin-small-top"
          value={depositTokenAmount.value}
          onChange={onChangeDepositTokenAmount}
          id={depositTokenAmountId}
          network={network ?? undefined}
          tokenSymbol={depositTokenExtended?.symbol}
          label={t.amount}
          placeholder={"amount to deposit"}
          fractionalMaxButtons={[0.25, 0.5, 0.75]}
          fractionalMaxDecimals={USD_DISPLAY_DECIMALS}
          disabled={isProcessing}
          onIsOverBalance={setIsOverBalance}
        />
      </div>

      <div className="uk-margin-small-top">
        <TradeDepositRow
          left={t.accountValue}
          right={
            <span id="deposit-value-amount">
              <span>{accountValueDisplay}</span>
              {depositTokenAmount.value.bn.gt(0) && (
                <span>
                  <RightArrow />
                  {nextAccountValueDisplay}
                </span>
              )}
            </span>
          }
        />

        <TradeDepositRow
          left={t.availableFunds}
          right={
            <span id="deposit-available-amount">
              <span>{availableEquityDisplay}</span>
              {depositTokenAmount.value.bn.gt(0) && (
                <span>
                  <RightArrow />
                  {nextAvailableEquityDisplay}
                </span>
              )}
            </span>
          }
        />

        <TradeDepositRow
          left={t.marginUsage}
          right={oldToNew(marginUsageDisplay, nextMarginUsageDisplay)!}
        />

        <TradeDepositRow
          left={t.accountLeverage}
          right={oldToNew(leverageDisplay, nextLeverageDisplay)!}
        />
      </div>

      <ButtonSmart
        id={`button-${id}`}
        network={network ?? undefined}
        className={classNames("uk-margin-small-top", {
          ready: isReadyToDeposit,
          sign: !isSigningDone.current,
          approve: isApprovalRequired,
        })}
        expand
        onClick={deposit}
        loading={isProcessing || isTermsModalOpen}
        disabled={!isReadyToDeposit}
      >
        <TradeDepositButtonContent
          tokenSymbol={depositToken}
          allowance={allowance}
          depositToken={depositTokenExtended}
          depositTokenAmount={depositTokenAmount.value}
          isSigningDone={isSigningDone.current}
        />
      </ButtonSmart>
    </div>
  );
};

export const useDepositFunds = (
  tokenSymbol: string,
  amount: InputNumberState,
) => {
  const signer = useSigner();
  const connectedAccount = useConnectedAccount();
  const { account, createAccount } = useTrade();
  const network = useConnectedNetwork();
  const tokenExtended = useToken(tokenSymbol, network);
  const defaultTokenExtended = useToken(DEFAULT_TRADE_DEPOSIT_TOKEN, network);
  const { sendTransaction } = useSendTransaction();
  if (!tokenExtended) {
    throw new Error(`token info not found for ${tokenSymbol}`);
  }
  if (!defaultTokenExtended) {
    throw new Error("default trade token not found");
  }
  const isPsmToken =
    tokenExtended.address.toLowerCase() !==
    defaultTokenExtended.address.toLowerCase();
  const psmToken = isPsmToken ? tokenExtended.address : undefined;
  // The amount may be in a token with a decimal count other than 18,
  // if using the PSM for example.
  // It must be converted to 18 decimals for the deposit input.
  const amountParsed = transformDecimals(
    amount.value.bn,
    tokenExtended.decimals,
    defaultTokenExtended.decimals,
  );
  /// Deposits and returns whether the deposit was successful. May throw.
  return async (): Promise<boolean> => {
    if (!signer || !connectedAccount || !tokenExtended)
      throw new Error("Must have signer, connectedAccount and tokenExtended");
    // An allowance check is necessary if depositing a PSM token, as that
    // cannot be gasless, otherwise only if gasless is arbitrarily disabled.
    // The contract has permission to burn and mint the token with gasless,
    // therefore the user does not need to approve the token.
    const shouldCheckAllowance = isPsmToken || !USE_GASLESS;
    if (shouldCheckAllowance) {
      await ensureHasAllowance(
        connectedAccount,
        tokenExtended,
        getTokenTransferProxyAddress(network as TokenTransferProxyNetwork),
        signer,
        amount.value.bn,
        sendTransaction,
      );
    }
    if (!account) {
      return !!(await createAccount(signer, amountParsed, psmToken));
    }
    await account.deposit({
      signer,
      amount: amountParsed,
      token: defaultTokenExtended,
      useGasless: USE_GASLESS,
      psmToken,
    });
    return true;
  };
};

const TradeDepositButtonContent = (props: TradeDepositButtonProps) => {
  const {
    tokenSymbol,
    isSigningDone,
    depositTokenAmount,
    allowance,
    depositToken,
  } = props;
  const { t } = useLanguageStore();

  if (!depositToken) {
    console.error("Token not found for symbol", tokenSymbol);
    return null;
  }

  if (depositTokenAmount.bn.gt(0) && !isSigningDone)
    return <span>{t.signTermsOfUse}</span>;

  if (
    !USE_GASLESS &&
    depositTokenAmount.bn.gt(0) &&
    allowance?.lt(depositTokenAmount.bn)
  )
    return (
      <TradeDepositButtonContentInternal
        depositToken={depositToken}
        buttonText={t.approveDepositOf}
      />
    );

  return (
    <TradeDepositButtonContentInternal
      depositToken={depositToken}
      buttonText={t.deposit}
    />
  );
};

const TradeDepositButtonContentInternal = ({
  depositToken,
  buttonText,
}: {
  depositToken: TokenInfo;
  buttonText: string;
}) => (
  <span className="uk-flex uk-flex-middle uk-flex-center">
    <FontAwesomeIcon
      className="uk-margin-small-right"
      icon={["far", "arrow-down-to-bracket"]}
    />
    {buttonText}
    <TradeDepositAndWithdrawButtonImage token={depositToken} />
    {depositToken?.symbol}
  </span>
);

export default TradeDeposit;
