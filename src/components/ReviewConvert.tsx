import React, { useEffect, useMemo } from "react";
import { ButtonSmart, Button } from ".";
import { useConnectedNetwork } from "@handle-fi/react-components/dist/context/UserWallet";
import { bnToDisplayString } from "../utils/format";
import { BigNumber } from "ethers";
import { TokenInfo, Quote } from "handle-sdk";
import { getEstimatedImpact, getTokenRatioDisplay } from "../utils/convert";
import { config } from "../config";
import classNames from "classnames";
import classes from "../components/Convert/Convert.module.scss";
import { getUkTooltip } from "../utils/general";
import "./Convert/ReviewConvertModal.scss";
import { applyBasisPoints } from "../utils/trade/applyBasisPoints";
import { BASIS_POINTS_DIVISOR } from "handle-sdk/dist/constants";
import {
  AnalyticsPurchaseItem,
  getAnalyticsPurchaseId,
  sendAnalyticsBeginCheckoutEvent,
  sendAnalyticsPurchaseEvent,
} from "../utils/analytics";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import { getIsHighEstimatedImpact } from "../navigation/Convert";
import { SpritesheetIcon } from "@handle-fi/react-components/dist/components/SpritesheetIcon/SpritesheetIcon";

export type ReviewConvertProps = {
  fromToken: TokenInfo;
  toToken: TokenInfo;
  onConvert: () => Promise<void>;
  quote: Quote;
};

