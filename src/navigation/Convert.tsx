import classNames from "classnames";
import { BigNumber, constants, utils } from "ethers";
import { ConvertSDK, Network, NetworkMap, Quote } from "handle-sdk";
import { getHlpPairFromIndex } from "handle-sdk/dist/components/trade/platforms/hlp/internals";
import { BASIS_POINTS_DIVISOR } from "handle-sdk/dist/constants";
import React, { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { useLocation } from "react-router-dom";
import { Button, InputNumberWithBalance } from "../components";
import classes from "../components/Convert/Convert.module.scss";
import { ConvertButtons } from "../components/ConvertButtons/ConvertButtons";
import DisplayValue from "../components/DisplayValue/DisplayValue";
import Container from "@handle-fi/react-components/dist/components/handle_uikit/components/Container/Container";
import HlpCompositionModal from "../components/HlpCompositionModal/HlpCompositionModal";
import HlpFeeTable from "../components/HlpFeeTable/HlpFeeTable";
import HlpPieChart from "../components/HlpPieChart/HlpPieChart";
import HlpStakingStats from "../components/HlpStakingStats";
import { InputNumberValue } from "../components/InputNumber/InputNumber";
import Metatags from "../components/Metatags";
import PriceChart from "../components/PriceChart/PriceChart";
import MobileReviewConvert from "../components/Mobile/MobileReviewConvert";
import RefreshSpinner from "../components/RefreshSpinner";
import ReviewConvertModal from "../components/ReviewConvertModal";
import SelectEveryToken from "../components/SelectEveryToken";
import {
  DEFAULT_MIN_GAS_ESTIMATE,
  PRICE_IMPACT_IGNORED_SYMBOLS,
  PRICE_IMPACT_WARNING_THRESHOLD,
} from "../config/convert";
import {
  getConvertNotifications,
  getConvertSuccessNotificationFromReceipt,
} from "../config/notifications";
import { useTermsAndConditions } from "../context/TermsAndCondtions";
import { useHlpWrappedNativeToken, useToken } from "../context/TokenManager";
import { useTradePrices } from "../context/TradePrices";
import { useUiStore } from "../context/UserInterface";
import { useBalance, useUserBalanceStore } from "../context/UserBalances";
import {
  useConnectedAccount,
  useConnectedNetwork,
  useSigner,
  useUserWalletStore,
} from "@handle-fi/react-components/dist/context/UserWallet";
import { useConvertAllowance } from "../hooks/useConvertAllowance";
import { useConvertQuery } from "../hooks/useConvertQuery";
import useGasPriceToUse from "../hooks/useGasPriceToUse";
import useNumberInputState from "../hooks/useInputNumberState";
import { useMemoInterval } from "../hooks/useMemoInterval";
import useSendTransaction from "../hooks/useSendTransaction";
import useSetAccount from "../hooks/useSetAccount";
import { getEstimatedImpact, getTokenRatioDisplay } from "../utils/convert";
import { getConvertButtonProps } from "../utils/convert/convertButtonProps";
import { ensureQuoteAllowancesMet } from "../utils/convert/ensureQuoteAllowancesMet";
import { bnToDisplayString } from "../utils/format";
import { getUkTooltip } from "../utils/general";
import {
  closeAllNotifications,
  showNotification,
} from "@handle-fi/react-components/dist/utils/notifications";
import { applyBasisPoints } from "../utils/trade/applyBasisPoints";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import { NETWORK_NAME_TO_LOGO_URL } from "@handle-fi/react-components";
import { networkNameToShow } from "@handle-fi/react-components/dist/utils/general";

export type Direction = "from" | "to";

const BASE_TOKEN_LIST = ["FOREX", "USDC", "USDT"];
const BASE_TOKEN_LIST_ARBITRUM = ["FOREX", "USDC.e", "USDT"];

export const DISPLAY_TOKENS: NetworkMap<string[]> = {
  ethereum: ["ETH", ...BASE_TOKEN_LIST],
  polygon: ["MATIC", ...BASE_TOKEN_LIST],
  arbitrum: ["ETH", "fxAUD", "fxUSD", ...BASE_TOKEN_LIST_ARBITRUM],
  "arbitrum-sepolia": ["ETH", "fxAUD", "fxUSD", ...BASE_TOKEN_LIST_ARBITRUM],
};

export const DEFAULT_TOKENS: NetworkMap<{ from: string; to: string }> = {
  ethereum: {
    from: "ETH",
    to: "FOREX",
  },
  arbitrum: {
    from: "ETH",
    to: "fxUSD",
  },
  polygon: {
    from: "MATIC",
    to: "FOREX",
  },
  "arbitrum-sepolia": {
    from: "ETH",
    to: "fxUSD",
  },
};

let typingTimeoutId: any;
const GET_QUOTE_TIMEOUT = 500;
const HLP_PRICE_REFRESH_MS = 10_000;
export const SUPPORTED_NETWORKS: Network[] = ["ethereum", "arbitrum"];

export enum QuoteError {
  None,
  InsufficientLiquidity,
  Unknown,
}

export const errorMessages: Record<QuoteError, string | null> = {
  [QuoteError.None]: null,
  [QuoteError.InsufficientLiquidity]: "insufficient liquidity",
  [QuoteError.Unknown]: "invalid convert",
};

const DEFAULT_NETWORK: Network = "ethereum";

const Convert = () => {
  useSetAccount();
  const query = useConvertQuery();
  const connectedAccount = useConnectedAccount();
  const connectedNetwork = useConnectedNetwork();
  const { refreshBalance } = useUserBalanceStore();
  // use the query network, if no query network then use users connected network.
  // If there is no query or connected network, use ethereum as the default
  const network: Network = query.network || connectedNetwork || DEFAULT_NETWORK;
  const { slippage } = useUserWalletStore();
  const { sendTransaction, sendingTransaction } = useSendTransaction();
  const signer = useSigner();
  const activePath = useLocation().pathname;
  const { isMobile } = useUiStore();

  const [fromTokenSymbol, setFromTokenSymbol] = React.useState<string>("");
  const fromTokenAmountState = useNumberInputState();

  const [toTokenSymbol, setToTokenSymbol] = React.useState<string>("");
  const toTokenAmountState = useNumberInputState();

  useEffect(() => {
    if (query.fromToken) {
      setFromTokenSymbol(query.fromToken);
    } else setToTokenSymbol(DEFAULT_TOKENS[network].from);

    if (query.toToken) {
      setToTokenSymbol(query.toToken);
    } else setToTokenSymbol(DEFAULT_TOKENS[network].to);
  }, [query]);

  const [loadingQuote, setLoadingQuote] = React.useState<boolean>(false);
  const [quote, setQuote] = React.useState<{
    quote: Quote | undefined;
    error: QuoteError;
  }>({
    quote: undefined,
    error: QuoteError.None,
  });
  const [reversePrice, setReversePrice] = React.useState(false);
  const fromTokenBalance = useBalance({
    tokenSymbol: fromTokenSymbol,
    network: network,
  });
  const fromToken = useToken(fromTokenSymbol, network);
  const toToken = useToken(toTokenSymbol, network);
  const [showConvertModal, setShowConvertModal] = React.useState(false);
  const gasPriceToUse = useGasPriceToUse();
  const weth = useHlpWrappedNativeToken(network);
  const { getPrice } = useTradePrices();

  const isHlpSwap =
    (fromToken?.extensions?.isHlpToken || fromToken?.extensions?.isNative) &&
    (toToken?.extensions?.isHlpToken || toToken?.extensions?.isNative);

  const isSwappingHlp = [fromToken, toToken].some(
    t => t?.extensions?.isLiquidityToken,
  );

  const onChangeToken = (tokenDirection: Direction) => (newToken: string) => {
    toTokenAmountState.reset();
    fromTokenAmountState.reset();

    if (tokenDirection === "to") {
      setToTokenSymbol(newToken);
      if (newToken === fromTokenSymbol) setFromTokenSymbol(toTokenSymbol);
    } else {
      setFromTokenSymbol(newToken);
      if (newToken === toTokenSymbol) setToTokenSymbol(fromTokenSymbol);
    }
  };

  const onChangeAmountFrom = (newAmount: InputNumberValue) => {
    fromTokenAmountState.onChange(newAmount);
  };

  useEffect(() => {
    if (!query.network) {
      // If there is no network in the query params, but the network changed,
      // then set everything back to default.
      onChangeAmountFrom({ string: "", bn: constants.Zero });
      // Update the from & to tokens if they are not set in the query.
      // NOTE: this might result in using a token that does not exist
      // for the new network selected.
      if (!query.fromToken) setFromTokenSymbol(DEFAULT_TOKENS[network].from);
      if (!query.toToken) setToTokenSymbol(DEFAULT_TOKENS[network].to);
    }
  }, [connectedNetwork]);

  // resets swap and quote state when tokens or network changes
  useEffect(() => {
    setQuote({
      quote: undefined,
      error: QuoteError.None,
    });
  }, [fromTokenSymbol, toTokenSymbol, network]);

  const getQuote = React.useCallback(
    (withDebounce = true, showLoading = true) => {
      clearTimeout(typingTimeoutId);

      if (!fromToken || !toToken) return;

      if (fromTokenAmountState.value.bn.isZero()) {
        setQuote({
          quote: undefined,
          error: QuoteError.None,
        });
        toTokenAmountState.reset();
        return;
      }

      typingTimeoutId = setTimeout(
        async () => {
          if (showLoading) setLoadingQuote(true);
          try {
            const newQuote = await ConvertSDK.getQuote({
              fromToken: fromToken,
              toToken: toToken,
              sellAmount: fromTokenAmountState.value.bn,
              receivingAccount: connectedAccount,
              gasPrice: gasPriceToUse,
              provider: signer?.provider,
            });
            // Fetches the transaction associated with this quote
            let toBn = BigNumber.from(newQuote.buyAmount);

            // adjust for fee, but only if the fee is charged after convert. If the fee
            // was charged before convert, it has already been deducted from the amount
            if (!newQuote.feeChargedBeforeConvert) {
              toBn = applyBasisPoints(
                toBn,
                BASIS_POINTS_DIVISOR - newQuote.feeBasisPoints,
              );
            }

            toTokenAmountState.onChange({
              bn: toBn,
              string: bnToDisplayString(toBn, toToken.decimals, 4, 18) ?? "",
            });
            setQuote({
              quote: newQuote,
              error: QuoteError.None,
            });
          } catch (e: any) {
            let quoteError = QuoteError.Unknown;
            if (e.response?.data?.description === "insufficient liquidity") {
              quoteError = QuoteError.InsufficientLiquidity;
            }

            setQuote({
              quote: undefined,
              error: quoteError,
            });
          } finally {
            if (showLoading) setLoadingQuote(false);
          }
        },
        withDebounce ? GET_QUOTE_TIMEOUT : 0,
      );
    },
    [
      fromToken,
      toToken,
      connectedAccount,
      toTokenAmountState,
      gasPriceToUse,
      signer,
    ],
  );

  // Refresh quote whenever from token amount state changes
  useEffect(getQuote, [fromTokenAmountState.value.bn]);

  // If the swap is a hlpSwap, and the prices of tokens have changed, refetch the quote
  const [fromPriceHlp, toPriceHlp] = useMemoInterval(
    () =>
      isHlpSwap && weth
        ? [
            getPrice(getHlpPairFromIndex(fromToken.address)),
            getPrice(getHlpPairFromIndex(toToken.address)),
          ]
        : [null, null],
    HLP_PRICE_REFRESH_MS,
    [fromToken, toToken],
  );

  useEffect(() => {
    if (isHlpSwap) {
      getQuote(false, false);
    }
  }, [fromPriceHlp, toPriceHlp, isHlpSwap]);

  const { tokensToApprove, refresh: refreshTokenAllowances } =
    useConvertAllowance(
      quote.quote?.allowanceTarget,
      network,
      connectedAccount,
    );

  const isUnsupportedNetwork = !SUPPORTED_NETWORKS.includes(network);
  const networkNameToDisplay = networkNameToShow(network);

  useEffect(() => {
    closeAllNotifications();

    if (network && isUnsupportedNetwork && activePath === "/convert") {
      const networkImageToShow = NETWORK_NAME_TO_LOGO_URL[network]
        ? `<img src="${NETWORK_NAME_TO_LOGO_URL[network]}"
            alt="${network}"
            width="20"
            class="uk-margin-xsmall-right"
          />`
        : `<i class="far fa-chart-network uk-margin-xsmall-right"></i>`;
      showNotification({
        status: "error",
        message: `convert unavailable on ${networkImageToShow}${networkNameToDisplay}`,
      });
    }
  }, [isUnsupportedNetwork, activePath, network]);

  let max = !fromToken?.extensions?.isNative
    ? fromTokenBalance.balance
    : fromTokenBalance.balance?.sub(
        DEFAULT_MIN_GAS_ESTIMATE.mul(gasPriceToUse || 0),
      );

  if (max?.lt(0)) {
    max = constants.Zero;
  }

  const { isSigningDone, ensureTermsSigned } = useTermsAndConditions();

  const handleConvert = async () => {
    if (!connectedAccount || !signer || sendingTransaction) return;

    if (!isSigningDone.current) {
      await ensureTermsSigned();
      return;
    }

    if (tokensToApprove && tokensToApprove.length > 0 && quote.quote) {
      await ensureQuoteAllowancesMet(
        connectedAccount,
        signer,
        quote.quote?.allowanceTarget,
        sendTransaction,
      );
      refreshTokenAllowances();
    } else {
      setShowConvertModal(true);
    }

    // This timeout is an attempt to fix the weird convert approval bug.
    setTimeout(refreshTokenAllowances, 750);
  };

  const getSwapTx = React.useCallback(
    async (gasPrice: BigNumber | undefined) => {
      if (!fromToken || !toToken) throw new Error("Cannot find token");
      if (!signer) throw new Error("Cannot find signer");
      return ConvertSDK.getSwap({
        fromToken,
        toToken,
        sellAmount: fromTokenAmountState.value.bn,
        buyAmount: toTokenAmountState.value.bn,
        gasPrice,
        signer,
        slippage,
      });
    },
    [
      fromToken,
      toToken,
      fromTokenAmountState,
      toTokenAmountState,
      signer,
      slippage,
    ],
  );

  const submitConvert = async () => {
    if (!connectedAccount || !signer || !quote || !fromToken || !toToken) {
      return;
    }

    const refreshData = () => {
      fromTokenAmountState.reset();
      toTokenAmountState.reset();
      return refreshBalance(network);
    };

    try {
      await sendTransaction(
        async gasPrice => {
          const swapTx = await getSwapTx(gasPrice);
          // TODO: only do this if the user connected via Dynamic email.
          // this is required for email/google to work with Dynamic, or
          // viem complains about legacy tx.
          // But it needs to not be present for e.g. Rainbow to work,
          // or it may say user has insufficient ETH even if they do not.
          // delete swapTx.gasPrice;
          return signer.sendTransaction({
            ...swapTx,
            gasPrice,
          });
        },
        getConvertNotifications({
          fromToken,
          toToken,
          fromAmount: fromTokenAmountState.value.bn,
          toAmount: toTokenAmountState.value.bn,
        }),
        {
          callback: async () => {
            refreshData().catch(console.error);
            setShowConvertModal(false);
          },
          overwriteSuccessMessage: receipt =>
            getConvertSuccessNotificationFromReceipt(
              network,
              fromToken,
              toToken,
              fromTokenAmountState.value.bn,
              toTokenAmountState.value.bn,
              receipt,
            ),
        },
      );
    } catch (error) {
      console.error(error);
    }
  };

  const switchTokenPositions = () => {
    setQuote({
      quote: undefined,
      error: QuoteError.None,
    });
    fromTokenAmountState.reset();
    toTokenAmountState.reset();
    onChangeToken("to")(fromTokenSymbol);
    onChangeToken("from")(toTokenSymbol);
  };

  const isLoadingOrSending = loadingQuote || sendingTransaction;
  const shouldShowLoadingSequence =
    isLoadingOrSending && quote.error === QuoteError.None;

  const textIfShowLoadingSequence = loadingQuote
    ? "fetching prices..."
    : "analysing routes...";
  const toTokenDisplayValue = shouldShowLoadingSequence
    ? {
        string: textIfShowLoadingSequence,
        bn: BigNumber.from(0),
      }
    : toTokenAmountState.value;

  const showRefreshSpinner =
    quote &&
    !isHlpSwap &&
    !showConvertModal &&
    !fromTokenAmountState.value.bn.isZero() &&
    !toTokenAmountState.value.bn.isZero();

  const estimatedImpact = loadingQuote ? 0 : getEstimatedImpact(quote.quote);

  const highEstimatedImpact =
    !isLoadingOrSending &&
    getIsHighEstimatedImpact(estimatedImpact, fromTokenSymbol, toTokenSymbol);

  const {
    text: reviewText,
    disabled: convertButtonDisabled,
    alert: showAlert,
    tooltip: convertButtonTooltip,
  } = getConvertButtonProps({
    fromToken,
    toToken,
    ...quote,
    fromTokenAmountState,
    fromTokenBalance,
    highEstimatedImpact,
    isSwappingHlp,
    max,
    tokensToApprove,
    toTokenAmountState,
    showConvertModal,
  });

  const onReversePrice = () => {
    setReversePrice(!reversePrice);
  };

  const ratioOfTokens =
    quote.quote &&
    fromToken &&
    toToken &&
    getTokenRatioDisplay(
      quote.quote,
      fromToken.decimals,
      toToken.decimals,
      reversePrice,
    );

  const [showPriceChart, setShowPriceChart] = React.useState(true);
  const [priceChartTooltip, setPriceChartTooltip] = React.useState<
    string | undefined
  >();
  const onClickSwitchCharts = () => setShowPriceChart(!showPriceChart);

  React.useEffect(() => {
    if (isMobile || !isSwappingHlp) setShowPriceChart(false);
    setPriceChartTooltip(
      getUkTooltip({
        title: `view ${showPriceChart ? "pool composition" : "price chart"}`,
        position: "right",
      }),
    );
  }, [showPriceChart, isSwappingHlp, isMobile]);

  const [showFullFeeTable, setShowFullFeeTable] = React.useState(false);
  const [feeTableTooltip, setFeeTableTooltip] = React.useState<
    string | undefined
  >();
  const onToggleFeeTable = () => setShowFullFeeTable(!showFullFeeTable);

  React.useEffect(() => {
    setFeeTableTooltip(
      getUkTooltip({
        title: `show ${
          showFullFeeTable ? "only selected token" : "all tokens"
        }`,
        position: "right",
      }),
    );
  }, [isSwappingHlp, isMobile, showFullFeeTable]);

  let usdHlpDeltaForLiquidityChange;
  if (isSwappingHlp) {
    if (
      toToken?.extensions?.isLiquidityToken &&
      quote.quote?.usdValues.valueIn
    ) {
      usdHlpDeltaForLiquidityChange = utils.parseEther(
        quote.quote?.usdValues.valueIn.toString(),
      );
    } else if (
      !toToken?.extensions?.isLiquidityToken &&
      quote.quote?.usdValues.valueOut
    ) {
      usdHlpDeltaForLiquidityChange = utils.parseEther(
        quote.quote?.usdValues.valueOut.toString(),
      );
    }
  }

  const [showHlpCompositionModal, setShowHlpCompositionModal] =
    React.useState(false);
  const onClickBuy = (token: string) => setFromTokenSymbol(token);

  const hlpTokenForCompositionTable = () => {
    if (fromTokenSymbol === "hLP") return toTokenSymbol;
    return fromTokenSymbol;
  };

  const showRate =
    quote &&
    !shouldShowLoadingSequence &&
    fromTokenAmountState.value.bn.gt(0) &&
    toTokenAmountState.value.bn.gt(0);

  const { ref, inView } = useInView({ threshold: 0.5 });

  return (
    <React.Fragment>
      {!isMobile && (
        <Metatags function="convert" description="convert tokens" />
      )}

      {(!isMobile || !showConvertModal) && (
        <Container size="xl" className="convert-wrapper ">
          <div
            className={classNames(
              "convert uk-child-width-expand",
              classes.convertGridWrapper,
              {
                [classes.convertFormOnly]: isMobile,
                "uk-margin-small-top": isMobile,
              },
            )}
            ref={ref}
          >
            <div className="uk-flex uk-flex-center">
              <form
                autoComplete="off"
                noValidate
                className={classNames("uk-margin-small uk-width-expand")}
              >
                {!isMobile && (
                  <h2 className="uk-margin-remove-vertical">convert</h2>
                )}
                <fieldset
                  className="uk-fieldset"
                  disabled={isMobile && !inView}
                >
                  <div className="uk-margin-small">
                    from
                    <SelectEveryToken
                      id="select-convert-token-sell"
                      onChange={onChangeToken("from")}
                      network={network}
                      wrapperClassName="uk-margin"
                      value={fromTokenSymbol}
                      disabled={isUnsupportedNetwork}
                      showBalance={!!connectedNetwork}
                      displayOptions={DISPLAY_TOKENS[network]}
                      displayOptionsWithBalance={true}
                    />
                    <InputNumberWithBalance
                      value={fromTokenAmountState.value}
                      onChange={onChangeAmountFrom}
                      network={network}
                      tokenSymbol={fromTokenSymbol}
                      max={max}
                      label="amount"
                      placeholder="tokens to sell"
                      id="input-number-sell"
                      disabled={isUnsupportedNetwork}
                      rightComponent={
                        quote?.quote?.usdValues.valueIn && (
                          <DisplayValue
                            value={quote?.quote?.usdValues.valueIn}
                          />
                        )
                      }
                    />
                  </div>

                  <div className="uk-flex uk-flex-center uk-margin-top">
                    <Button
                      className={classes.switchButton}
                      icon
                      onClick={switchTokenPositions}
                      style={{ transform: "rotate(90deg)" }}
                      disabled={isUnsupportedNetwork}
                    >
                      <FontAwesomeIcon icon={["fal", "exchange"]} />
                    </Button>
                  </div>

                  <div className="uk-margin-small-bottom">
                    to
                    <SelectEveryToken
                      id="select-convert-token-buy"
                      onChange={onChangeToken("to")}
                      network={network}
                      wrapperClassName="uk-margin"
                      value={toTokenSymbol}
                      disabled={isUnsupportedNetwork}
                      showBalance={!!connectedNetwork}
                    />
                    <InputNumberWithBalance
                      value={toTokenDisplayValue}
                      onChange={() => {}}
                      network={network}
                      tokenSymbol={toTokenSymbol}
                      label="amount"
                      placeholder="tokens to buy"
                      max={undefined}
                      readOnly={true}
                      id="input-number-buy"
                      disabled={isUnsupportedNetwork}
                      disableAlertOnOverBalance={true}
                      disableMaxButton={true}
                      rightComponent={
                        <React.Fragment>
                          {quote?.quote?.usdValues.valueOut && (
                            <DisplayValue
                              value={quote?.quote?.usdValues.valueOut}
                            />
                          )}

                          {showRefreshSpinner && (
                            <RefreshSpinner
                              className="uk-margin-small-left"
                              secondsToRefresh={30}
                              onRefresh={() => getQuote(false)}
                              refreshTime={1500}
                            />
                          )}
                        </React.Fragment>
                      }
                    />
                  </div>

                  <div
                    className={classNames("uk-flex uk-flex-between", {
                      [classes.highEstimatedImpact]: highEstimatedImpact,
                    })}
                  >
                    <div
                      className={classNames({ "hfi-showbuthide": !showRate })}
                    >
                      rate
                    </div>
                    <div></div>
                    {showRate && (
                      <div className="uk-flex uk-flex-middle">
                        <Button
                          tooltip={{
                            text: "conversion rate before any protocol or network fees.<br/ >click to reverse.",
                            position: "bottom-right",
                            classes: highEstimatedImpact ? "hfi-orange" : "",
                          }}
                          className={classNames("convert-price-button", {
                            "high-price-impact": highEstimatedImpact,
                          })}
                          onClick={onReversePrice}
                        >
                          <span
                            className={classNames("uk-tooltip-content", {
                              [classes.highEstimatedImpact]:
                                highEstimatedImpact,
                            })}
                          >
                            1{" "}
                            {reversePrice ? toToken?.symbol : fromToken?.symbol}{" "}
                            <FontAwesomeIcon icon={["fal", "exchange"]} />{" "}
                            {ratioOfTokens}{" "}
                            {reversePrice ? fromToken?.symbol : toToken?.symbol}
                          </span>
                        </Button>
                      </div>
                    )}
                  </div>

                  <div
                    className={classNames(
                      "uk-flex uk-flex-between",
                      classes.estimatedImpact,
                      {
                        [classes.highEstimatedImpact]: highEstimatedImpact,
                      },
                    )}
                  >
                    <div className="hfi-showbuthide">estimated impact</div>

                    {quote &&
                      !shouldShowLoadingSequence &&
                      fromTokenAmountState.value.bn.gt(0) &&
                      toTokenAmountState.value.bn.gt(0) &&
                      estimatedImpact !== 0 && (
                        <div
                          className="uk-flex uk-flex-middle"
                          uk-tooltip={getUkTooltip({
                            title:
                              "the estimated difference between the USD values of from and to amounts",
                            position: "bottom-right",
                            classes: `uk-active${
                              highEstimatedImpact ? " hfi-orange" : ""
                            }`,
                          })}
                        >
                          <span
                            className={classNames("uk-tooltip-content", {
                              [classes.highEstimatedImpact]:
                                highEstimatedImpact,
                            })}
                          >
                            <span className={classes.deltaSymbol}>
                              <FontAwesomeIcon
                                icon={["far", "triangle"]}
                                className="uk-margin-xsmall-right"
                              />
                            </span>

                            {`${
                              // This is because a positive estimated impact means the usd delta is negative (there is a loss)
                              estimatedImpact >= 0 ? "-" : "+"
                            }${Math.abs(estimatedImpact).toFixed(2)}%`}
                          </span>
                        </div>
                      )}
                  </div>

                  <div>
                    <ConvertButtons
                      connectedNetwork={connectedNetwork}
                      convertNetwork={network}
                      convertButtonDisabled={!!convertButtonDisabled}
                      highEstimatedImpact={highEstimatedImpact}
                      isUnsupportedNetwork={isUnsupportedNetwork}
                      reviewConvert={handleConvert}
                      reviewText={reviewText}
                      shouldShowLoadingSequence={shouldShowLoadingSequence}
                      showAlert={!!showAlert}
                      isMobile={isMobile}
                      connectedAccount={connectedAccount}
                      convertButtonTooltip={convertButtonTooltip}
                    />
                  </div>
                </fieldset>
              </form>
            </div>

            {!isMobile && (
              <div className="uk-flex uk-flex-column uk-flex-start uk-visible@m">
                {isSwappingHlp && (
                  <div
                    className={classNames(
                      "uk-flex uk-position-absolute",
                      classes.hlpSelector,
                    )}
                  >
                    <div
                      className={classNames("uk-h5 uk-margin-remove", {
                        "cursor-pointer": isSwappingHlp,
                      })}
                      uk-tooltip={isSwappingHlp ? priceChartTooltip : undefined}
                      onClick={onClickSwitchCharts}
                    >
                      <span className="uk-tooltip-content">
                        {showPriceChart ? "pool composition" : "price chart"}
                        <FontAwesomeIcon
                          icon={["far", "chevron-right"]}
                          className="uk-margin-xsmall-left"
                        />
                      </span>
                    </div>
                  </div>
                )}

                {(!isSwappingHlp || (!isMobile && showPriceChart)) && (
                  <PriceChart
                    height={360}
                    className={classNames(
                      classes.priceChart,
                      "uk-width-expand",
                    )}
                    toTokenSymbol={toTokenSymbol}
                    fromTokenSymbol={fromTokenSymbol}
                    isSwapFromToHlp={isSwappingHlp}
                    network={network}
                  />
                )}

                {isSwappingHlp && !isMobile && !showPriceChart && (
                  <HlpPieChart />
                )}

                <div className="uk-flex uk-flex-between uk-margin-small-top">
                  {isSwappingHlp && (
                    <div>
                      <div
                        id="convert-show-hlp-breakdown"
                        className={classNames(
                          "uk-h5 uk-margin-remove-bottom uk-margin-xsmall-top",
                          {
                            "cursor-pointer": isSwappingHlp,
                            "hfi-showbuthide": !isSwappingHlp,
                          },
                        )}
                        uk-tooltip={
                          isSwappingHlp
                            ? "title: hLP breakdown details; pos: right;"
                            : undefined
                        }
                        onClick={() => setShowHlpCompositionModal(true)}
                      >
                        <span className="uk-tooltip-content">
                          hLP breakdown
                          <FontAwesomeIcon
                            icon={["far", "chevron-down"]}
                            className="uk-margin-xsmall-left"
                          />
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="uk-flex uk-flex-between">
                    {isSwappingHlp && <HlpStakingStats />}
                  </div>
                </div>
              </div>
            )}

            {isSwappingHlp && (
              <div
                className={classNames({
                  [classes.hlpTable]: !isMobile,
                  [classes.hlpTableMobile]: isMobile,
                })}
              >
                <div className="uk-flex">
                  <div
                    id="convert-toggle-hlp-fee-table"
                    className={classNames("uk-h5 uk-margin-remove", {
                      "cursor-pointer": isSwappingHlp,
                    })}
                    uk-tooltip={isSwappingHlp ? feeTableTooltip : undefined}
                    onClick={onToggleFeeTable}
                  >
                    <span className="uk-tooltip-content">
                      hLP fees
                      <FontAwesomeIcon
                        icon={[
                          "far",
                          showFullFeeTable ? "chevron-up" : "chevron-down",
                        ]}
                        className="uk-margin-xsmall-left"
                      />
                    </span>
                  </div>
                </div>

                <HlpFeeTable
                  onClickBuy={onClickBuy}
                  token={hlpTokenForCompositionTable()}
                  showFullFeeTable={showFullFeeTable}
                  isBuyingHlp={!!toToken?.extensions?.isLiquidityToken}
                  usdHlpDelta={usdHlpDeltaForLiquidityChange}
                />
              </div>
            )}
          </div>
        </Container>
      )}

      {quote.quote &&
        showConvertModal &&
        fromToken &&
        toToken &&
        (isMobile ? (
          <MobileReviewConvert
            onClose={() => setShowConvertModal(false)}
            fromToken={fromToken}
            toToken={toToken}
            onConvert={submitConvert}
            quote={quote.quote}
          />
        ) : (
          <ReviewConvertModal
            show={showConvertModal}
            onClose={() => setShowConvertModal(false)}
            fromToken={fromToken}
            toToken={toToken}
            onConvert={submitConvert}
            quote={quote.quote}
          />
        ))}

      {isSwappingHlp && showHlpCompositionModal && (
        <HlpCompositionModal
          show={showHlpCompositionModal}
          onClose={() => setShowHlpCompositionModal(false)}
        />
      )}
    </React.Fragment>
  );
};

export default Convert;

export const getIsHighEstimatedImpact = (
  estimatedImpact: number,
  fromTokenSymbol: string,
  toTokenSymbol: string,
): boolean =>
  estimatedImpact > PRICE_IMPACT_WARNING_THRESHOLD &&
  // Ignore the configured tokens from displaying a price impact warning.
  PRICE_IMPACT_IGNORED_SYMBOLS.map(s =>
    isTokenInConversion(s, fromTokenSymbol, toTokenSymbol),
  ).reduce((sum, x) => sum + (x ? 1 : 0), 0) === 0;

const isTokenInConversion = (
  checkSymbol: string,
  fromSymbol: string,
  toSymbol: string,
): boolean => fromSymbol === checkSymbol || toSymbol === checkSymbol;
