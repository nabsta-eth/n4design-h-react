import { BigNumber, ethers, providers } from "ethers";
import { Network, TokenInfo, trade } from "handle-sdk";
import { LOCK_TOKEN_SYMBOL } from "../components/GovernancePool";
import { getTransfersFromLogs } from "../utils/convert/getTransfersFromLogs";
import {
  bnToDisplayString,
  getImageString,
  truncateAddress,
} from "../utils/format";
import {
  getExplorerMetadata,
  getTokenImageUriWithFallback,
} from "../utils/general";
import {
  Notify,
  TransactionNotification,
} from "@handle-fi/react-components/dist/utils/notifications";
import { TranslationMap } from "../types/translation";
import { Pair } from "handle-sdk/dist/types/trade";
import {
  AMOUNT_DECIMALS,
  Instrument,
  PRICE_DECIMALS,
} from "handle-sdk/dist/components/trade";
import {
  LOT_SIZE_MAX_DECIMALS,
  PRICE_UNIT,
  USD_DISPLAY_DECIMALS,
} from "../utils/trade";
import { TradeFormInputHook } from "../hooks/trade/useTradeFormInput";
import { TRADE_LP_DEFAULT_CURRENCY_SYMBOL } from "./trade";
import { pairToString } from "handle-sdk/dist/utils/general";
import { SpritesheetIcon } from "@handle-fi/react-components/dist/components/SpritesheetIcon/SpritesheetIcon";
import { renderToStaticMarkup } from "react-dom/server";
import { NETWORK_NAME_TO_LOGO_URL } from "@handle-fi/react-components";