const ReviewConvert = ({
  fromToken,
  toToken,
  onConvert,
  quote,
}: ReviewConvertProps) => {
  const network = useConnectedNetwork()!;
  const [pending, setPending] = React.useState(false);
  const payAmountDisplay = bnToDisplayString(
    BigNumber.from(quote.sellAmount),
    fromToken.decimals,
    4,
  );
  const estimatedImpact = getEstimatedImpact(quote);
  const highEstimatedImpact = getIsHighEstimatedImpact(
    estimatedImpact,
    fromToken.symbol,
    toToken.symbol,
  );
  const receiveIncludingFee = quote.feeChargedBeforeConvert
    ? BigNumber.from(quote.buyAmount)
    : applyBasisPoints(
        BigNumber.from(quote.buyAmount),
        BASIS_POINTS_DIVISOR - quote.feeBasisPoints,
      );
  const analyticsPurchaseItem: AnalyticsPurchaseItem = useMemo(
    () => ({
      item_name: getAnalyticsPurchaseId("convert", [
        fromToken.symbol,
        toToken.symbol,
      ]),
      price: +payAmountDisplay,
      discount: +payAmountDisplay * (estimatedImpact / 100),
    }),
    [],
  );

  useEffect(() => {
    sendAnalyticsBeginCheckoutEvent(
      +payAmountDisplay,
      fromToken.symbol,
      analyticsPurchaseItem,
    );
  }, []);

  const onConvertInternal = async () => {
    setPending(true);
    try {
      await onConvert();
      sendAnalyticsPurchaseEvent(
        +payAmountDisplay,
        fromToken.symbol,
        analyticsPurchaseItem,
      );
    } finally {
      setPending(false);
    }
  };

  const PayValueDisplay = () => {
    return quote?.usdValues?.valueIn ? (
      <span className={classNames(classes.value)}>
        {`~${quote.usdValues.valueIn.toFixed(2)}`}
        <sub>USD</sub>
      </span>
    ) : (
      <></>
    );
  };

  const ReceiveValueDisplay = () => {
    return quote?.usdValues?.valueOut ? (
      <span className={classNames(classes.value)}>
        {`~${quote.usdValues.valueOut.toFixed(2)}`}
        <sub>USD</sub>
      </span>
    ) : (
      <></>
    );
  };

  const receiveAmount =
    receiveIncludingFee &&
    bnToDisplayString(receiveIncludingFee, toToken.decimals, 4);

  const [reversePrice, setReversePrice] = React.useState(false);

  const onReversePrice = () => {
    setReversePrice(!reversePrice);
  };

  return (
    <div className={"uk-flex uk-flex-column"} style={{ gap: "5px" }}>
      <div className="uk-flex uk-flex-between uk-margin-xsmall-top">
        <div>you pay</div>
        <div className="uk-flex uk-flex-middle" style={{ gap: ".75rem" }}>
          {payAmountDisplay || "loading..."} {fromToken.symbol}
          <SpritesheetIcon
            sizePx={22}
            style={{ marginTop: 0 }}
            iconName={fromToken.symbol}
            fallbackSrc={fromToken.logoURI ?? config.tokenIconPlaceholderUrl}
          />
        </div>
      </div>

      <div className="uk-flex uk-flex-between uk-margin-small-bottom">
        <div></div>
        <PayValueDisplay />
      </div>

      <div className={"uk-flex uk-flex-between"}>
        <div>you receive</div>
        <div className="uk-flex uk-flex-middle" style={{ gap: ".75rem" }}>
          {receiveAmount || "loading..."} {toToken.symbol}
          <SpritesheetIcon
            sizePx={22}
            style={{ marginTop: 0 }}
            iconName={toToken.symbol}
            fallbackSrc={toToken.logoURI ?? config.tokenIconPlaceholderUrl}
          />
        </div>
      </div>

      <div className="uk-flex uk-flex-between uk-margin-small-bottom">
        <div></div>
        <ReceiveValueDisplay />
      </div>

      <div
        className={classNames("uk-flex uk-flex-between", {
          [classes.highEstimatedImpact]: highEstimatedImpact,
        })}
      >
        <div>rate</div>
        <Button
          tooltip={{
            text: "click to reverse",
            position: "left",
            classes: highEstimatedImpact ? "hfi-orange" : "",
          }}
          className={classNames(
            "convert-price-button",
            classes.convertPriceButton,
            {
              "high-price-impact": highEstimatedImpact,
            },
          )}
          onClick={onReversePrice}
        >
          <span
            className={classNames("uk-tooltip-content", {
              [classes.highEstimatedImpact]: highEstimatedImpact,
            })}
          >
            1 {reversePrice ? toToken.symbol : fromToken.symbol}{" "}
            <FontAwesomeIcon icon={["fal", "exchange"]} />{" "}
            {getTokenRatioDisplay(
              quote,
              fromToken.decimals,
              toToken.decimals,
              reversePrice,
            )}{" "}
            {reversePrice ? fromToken.symbol : toToken.symbol}
          </span>
        </Button>
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

        <div
          className="uk-flex uk-flex-middle"
          uk-tooltip={getUkTooltip({
            title:
              "the estimated difference between the USD values of from and to amounts",
            position: "bottom-right",
            classes: `uk-active ${highEstimatedImpact ? "hfi-orange" : ""}`,
          })}
        >
          <span className={classes.deltaSymbol}>
            <FontAwesomeIcon
              icon={["far", "triangle"]}
              className="uk-margin-xsmall-right"
            />
          </span>

          <span
            className={classNames("uk-tooltip-content", {
              [classes.highEstimatedImpact]: highEstimatedImpact,
            })}
          >
            {`${estimatedImpact >= 0 ? "-" : "+"}${Math.abs(
              estimatedImpact,
            ).toFixed(2)}%`}
          </span>
        </div>
      </div>

      <ButtonSmart
        network={network}
        className={classNames("uk-margin-small-top", {
          "hfi-orange-button": highEstimatedImpact,
        })}
        expand={true}
        onClick={onConvertInternal}
        loading={pending}
      >
        {highEstimatedImpact && (
          <FontAwesomeIcon
            icon={["far", "exclamation-triangle"]}
            className="uk-margin-small-right"
          />
        )}
        {highEstimatedImpact ? "warning - high impact convert" : "convert"}
      </ButtonSmart>
    </div>
  );
};

export default ReviewConvert;
