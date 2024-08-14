import classNames from "classnames";
import React, { useEffect } from "react";
import { useLanguageStore } from "../../../context/Translation";
import { transformDecimals, uniqueId } from "../../../utils/general";
import ButtonSmart from "../../ButtonSmart/ButtonSmart";
import classes from "./TradeWithdraw.module.scss";
import { TradeWithdrawRow } from "./TradeWithdrawRow";
import useInputNumberState from "../../../hooks/useInputNumberState";
import InputNumber, { InputNumberValue } from "../../InputNumber/InputNumber";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import { useToken } from "../../../context/TokenManager";
import { useUiStore } from "../../../context/UserInterface";
import { useTrade } from "../../../context/Trade";
import { getTradeAccountWithdrawNotifications } from "../../../config/notifications";
import { TokenInfo, trade } from "handle-sdk";
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
import { RightArrow } from "../../RightArrow";
import useSendTransaction, {
  handleSendTransactionError,
} from "../../../hooks/useSendTransaction";
import { USD_DISPLAY_DECIMALS } from "../../../utils/trade";
import { useUserBalanceStore } from "../../../context/UserBalances";
import { shouldShowApprovalAndPendingNotification } from "../../../utils/wallet";
import { bnToDisplayString } from "../../../utils/format";
import { AMOUNT_DECIMALS } from "handle-sdk/dist/components/trade";
import { constants, ethers } from "ethers";
import { ensureHasAllowance } from "../../../utils/ensureHasAllowance";
import SelectTradeWithdrawToken, {
  WithdrawTokenSymbol,
} from "./SelectTradeWithdrawToken";
import { TokenTransferProxyNetwork } from "handle-sdk/dist/types/network";
import { getTokenTransferProxyAddress } from "handle-sdk/dist/utils/convert";
import { useTradeAccountDisplay } from "../../../context/TradeAccountDisplay";
import { convertPartial } from "../../../utils/priceError";
import { useTradeSize } from "../../../context/TradeSize";
import { TradeDepositAndWithdrawButtonImage } from "../TradeDepositAndWithdrawButtonImage/TradeDepositAndWithdrawButtonImage";
import { TranslationMap } from "../../../types/translation";

export type TradeWithdrawProps = {
  onClose: () => void;
};