const ICON_STYLE = "margin-right: 6px; margin-top: -2px;";
const ICON_SIZE = 16;
const FOREX_SYMBOL_AND_ICON = `${getImageString(
  `https://arbiscan.io/token/images/handlefi_32.png`,
  "FOREX",
  16,
  ICON_STYLE,
)}FOREX`;

type ConvertNotificationData = {
  fromToken: TokenInfo;
  toToken: TokenInfo;
  fromAmount: ethers.BigNumber;
  toAmount: ethers.BigNumber;
};

const DEFAULT_DISPLAY_DECIMALS = 4;

export const DEFAULT_NOTIFICATIONS = {
  awaitingApproval: "awaiting approval",
  pending: "submitting transaction",
  success: "transaction successful",
  error: "error message goes here",
};

export const DEFAULT_SUBMIT_NOTIFICATION_TIMEOUT = 2;

export const ADMIN_NOTIFICATIONS = DEFAULT_NOTIFICATIONS;

export const DEFAULT_SUBMIT_NOTIFICATION: Notify = {
  status: "info",
  message: "submitting transaction, please wait...",
  timeoutInSeconds: DEFAULT_SUBMIT_NOTIFICATION_TIMEOUT,
};

export const getConvertNotifications = ({
  fromToken,
  toToken,
  fromAmount,
  toAmount,
}: ConvertNotificationData): TransactionNotification => {
  const fromTokenDisplay = getTokenDisplayString(fromToken, fromAmount);
  const toTokenDisplay = getTokenDisplayString(toToken, toAmount);
  const success = `successfully converted ${fromTokenDisplay} to ${toTokenDisplay}`;

  return {
    awaitingApproval: `follow wallet instructions to approve convert of ${fromTokenDisplay} to ${toTokenDisplay}`,
    pending: "convert transaction pending",
    success: success,
    error: "convert transaction failed",
  };
};

export const getConvertSuccessNotificationFromReceipt = (
  network: Network,
  fromToken: TokenInfo,
  toToken: TokenInfo,
  fromAmountQuote: BigNumber,
  toAmountQuote: BigNumber,
  receipt: providers.TransactionReceipt,
) => {
  let { fromAmount, toAmount } = getTransfersFromLogs(
    receipt,
    fromToken.address,
    toToken.address,
  );

  // It is difficult to gather the eth transfers, so instead replace them
  // with the quoted amounts
  if (fromToken.extensions?.isNative) fromAmount = fromAmountQuote;
  if (toToken.extensions?.isNative) toAmount = toAmountQuote;

  const fromTokenDisplay = getTokenDisplayString(fromToken, fromAmount);
  const toTokenDisplay = getTokenDisplayString(toToken, toAmount);
  const blockExplorerDisplay = getBlockExplorerDisplayString(receipt, network);
  return `successfully converted ${fromTokenDisplay} to ${toTokenDisplay}${blockExplorerDisplay}`;
};

const getTokenDisplayString = (
  token: TokenInfo,
  amount: ethers.BigNumber,
  decimals?: number,
) => {
  const imageUriWithFallback = getTokenImageUriWithFallback(token);
  const tokenIconString = imageUriWithFallback
    ? getImageString(imageUriWithFallback, token.symbol, ICON_SIZE, ICON_STYLE)
    : "";
  const tokenIconStringWithSymbol = `${tokenIconString}${token.symbol}`;
  return `${bnToDisplayString(
    amount,
    token.decimals,
    decimals ?? DEFAULT_DISPLAY_DECIMALS,
  )} ${tokenIconStringWithSymbol}`;
};

const getBlockExplorerDisplayString = (
  receipt: providers.TransactionReceipt,
  network: Network,
) => {
  const explorerMetadata = getExplorerMetadata(
    receipt.transactionHash,
    "tx",
    network,
  );
  return `... view on <a class="hfi-notification-link" href="${explorerMetadata.url}" target="_blank">${explorerMetadata.name}</a>`;
};

export const getBlockExplorerDisplayStringFromHash = (
  transactionHash: string,
  network: Network,
) => {
  const explorerMetadata = getExplorerMetadata(transactionHash, "tx", network);
  return `... view on <a class="hfi-notification-link" href="${explorerMetadata.url}" target="_blank">${explorerMetadata.name}</a>`;
};

export type BridgeNotificationArgs = {
  fromNetwork: Network;
  toNetwork: Network;
  amount: ethers.BigNumber;
  token: TokenInfo;
};

const getBridgeNotificationBaseMessage = ({
  fromNetwork,
  toNetwork,
  amount,
  token,
}: BridgeNotificationArgs): string => {
  const imageUriWithFallback = getTokenImageUriWithFallback(token);
  const tokenIconString = imageUriWithFallback
    ? getImageString(imageUriWithFallback, token.symbol, ICON_SIZE, ICON_STYLE)
    : "";
  const toTokenIconStringWithSymbol = `${tokenIconString}${token.symbol}`;
  const tokenAmountDisplay = `${bnToDisplayString(
    amount,
    token.decimals,
    DEFAULT_DISPLAY_DECIMALS,
  )} ${toTokenIconStringWithSymbol}`;
  const fromNetworkIconString = getImageString(
    NETWORK_NAME_TO_LOGO_URL[fromNetwork],
    fromNetwork,
    16,
    ICON_STYLE,
  );
  const toNetworkIconString = getImageString(
    NETWORK_NAME_TO_LOGO_URL[toNetwork],
    toNetwork,
    16,
    ICON_STYLE,
  );
  return (
    `${tokenAmountDisplay} from ${fromNetworkIconString}` +
    `${fromNetwork} to ${toNetworkIconString}${toNetwork}`
  );
};

export const getBridgeDepositNotifications = (
  args: BridgeNotificationArgs,
): TransactionNotification => {
  const base = getBridgeNotificationBaseMessage(args);
  return {
    awaitingApproval: `follow wallet instructions to approve bridging ${base}`,
    pending: `initiating bridging of ${base}`,
    success: `successfully initiated bridging of ${base}`,
    error: "bridge transaction failed",
  };
};

export const getBridgeDepositSuccessNotificationFromReceipt = (
  fromNetwork: Network,
  toNetwork: Network,
  token: TokenInfo,
  amount: BigNumber,
  receipt: providers.TransactionReceipt,
) => {
  const bridgeDepositNotifications = getBridgeDepositNotifications({
    fromNetwork,
    toNetwork,
    amount,
    token,
  });

  const blockExplorerDisplay = getBlockExplorerDisplayString(
    receipt,
    fromNetwork,
  );
  return `${bridgeDepositNotifications.success}${blockExplorerDisplay}`;
};

export const getBridgeWithdrawNotifications = (
  args: BridgeNotificationArgs,
): TransactionNotification => {
  const base = getBridgeNotificationBaseMessage(args);
  return {
    awaitingApproval: "", // not used
    pending: `processing bridge withdrawal of ${base}`,
    success: `successfully bridged ${base}`,
    error: "bridge withdrawal failed",
  };
};

export const getBridgeWithdrawSuccessNotificationFromReceipt = (
  fromNetwork: Network,
  toNetwork: Network,
  token: TokenInfo,
  amount: BigNumber,
  receipt: providers.TransactionReceipt,
) => {
  const bridgeWithdrawNotifications = getBridgeWithdrawNotifications({
    fromNetwork,
    toNetwork,
    amount,
    token,
  });

  const blockExplorerDisplay = getBlockExplorerDisplayString(
    receipt,
    fromNetwork,
  );
  return `${bridgeWithdrawNotifications.success}${blockExplorerDisplay}`;
};

type SendTokenNotificationData = {
  amount: ethers.BigNumber;
  token: TokenInfo;
  to: string;
  network: Network;
};

export const getSendTokenNotifications = ({
  amount,
  to,
  token,
  network,
}: SendTokenNotificationData): TransactionNotification => {
  const imageUriWithFallback = getTokenImageUriWithFallback(token);
  const tokenIconString = imageUriWithFallback
    ? getImageString(imageUriWithFallback, token.symbol, ICON_SIZE, ICON_STYLE)
    : "";
  // TODO: remove until can convert to spritesheet icon
  const tokenIconStringWithSymbol = `${tokenIconString}${token.symbol}`;
  const tokenAmountDisplay = `${bnToDisplayString(
    amount,
    token.decimals,
    DEFAULT_DISPLAY_DECIMALS,
  )} ${tokenIconStringWithSymbol}`;

  const explorerMetadata = getExplorerMetadata(to, "address", network);

  const addressLink = `<a class="hfi-notification-link" href="${
    explorerMetadata.url
  }" target="_blank">${truncateAddress(to)}</a>`;
  const base = `${tokenAmountDisplay} to ${addressLink}`;

  return {
    awaitingApproval: `follow wallet instructions to approve sending ${base}`,
    pending: `transaction pending to send ${base}`,
    success: `successfully sent ${base}`,
    error: "sending failed",
  };
};

