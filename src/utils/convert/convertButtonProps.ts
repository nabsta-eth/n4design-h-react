import { BigNumber } from "ethers";
import { Quote, TokenInfo } from "handle-sdk";
import { isHlpMarketClosed, isTradeWeekend } from "handle-sdk/dist/utils/trade";
import { Balance } from "../../context/UserBalances";
import { InputNumberState } from "../../hooks/useInputNumberState";
import { errorMessages, QuoteError } from "../../navigation/Convert";
import { isPairDisabled } from "./isPairDisabled";

export type ReviewButtonProps = {
  text: string;
  disabled?: boolean;
  alert?: boolean;
  tooltip?: string;
};

type Args = {
  fromToken?: TokenInfo;
  toToken?: TokenInfo;
  quote?: Quote;
  error: QuoteError;
  isSwappingHlp: boolean;
  fromTokenBalance: Balance;
  fromTokenAmountState: InputNumberState;
  toTokenAmountState: InputNumberState;
  max?: BigNumber;
  tokensToApprove?: TokenInfo[];
  highEstimatedImpact: boolean;
  showConvertModal: boolean;
};

export const getConvertButtonProps = (args: Args): ReviewButtonProps => {
  const {
    fromToken,
    toToken,
    error,
    isSwappingHlp,
    fromTokenBalance,
    fromTokenAmountState,
    max,
    toTokenAmountState,
    tokensToApprove,
    highEstimatedImpact,
    quote,
    showConvertModal,
  } = args;

  if (!fromToken || !toToken) {
    // shouldn't happen
    return {
      text: "cannot find tokens",
      disabled: true,
    };
  }

  if (error !== QuoteError.None) {
    if (isSwappingHlp) {
      // this is a hLP swap, but but no route can be found so check if markets are closed
      let text = "hLP unavailable";
      const marketsClosedTooltip =
        "markets closed.<br/>hLP pricing unavailable.";
      if (
        isHlpMarketClosed(fromToken.symbol) ||
        isHlpMarketClosed(toToken.symbol)
      ) {
        return {
          text,
          disabled: true,
          tooltip: marketsClosedTooltip,
        };
      }

      if (fromToken.extensions?.isLiquidityToken) {
        return {
          text: `${toToken.symbol} withdraw unavailable`,
          disabled: true,
          tooltip: "only fx token withdraws are supported",
        };
      }

      return {
        text: `${fromToken.symbol} deposit unavailable`,
        disabled: true,
        tooltip: "only fx token deposits are supported",
      };
    }

    if (
      fromToken.extensions?.isHlpToken &&
      toToken.extensions?.isHlpToken &&
      isTradeWeekend()
    ) {
      return {
        text: "markets closed",
        disabled: true,
        tooltip: "fx pricing unavailable.",
      };
    }

    return {
      // not null, as null is only for no error
      text: errorMessages[error]!,
      disabled: true,
      alert: true,
    };
  }

  if (fromTokenBalance.balance?.lt(fromTokenAmountState.value.bn)) {
    return {
      text: "insufficient balance",
      disabled: true,
      alert: true,
    };
  }

  if (max && fromTokenAmountState.value.bn.gt(max)) {
    return {
      text: "insufficient balance after gas",
      disabled: true,
    };
  }

  if (isPairDisabled(fromToken.symbol, toToken.symbol)) {
    return {
      text: "convert pair disabled",
      disabled: true,
    };
  }

  if (fromTokenAmountState.value.bn.isZero()) {
    return {
      text: "convert",
      disabled: true,
    };
  }

  // if there is a valid quote, but the output is zero
  if (toTokenAmountState.value.bn.isZero() && quote) {
    return {
      text: "output amount estimate is zero",
      alert: true,
    };
  }

  if (tokensToApprove && tokensToApprove.length > 0) {
    const symbols = tokensToApprove.map(({ symbol }) => symbol);
    return {
      text: `allow handle to trade ${symbols.join(" and ")}`,
    };
  }

  if (tokensToApprove === undefined) {
    return {
      text: "checking allowances",
      disabled: true,
    };
  }

  if (highEstimatedImpact) {
    return {
      text: "warning - high impact convert",
    };
  }

  return {
    text: "review",
    disabled: showConvertModal,
  };
};