const TradeWithdraw = ({ onClose }: TradeWithdrawProps) => {
  const { isMobile } = useUiStore();
  const { account, withdrawGasFee } = useTrade();
  const { t } = useLanguageStore();
  const signer = useSigner();
  const connectedAccount = useConnectedAccount();
  const { refreshBalance } = useUserBalanceStore();
  const network = useConnectedNetwork();
  const { walletChoice } = useUserWalletStore();
  const { sendTransaction } = useSendTransaction();

  const [isTransactionInProgress, setIsTransactionInProgress] =
    React.useState(false);

  const id = React.useMemo(() => `trade-withdraw-${uniqueId(5)}`, []);
  const withdrawTokenSelectId = `${id}-token-select`;

  const [withdrawToken, setWithdrawToken] = React.useState<WithdrawTokenSymbol>(
    DEFAULT_TRADE_DEPOSIT_TOKEN,
  );
  const withdrawTokenExtended = useToken(withdrawToken, network ?? undefined);
  const defaultTokenExtended = useToken(DEFAULT_TRADE_DEPOSIT_TOKEN, network);
  // This amount always has 18 decimals, regardless of withdraw token selected,
  // because it is passed in the InputNumber component prop.
  const withdrawTokenAmountInDefaultDecimals = useInputNumberState();
  const onChangeWithdrawToken = (symbol: WithdrawTokenSymbol) => {
    withdrawTokenAmountInDefaultDecimals.reset();
    setWithdrawToken(symbol);
  };
  const onChangeWithdrawAmount = (input: InputNumberValue) => {
    withdrawTokenAmountInDefaultDecimals.onChange(input);
  };

  const withdrawTokenAmountId = `${id}-amount`;

  const { currentAccountDisplay, simulated } = useTradeAccountDisplay(true);
  const { setEquityDelta } = useTradeSize();
  const {
    leverageDisplay,
    accountValueDisplay,
    availableEquityDisplay,
    marginUsageDisplay,
  } = currentAccountDisplay;

  useEffect(() => {
    const equityDelta = withdrawTokenAmountInDefaultDecimals.value.bn.mul("-1");
    setEquityDelta(equityDelta);
    return () => {
      setEquityDelta(constants.Zero);
    };
  }, [withdrawTokenAmountInDefaultDecimals]);

  const {
    leverageDisplay: nextLeverageDisplay,
    accountValueDisplay: nextAccountValueDisplay,
    availableEquityDisplay: nextAvailableEquityDisplay,
    marginUsageDisplay: nextMarginUsageDisplay,
  } = convertPartial(simulated?.nextAccountDisplay);

  const withdrawGasFeeToDisplay = `${bnToDisplayString(
    withdrawGasFee,
    AMOUNT_DECIMALS,
    USD_DISPLAY_DECIMALS,
  )} USD`;
  const withdrawAmountMinusFee =
    withdrawTokenAmountInDefaultDecimals.value.bn.gte(withdrawGasFee)
      ? withdrawTokenAmountInDefaultDecimals.value.bn.sub(withdrawGasFee)
      : ethers.constants.Zero;
  const withdrawAmountMinusFeeToDisplay = `${bnToDisplayString(
    withdrawAmountMinusFee,
    AMOUNT_DECIMALS,
    USD_DISPLAY_DECIMALS,
  )} USD`;

  const withdrawAmountTooltip = `title: ${t.withdrawAmountTooltip.replace(
    "#fee#",
    withdrawGasFeeToDisplay,
  )}; pos: left;`;
  const canWithdraw =
    withdrawTokenAmountInDefaultDecimals.value.bn.gt(withdrawGasFee);

  const withdraw = async () => {
    if (
      !connectedAccount ||
      !signer ||
      !withdrawTokenExtended ||
      !defaultTokenExtended
    ) {
      return;
    }

    setIsTransactionInProgress(true);
    // The withdrawal amount in the decimals of the withdrawal token.
    // For example if withdrawing via PSM for USDC, this is 6 decimals.
    const withdrawTokenAmount = transformDecimals(
      withdrawTokenAmountInDefaultDecimals.value.bn,
      AMOUNT_DECIMALS,
      withdrawTokenExtended.decimals,
    );
    const withdrawGasFeeInTokenDecimals = transformDecimals(
      withdrawGasFee,
      AMOUNT_DECIMALS,
      withdrawTokenExtended.decimals,
    );
    const notifications = getTradeAccountWithdrawNotifications({
      token: withdrawTokenExtended,
      amount: withdrawTokenAmount,
      fee: withdrawGasFeeInTokenDecimals,
    });
    const isPsmToken =
      withdrawTokenExtended.address.toLowerCase() !==
      defaultTokenExtended.address.toLowerCase();
    const psmToken = isPsmToken ? withdrawTokenExtended.address : undefined;

    try {
      if (isPsmToken) {
        // fxUSD must be approved for the token transfer proxy to route
        // it to a PSM token, e.g. DAI.
        await ensureHasAllowance(
          connectedAccount,
          defaultTokenExtended,
          getTokenTransferProxyAddress(network as TokenTransferProxyNetwork),
          signer,
          withdrawTokenAmount,
          sendTransaction,
        );
      }

      const preWithdrawalNotification = showNotification({
        status: shouldShowApprovalAndPendingNotification(walletChoice)
          ? "pending"
          : "info",
        message: shouldShowApprovalAndPendingNotification(walletChoice)
          ? notifications.awaitingApproval
          : notifications.pending,
      });

      await account?.withdraw({
        signer,
        amount: withdrawTokenAmountInDefaultDecimals.value.bn,
        receiver: connectedAccount,
        token: defaultTokenExtended,
        psmToken,
      });
      preWithdrawalNotification.close();
      showNotification({ status: "success", message: notifications.success });
      withdrawTokenAmountInDefaultDecimals.reset();
      account?.onUpdate?.();
      refreshBalance(network);
      onClose();
    } catch (e: any) {
      console.log("withdraw error", e);
      closeAllNotifications();
      handleSendTransactionError(e);
    }

    setIsTransactionInProgress(false);
  };

  return (
    <div
      id="trade-withdraw-form"
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
              icon={["far", "arrow-up-from-bracket"]}
            />
            {t.withdraw}
          </div>
          <div onClick={onClose}>
            <FontAwesomeIcon icon={["far", "chevron-down"]} />
          </div>
        </div>
      )}

      <div>
        <SelectTradeWithdrawToken
          id={withdrawTokenSelectId}
          onChange={onChangeWithdrawToken}
          value={(withdrawTokenExtended?.symbol as WithdrawTokenSymbol) || ""}
          showBalance
          showSelected
        />

        <InputNumber
          rightLabel={`${t.available}: ${availableEquityDisplay}`}
          wrapperClassName="uk-margin-small-top"
          value={withdrawTokenAmountInDefaultDecimals.value}
          onChange={onChangeWithdrawAmount}
          id={withdrawTokenAmountId}
          label={t.amount}
          placeholder={"amount to withdraw"}
          decimals={trade.AMOUNT_DECIMALS}
          max={account?.getAvailableEquity()}
          fractionalMaxButtons={[0.25, 0.5, 0.75]}
          fractionalMaxDecimals={USD_DISPLAY_DECIMALS}
        />
      </div>

      <div className="uk-margin-small-top">
        <TradeWithdrawRow
          classes="uk-margin-small-bottom"
          left={"you receive"}
          right={
            <span
              className={classes.withdrawText}
              uk-tooltip={withdrawAmountTooltip}
            >
              <span className="uk-tooltip-content withdraw">
                {withdrawAmountMinusFeeToDisplay}
              </span>
            </span>
          }
        />
        <TradeWithdrawRow
          left={"account value"}
          right={
            <span>
              <span>{accountValueDisplay}</span>
              {withdrawTokenAmountInDefaultDecimals.value.bn.gt(0) && (
                <span>
                  <RightArrow />
                  {nextAccountValueDisplay}
                </span>
              )}
            </span>
          }
        />
        <TradeWithdrawRow
          left={"available funds"}
          right={
            <span>
              <span>{availableEquityDisplay}</span>
              {withdrawTokenAmountInDefaultDecimals.value.bn.gt(0) && (
                <span>
                  <RightArrow />
                  {nextAvailableEquityDisplay}
                </span>
              )}
            </span>
          }
        />
        <TradeWithdrawRow
          left={"margin usage"}
          right={
            <span>
              <span>{marginUsageDisplay}</span>
              {withdrawTokenAmountInDefaultDecimals.value.bn.gt(0) && (
                <span>
                  <RightArrow />
                  {nextMarginUsageDisplay}
                </span>
              )}
            </span>
          }
        />
        <TradeWithdrawRow
          left={t.accountLeverage}
          right={
            <span>
              <span>{leverageDisplay}</span>
              {withdrawTokenAmountInDefaultDecimals.value.bn.gt(0) && (
                <span>
                  <RightArrow />
                  {nextLeverageDisplay}
                </span>
              )}
            </span>
          }
        />
      </div>

      <ButtonSmart
        id={`button-${id}`}
        network={network}
        className={classNames("uk-margin-small-top", {
          ready: !isTransactionInProgress && canWithdraw,
        })}
        expand
        onClick={withdraw}
        loading={isTransactionInProgress}
        disabled={!canWithdraw}
      >
        <TradeWithdrawButtonContent
          tokenSymbol={withdrawToken}
          token={withdrawTokenExtended}
          t={t}
        />
      </ButtonSmart>
    </div>
  );
};

const TradeWithdrawButtonContent = ({
  tokenSymbol,
  token,
  t,
}: {
  tokenSymbol: string;
  token: TokenInfo | undefined;
  t: TranslationMap;
}) => {
  if (!token) {
    console.error("Token not found for symbol", tokenSymbol);
    return null;
  }
  return (
    <span className="uk-flex uk-flex-middle uk-flex-center">
      <FontAwesomeIcon
        className="uk-margin-small-right"
        icon={["far", "arrow-up-from-bracket"]}
      />
      <span className="uk-margin-xsmall-right">{t.withdraw}</span>
      <TradeDepositAndWithdrawButtonImage token={token} />
      {token.symbol}
    </span>
  );
};

export default TradeWithdraw;