type KeeperPoolNotificationData = {
  amount: ethers.BigNumber;
  token: TokenInfo;
};

export const getKeeperPoolStakeNotifications = ({
  amount,
  token,
}: KeeperPoolNotificationData): TransactionNotification => {
  const imageUriWithFallback = getTokenImageUriWithFallback(token);
  const tokenIconString = imageUriWithFallback
    ? getImageString(imageUriWithFallback, token.symbol, ICON_SIZE, ICON_STYLE)
    : "";
  const tokenIconStringWithSymbol = `${tokenIconString}${token.symbol}`;
  const tokenAmountDisplay = `${bnToDisplayString(
    amount,
    token.decimals,
    2,
    DEFAULT_DISPLAY_DECIMALS,
  )} ${tokenIconStringWithSymbol}`;

  const base = `${tokenAmountDisplay} into the ${tokenIconStringWithSymbol} keeper pool`;

  return {
    awaitingApproval: `follow wallet instructions to approve deposit of ${base}`,
    pending: `transaction pending to deposit ${base}`,
    success: `successfully deposited ${base}`,
    error: "deposit failed",
  };
};

export const getKeeperPoolUnStakeNotifications = ({
  amount,
  token,
}: KeeperPoolNotificationData): TransactionNotification => {
  const imageUriWithFallback = getTokenImageUriWithFallback(token);
  const tokenIconString = imageUriWithFallback
    ? getImageString(imageUriWithFallback, token.symbol, ICON_SIZE, ICON_STYLE)
    : "";
  const tokenIconStringWithSymbol = `${tokenIconString}${token.symbol}`;
  const tokenAmountDisplay = `${bnToDisplayString(
    amount,
    token.decimals,
    2,
    DEFAULT_DISPLAY_DECIMALS,
  )} ${tokenIconStringWithSymbol}`;

  const base = `${tokenAmountDisplay} from the ${tokenIconStringWithSymbol} keeper pool`;

  return {
    awaitingApproval: `follow wallet instructions to approve withdrawal of ${base}`,
    pending: `transaction pending to withdraw ${base}`,
    success: `successfully withdrew ${base}`,
    error: "withdraw failed",
  };
};

type BorrowNotificationData = {
  borrowAmount: ethers.BigNumber;
  borrowToken: TokenInfo;
  depositAmount: ethers.BigNumber;
  depositToken: TokenInfo;
};

export const getBorrowNotifications = ({
  borrowAmount,
  borrowToken,
  depositAmount,
  depositToken,
}: BorrowNotificationData): TransactionNotification => {
  const borrowTokenimageUriWithFallback =
    getTokenImageUriWithFallback(borrowToken);
  const borrowTokenIconString = borrowTokenimageUriWithFallback
    ? getImageString(
        borrowTokenimageUriWithFallback,
        borrowToken.symbol,
        ICON_SIZE,
        ICON_STYLE,
      )
    : "";
  const borrowTokenIconStringWithSymbol = `${borrowTokenIconString}${borrowToken.symbol}`;

  const borrowAmountDisplay = borrowAmount.gt(0)
    ? `${bnToDisplayString(
        borrowAmount,
        borrowToken.decimals,
        2,
        DEFAULT_DISPLAY_DECIMALS,
      )} ${borrowTokenIconStringWithSymbol}`
    : undefined;

  const depositTokenimageUriWithFallback =
    getTokenImageUriWithFallback(depositToken);
  const depositTokenIconString = depositTokenimageUriWithFallback
    ? getImageString(
        depositTokenimageUriWithFallback,
        depositToken.symbol,
        ICON_SIZE,
        ICON_STYLE,
      )
    : "";
  const depositTokenIconStringWithSymbol = `${depositTokenIconString}${depositToken.symbol}`;

  const depositAmountDisplay = depositAmount.gt(0)
    ? `${bnToDisplayString(
        depositAmount,
        depositToken.decimals,
        DEFAULT_DISPLAY_DECIMALS,
      )} ${depositTokenIconStringWithSymbol}`
    : undefined;

  const getBase = (args: { borrowTense: string; depositTense: string }) => {
    const deposit = depositAmountDisplay
      ? `${args.depositTense} ${depositAmountDisplay}`
      : undefined;

    const borrow = borrowAmountDisplay
      ? `${args.borrowTense} ${borrowAmountDisplay}`
      : undefined;

    return `${deposit ?? ""}${deposit && borrow ? " & " : ""}${borrow ?? ""}`;
  };

  return {
    awaitingApproval: `follow wallet instructions to ${getBase({
      borrowTense: "borrow",
      depositTense: "deposit",
    })}`,
    pending: `transaction pending to ${getBase({
      borrowTense: "borrow",
      depositTense: "deposit",
    })}`,
    success: `successfully ${getBase({
      borrowTense: "borrowed",
      depositTense: "deposited",
    })}`,
    error: "borrowing failed",
  };
};

type RepayNotificationData = {
  amount: ethers.BigNumber;
  token: TokenInfo;
};

export const getRepayNotifications = ({
  amount,
  token,
}: RepayNotificationData): TransactionNotification => {
  const imageUriWithFallback = getTokenImageUriWithFallback(token);
  const tokenIconString = imageUriWithFallback
    ? getImageString(imageUriWithFallback, token.symbol, ICON_SIZE, ICON_STYLE)
    : "";
  const tokenIconStringWithSymbol = `${tokenIconString}${token.symbol}`;
  const tokenAmountDisplay = `${bnToDisplayString(
    amount,
    token.decimals,
    2,
    DEFAULT_DISPLAY_DECIMALS,
  )} ${tokenIconStringWithSymbol}`;

  return {
    awaitingApproval: `follow wallet instructions to repay ${tokenAmountDisplay}`,
    pending: `transaction pending to repay ${tokenAmountDisplay}`,
    success: `successfully repaid ${tokenAmountDisplay}`,
    error: "repay failed",
  };
};

type WithdrawCollateralNotificationData = {
  amount: ethers.BigNumber;
  token: TokenInfo;
};

export const getWithdrawCollateralNotifications = ({
  amount,
  token,
}: WithdrawCollateralNotificationData): TransactionNotification => {
  const imageUriWithFallback = getTokenImageUriWithFallback(token);
  const tokenIconString = imageUriWithFallback
    ? getImageString(imageUriWithFallback, token.symbol, ICON_SIZE, ICON_STYLE)
    : "";
  const tokenIconStringWithSymbol = `${tokenIconString}${token.symbol}`;
  const tokenAmountDisplay = `${bnToDisplayString(
    amount,
    token.decimals,
    DEFAULT_DISPLAY_DECIMALS,
  )} ${tokenIconStringWithSymbol}`;

  return {
    awaitingApproval: `follow wallet instructions to withdraw ${tokenAmountDisplay}`,
    pending: `transaction pending to withdraw ${tokenAmountDisplay}`,
    success: `successfully withdrew ${tokenAmountDisplay}`,
    error: "withdraw failed",
  };
};

export const getAllowanceNotifications = (
  token: TokenInfo,
): TransactionNotification => {
  const imageUriWithFallback = getTokenImageUriWithFallback(token);
  const tokenIconString = imageUriWithFallback
    ? getImageString(imageUriWithFallback, token.symbol, ICON_SIZE, ICON_STYLE)
    : "";
  const tokenIconStringWithSymbol = `${tokenIconString}${token.symbol}`;

  return {
    awaitingApproval: `follow wallet instructions to allow handle to use your ${tokenIconStringWithSymbol}`,
    pending: `transaction pending to allow handle to use your ${tokenIconStringWithSymbol}`,
    success: `successfully allowed handle to use ${tokenIconStringWithSymbol}`,
    error: "setting allowance failed",
  };
};

type ClaimRewardsNotificationData = {
  amount?: ethers.BigNumber;
};

export const getClaimedRewardsNotification = ({
  amount,
}: ClaimRewardsNotificationData): TransactionNotification => {
  const amountPrefix = amount
    ? `${bnToDisplayString(amount, 18, 4)} ${FOREX_SYMBOL_AND_ICON} `
    : "";
  const base = `${amountPrefix}rewards`;

  return {
    awaitingApproval: `follow wallet instructions to claim your ${base}`,
    pending: `transaction pending to claim your ${base}`,
    success: `successfully claimed ${base}`,
    error: "claim failed",
  };
};

type CreateGovernanceLockNotificationData = {
  amount: ethers.BigNumber;
  durationString: string;
};

export const getCreateGovernanceLockNotifications = ({
  amount,
  durationString,
}: CreateGovernanceLockNotificationData): TransactionNotification => {
  const base = `${bnToDisplayString(
    amount,
    18,
    4,
  )} ${LOCK_TOKEN_SYMBOL} for ${durationString}`;

  return {
    awaitingApproval: `follow wallet instructions to lock ${base}`,
    pending: `transaction pending to lock your ${base}`,
    success: `successfully locked ${base}`,
    error: "locking failed",
  };
};

type IncreaseGovernanceLockDurationNotificationData = {
  durationString: string;
};

export const getIncreaseGovernanceLockDurationNotifications = ({
  durationString,
}: IncreaseGovernanceLockDurationNotificationData): TransactionNotification => {
  const base = `your lock by ${durationString}`;

  return {
    awaitingApproval: `follow wallet instructions to extend ${base}`,
    pending: `transaction pending to extend ${base}`,
    success: `successfully extended ${base}`,
    error: "extending lock failed",
  };
};

type IncreaseGovernanceLockAmountNotificationData = {
  amount: ethers.BigNumber;
};

export const getIncreaseGovernanceLockAmountNotifications = ({
  amount,
}: IncreaseGovernanceLockAmountNotificationData): TransactionNotification => {
  const base = `${bnToDisplayString(amount, 18, 4)} ${LOCK_TOKEN_SYMBOL}`;

  return {
    awaitingApproval: `follow wallet instructions to lock ${base}`,
    pending: `transaction pending to lock your ${base}`,
    success: `successfully locked ${base}`,
    error: "locking failed",
  };
};

type LPStakingNotificationData = {
  amount: ethers.BigNumber;
  token: TokenInfo;
  poolName: string;
};

export const getLPStakeNotifications = ({
  amount,
  token,
  poolName,
}: LPStakingNotificationData): TransactionNotification => {
  const imageUriWithFallback = getTokenImageUriWithFallback(token);
  const tokenIconString = imageUriWithFallback
    ? getImageString(imageUriWithFallback, token.symbol, ICON_SIZE, ICON_STYLE)
    : "";
  const tokenIconStringWithSymbol = `${tokenIconString}${token.symbol}`;
  const amountDisplay = `${bnToDisplayString(
    amount,
    18,
    2,
  )} ${tokenIconStringWithSymbol}`;

  const base = `${amountDisplay} ${token.symbol} into ${poolName}`;

  return {
    awaitingApproval: `follow wallet instructions to approve staking ${base}`,
    pending: `transaction pending to stake ${base}`,
    success: `successfully staked ${base}`,
    error: "staking failed",
  };
};

export const getLPUnstakeNotifications = ({
  amount,
  token,
  poolName,
}: LPStakingNotificationData): TransactionNotification => {
  const imageUriWithFallback = getTokenImageUriWithFallback(token);
  const tokenIconString = imageUriWithFallback
    ? getImageString(imageUriWithFallback, token.symbol, ICON_SIZE, ICON_STYLE)
    : "";
  const tokenIconStringWithSymbol = `${tokenIconString}${token.symbol}`;
  const tokenAmountDisplay = `${bnToDisplayString(
    amount,
    token.decimals,
    2,
    DEFAULT_DISPLAY_DECIMALS,
  )} ${tokenIconStringWithSymbol}`;

  const base = `${tokenAmountDisplay} from ${poolName}`;

  return {
    awaitingApproval: `follow wallet instructions to approve unstaking ${base}`,
    pending: `transaction pending to unstake ${base}`,
    success: `successfully unstaked ${base}`,
    error: "unstaking failed",
  };
};

export const getBuyhLPNotifications = (amount: string, tokenSymbol: string) => {
  return {
    awaitingApproval: `follow wallet instructions to approve buying hLP with ${tokenSymbol}`,
    pending: `transaction pending to buy hLP with ${tokenSymbol}`,
    success: `successfully bought hLP with ${amount} ${tokenSymbol}`,
    error: "buying hLP failed",
  };
};

export const getSellhLPNotifications = (
  amount: string,
  tokenSymbol: string,
) => {
  return {
    awaitingApproval: `follow wallet instructions to approve selling hLP for ${tokenSymbol}`,
    pending: `transaction pending to sell hLP for ${tokenSymbol}`,
    success: `successfully sold hLP with ${amount} ${tokenSymbol}`,
    error: "selling hLP failed",
  };
};

export const getEditPositionNotifications = (
  t: TranslationMap,
  isDeposit: boolean,
) => ({
  success: isDeposit ? t.collateralDeposited : t.collateralWithdrawn,
  error: t.editPositionErrorToast,
  pending: t.transactionPending,
  awaitingApproval: t.awaitingApproval,
});

export const closePositionNotifications = (t: TranslationMap) => {
  return {
    awaitingApproval: t.awaitingApproval,
    success: t.positionClosed,
    error: t.closePositionErrorToast,
    pending: t.transactionPending,
  };
};

type TradeAccountDepositNotificationData = {
  token: TokenInfo;
  amount: ethers.BigNumber;
  fee?: ethers.BigNumber;
};

export const getTradeAccountDepositNotifications = ({
  token,
  amount,
  fee,
}: TradeAccountDepositNotificationData): TransactionNotification => {
  const tokenDisplay = getTokenDisplayString(token, amount);
  const success = `successfully deposited ${tokenDisplay} into trading account`;

  return {
    awaitingApproval: `follow wallet instructions to approve deposit of ${tokenDisplay} into trading account`,
    pending: `depositing ${tokenDisplay} into trading account`,
    success: success,
    error: "deposit transaction failed",
  };
};

type TradeAccountWithdrawNotificationData = {
  token: TokenInfo;
  amount: ethers.BigNumber;
  fee?: ethers.BigNumber;
};

export const getTradeAccountWithdrawNotifications = ({
  token,
  amount,
  fee,
}: TradeAccountWithdrawNotificationData): TransactionNotification => {
  const tokenDisplay = getTokenDisplayString(token, amount);
  const feeDisplay = fee
    ? `(-${getTokenDisplayString(token, fee, USD_DISPLAY_DECIMALS)} fees) `
    : " ";
  const success = `successfully withdrawn ${tokenDisplay} ${feeDisplay}from trading account`;

  return {
    awaitingApproval: `follow wallet instructions to approve withdrawal of ${tokenDisplay} ${feeDisplay}from trading account`,
    pending: `withdrawing ${tokenDisplay} ${feeDisplay}from trading account`,
    success: success,
    error: "withdraw transaction failed",
  };
};

type OpenTradeNotificationData = {
  displaySymbolAndIcon: string;
  isLong: boolean;
  input: TradeFormInputHook;
  hasOneClickTradingWallet: boolean;
};

const getIconHtmlString = (symbol: string, size: number) => {
  const iconElement = <SpritesheetIcon iconName={symbol} sizePx={size} />;
  const iconString = renderToStaticMarkup(iconElement);
  return `<span \
    class="uk-inline-flex instrumentSymbol" \
    style="height: ${size}px; line-height: ${size}px;"\
  >${iconString}${symbol}</span>`;
};

const usePairSymbolIconStrings = (pair: Pair, instrument: Instrument) => {
  const baseTokenIconString = getIconHtmlString(pair.baseSymbol, ICON_SIZE);
  const quoteTokenIconString = !instrument.hideQuoteSymbolLogo
    ? getIconHtmlString(pair.quoteSymbol, ICON_SIZE)
    : undefined;
  return { baseTokenIconString, quoteTokenIconString };
};

/**
 * This should only be used with notifications.
 */
export const useDisplaySymbolAndIcon = (pair: Pair, instrument: Instrument) => {
  // TODO: #4047 - https://github.com/handle-fi/handle-react/issues/4047
  // Add spritesheet pair icons and replace use of getTokensImageUriWithFallback.
  return `${pairToString(pair)}`;
};

export const getTradeNotifications = ({
  displaySymbolAndIcon,
  isLong,
  input,
  hasOneClickTradingWallet,
}: OpenTradeNotificationData): Partial<TransactionNotification> => {
  const preFillSide = isLong ? "buying" : "selling";

  // <action>
  const prefix = `<span class="${
    isLong ? "hfi-up" : "hfi-down"
  } uk-display-inline">${preFillSide}</span>`;

  const isLpc = input.userInputType === "Lpc";

  // ~ <lpc amount> <lpc symbol> or <size>
  const messageAmount = `${bnToDisplayString(
    input.userInputValue,
    AMOUNT_DECIMALS,
    USD_DISPLAY_DECIMALS,
    input.decimals,
  )} ${isLpc ? TRADE_LP_DEFAULT_CURRENCY_SYMBOL : "lots"}`;

  const otherAmount = isLpc ? input.size.abs() : input.valueLpc.abs();
  const otherAmountDisplay = `${bnToDisplayString(
    otherAmount,
    AMOUNT_DECIMALS,
    USD_DISPLAY_DECIMALS,
    isLpc ? LOT_SIZE_MAX_DECIMALS : USD_DISPLAY_DECIMALS,
  )} ${isLpc ? "lots" : TRADE_LP_DEFAULT_CURRENCY_SYMBOL}`;

  // <amount> <icon of base asset traded> <pair traded>
  const message = `${messageAmount} ${displaySymbolAndIcon} @ market</span>`;
  return {
    awaitingApproval: !hasOneClickTradingWallet
      ? `follow wallet instructions to approve ${prefix} ${message}`
      : undefined,
    pending: `${prefix} ${message} (~${otherAmountDisplay})`,
    error: `${prefix} ${message} (~${otherAmountDisplay})`,
  };
};

/**
 * This only shows the success in lots, since that is how it's processed
 * on the server. When we can specify the buy amount in LPC, then we should
 * revisit this. See https://github.com/handle-fi/handle-synths/issues/236.
 */
export const getTradeSuccessNotification = (
  pair: Pair,
  displaySymbolAndIcon: string,
  decimals: number,
  tradeResponse: trade.AccountTradeResponse,
  input: TradeFormInputHook,
  isLong: boolean,
): string => {
  const filledSide = isLong ? "filled. BOT" : "filled. SOLD";
  // <order type> or <fill price>
  const entryPrice = tradeResponse.tradeEffect.fillPrice;
  const fillOrderStatus = `${bnToDisplayString(
    entryPrice,
    PRICE_DECIMALS,
    decimals,
  )} ${pair.quoteSymbol}`;

  const prefix = `<span class="${
    isLong ? "hfi-up" : "hfi-down"
  } uk-display-inline">${filledSide}</span>`;
  const isLpc = input.userInputType === "Lpc";
  const usdSize = isLpc
    ? input.valueLpc
    : input.size.abs().mul(entryPrice).div(PRICE_UNIT);
  const fillSize = bnToDisplayString(
    input.size.abs(),
    AMOUNT_DECIMALS,
    USD_DISPLAY_DECIMALS,
    LOT_SIZE_MAX_DECIMALS,
  );
  const usdDisplay = bnToDisplayString(
    usdSize,
    AMOUNT_DECIMALS,
    USD_DISPLAY_DECIMALS,
  );
  const message = `${fillSize} lots ${displaySymbolAndIcon} @ ${fillOrderStatus} (${usdDisplay} USD)`;
  return `${prefix} ${message}`;
};
