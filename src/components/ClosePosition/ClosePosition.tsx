import classNames from "classnames";
import { trade } from "handle-sdk";
import { useLanguageStore } from "../../context/Translation";
import {
  useConnectedNetwork,
  useSigner,
  useUserWalletStore,
} from "@handle-fi/react-components/dist/context/UserWallet";
import { sleep } from "../../utils/general";
import ButtonSmart from "../ButtonSmart/ButtonSmart";
import PositionPairDisplay from "../PositionPairDisplay/PositionPairDisplay";
import { PositionRow } from "../PositionRow";
import { useUiStore } from "../../context/UserInterface";
import PriceDisplayExtended from "../PriceDisplayExtended/PriceDisplayExtended";
import classes from "./ClosePosition.module.scss";
import { TradeSize } from "handle-sdk/dist/components/trade";
import { usePosition } from "../../hooks/usePosition";
import FlashingNumber from "../FlashingNumber/FlashingNumber";
import { showNotification } from "@handle-fi/react-components/dist/utils/notifications";
import { getTradeNetworkOrNull, useTrade } from "../../context/Trade";
import React, { useEffect, useState } from "react";
import { bnToDisplayString } from "../../utils/format";
import {
  getTradeSuccessNotification,
  getTradeNotifications,
  useDisplaySymbolAndIcon,
} from "../../config/notifications";
import { isTransactionCancelled } from "../../hooks/useSendTransaction";
import { shouldShowApprovalAndPendingNotification } from "../../utils/wallet";
import { useTradeFormInput } from "../../hooks/trade/useTradeFormInput";
import HandleSliderWithInput from "../HandleSliderWithInput/HandleSliderWithInput";
import { BigNumber } from "ethers";
import {
  AMOUNT_DECIMALS,
  parseAmount,
} from "handle-sdk/dist/components/trade/reader";
import { RightArrow } from "../RightArrow";
import { getSliderMarks } from "../../utils/slider";
import { Position } from "handle-sdk/dist/components/trade/position";
import { useMarketAvailability } from "../../hooks/useMarketAvailability";
import { getPairUnavailabilityMessage } from "../../utils/trade/errors/weekendTrading";
import { useOneClickTradingWallet } from "../../hooks/useOneClickTrading";
import { useInstrumentOrThrow } from "../../hooks/trade/useInstrumentOrThrow";
import { pairToString } from "handle-sdk/dist/utils/general";
import { getTiprEligibilityMessage } from "../../utils/trade/tiprFli";
import { useIncentives } from "../../context/Incentives/Incentives";
import { TiprEligibilityMessage } from "../Tipr/TiprEligibilityMessage";

type Props = {
  position: Position;
  onClose: () => void;
  reset?: boolean;
  onUpdateSliderPercentage?: (percentage: number) => void;
};

const ClosePosition = ({
  position,
  onClose: onCloseExternal,
  reset,
  onUpdateSliderPercentage,
}: Props) => {
  const [closePositionSize, setClosePositionSize] = useState<BigNumber>(
    position.size,
  );
  const [nextInitialMargin, setNextInitialMargin] = useState<BigNumber>(
    BigNumber.from(0),
  );
  const [nextPositionSize, setNextPositionSize] = useState<BigNumber>(
    position.size.sub(closePositionSize),
  );
  const [sliderPercentage, setSliderPercentage] = useState<number>(100);
  const signer = useSigner();
  const network = useConnectedNetwork();
  const { walletChoice } = useUserWalletStore();
  const { protocol, account: tradeAccount } = useTrade();
  const oneClickTradeSigner = useOneClickTradingWallet(tradeAccount?.id);
  const [isClosingPosition, setIsClosingPosition] =
    React.useState<boolean>(false);
  const { t } = useLanguageStore();
  const { isMobile } = useUiStore();
  const { tiprState } = useIncentives();

  const onClose = () => {
    onCloseExternal();
  };
  const {
    markPrice,
    initialMargin,
    pnl,
    pnlDisplay,
    pnlPercent,
    pnlPercentDisplay,
    totalPositionFees,
    totalPositionFeesDisplay,
  } = usePosition(position);
  const instrument = useInstrumentOrThrow(pairToString(position.pairId.pair));
  const pairDisplayDecimals = instrument.getDisplayDecimals(markPrice);
  const input = useTradeFormInput(position.isLong);

  useEffect(() => {
    // Set the input size. This is used for notifications only.
    // Note that the trade form input has to be always positive.
    input.setSize(closePositionSize.abs(), markPrice);
    // User closes a specific position size, not an USD amount.
    input.setUserInputType("Lot");
  }, [closePositionSize]);

  useEffect(() => {
    setSliderPercentage(100);
  }, [reset]);

  const displaySymbolAndIcon = useDisplaySymbolAndIcon(
    position.pairId.pair,
    instrument,
  );
  const notifications = getTradeNotifications({
    isLong: !position.isLong,
    hasOneClickTradingWallet: !!oneClickTradeSigner,
    displaySymbolAndIcon,
    input,
  });

  useEffect(() => {
    onUpdateSliderPercentage?.(sliderPercentage);
    const percentageBn = parseAmount(sliderPercentage.toString());
    const oneHundred = parseAmount("100");
    const closePositionSize =
      sliderPercentage === 100
        ? position.size
        : position.size.mul(percentageBn).div(oneHundred);
    const closeInitialMargin = initialMargin
      .mul(oneHundred.sub(percentageBn))
      .div(oneHundred);
    setNextPositionSize(position.size.sub(closePositionSize));
    setNextInitialMargin(closeInitialMargin);
    setClosePositionSize(closePositionSize);
  }, [position, sliderPercentage]);

  const handleSliderChange = (percentage: number) => {
    if (percentage > 100) {
      setSliderPercentage(100);
    } else {
      setSliderPercentage(percentage);
    }
  };

  const handleClosePosition = async () => {
    if (!tradeAccount || !signer) {
      return;
    }
    setIsClosingPosition(true);

    const pendingNotification = notifications.pending
      ? showNotification({
          status: "pending",
          message: notifications.pending,
        })
      : undefined;
    let approvalNotification = null;

    try {
      const size = closePositionSize.mul("-1");

      if (
        shouldShowApprovalAndPendingNotification(walletChoice) &&
        notifications.awaitingApproval
      ) {
        await sleep(1000);
        approvalNotification = showNotification({
          status: "pending",
          message: notifications.awaitingApproval,
        });
      }

      const tradeSize = TradeSize.fromLot(size);

      const response = await tradeAccount.trade({
        pairId: position.pairId,
        size: tradeSize,
        signer: oneClickTradeSigner ?? signer,
      });
      showNotification({
        status: "success",
        message: getTradeSuccessNotification(
          position.pairId.pair,
          displaySymbolAndIcon,
          pairDisplayDecimals,
          response,
          input,
          size.gt(0),
        ),
      });
      tradeAccount?.onUpdate?.();
      onClose();
    } catch (e) {
      console.error(e);
      const transactionCancelled = isTransactionCancelled(e);
      showNotification({
        status: transactionCancelled ? "info" : "error",
        message: `${notifications.error} ${
          transactionCancelled ? "cancelled" : "failed"
        }`,
      });
    } finally {
      setIsClosingPosition(false);
      pendingNotification?.close();
      approvalNotification?.close();
    }
  };

  const displayDecimalsExtended = instrument.getDisplayDecimals(
    markPrice,
    true,
  );
  const markPriceDisplay = bnToDisplayString(
    markPrice,
    trade.PRICE_DECIMALS,
    displayDecimalsExtended,
    displayDecimalsExtended,
  );

  const tradePair = protocol.getTradePair(position.pairId);
  const availability = useMarketAvailability(tradePair);
  const isMarketClosed = !availability.isAvailable;

  const closePositionButtonText = () => {
    if (isMarketClosed)
      return `market ${getPairUnavailabilityMessage(
        t,
        availability.reason,
        position.pairId.pair,
        true,
        true,
      )}`;
    if (sliderPercentage == 100) return t.closePosition;
    return `${t.reducePosition} by ${sliderPercentage}%`;
  };

  const isClosePositionButtonDisabled =
    isClosingPosition || sliderPercentage === 0 || isMarketClosed;

  const tiprEligibilityMessage = getTiprEligibilityMessage(
    instrument,
    input.valueLpc,
    t,
    tiprState,
  );

  return (
    <div
      className={classNames(
        "uk-flex uk-flex-column uk-width-expand uk-margin-small-top",
      )}
    >
      <PositionPairDisplay
        pair={position.pairId.pair}
        isLong={position.isLong}
      />

      <div className="uk-margin-small-top">
        <PositionRow
          left="mark price"
          right={
            <FlashingNumber
              className={classNames(
                "uk-tooltip-content",
                classes.flashingPrice,
              )}
              value={+markPrice.toString()}
            >
              <PriceDisplayExtended
                price={markPriceDisplay}
                className={classes.flashingPrice}
              />
            </FlashingNumber>
          }
        />
        <PositionRow
          left="position size"
          right={
            <span>
              <span>
                {bnToDisplayString(position.size, AMOUNT_DECIMALS, 4)}
              </span>
              {!nextPositionSize.eq(position.size) && (
                <span>
                  <RightArrow />
                  {bnToDisplayString(nextPositionSize, AMOUNT_DECIMALS, 4)}
                </span>
              )}
            </span>
          }
        />

        <PositionRow
          left="init. margin"
          right={
            <span>
              <span>{bnToDisplayString(initialMargin, AMOUNT_DECIMALS)}</span>
              {sliderPercentage > 0 && (
                <span>
                  <RightArrow />
                  {bnToDisplayString(nextInitialMargin, AMOUNT_DECIMALS)}
                </span>
              )}
            </span>
          }
        />

        {!!tiprEligibilityMessage && (
          <PositionRow
            left={""}
            right={
              <TiprEligibilityMessage
                tiprEligibilityMessage={tiprEligibilityMessage}
              />
            }
          />
        )}

        <div className="uk-margin-small-top uk-margin-small-bottom">
          <HandleSliderWithInput
            min={0}
            defaultValue={100}
            value={sliderPercentage}
            step={1}
            onChange={handleSliderChange}
            marks={getSliderMarks(100, 4, 1, 0, "%")}
            showInput={true}
            maxToShow={100}
            placeholder="close %"
            label="close %"
          />
        </div>

        <PositionRow
          className={classNames({
            "hfi-up": pnlPercent.gt("0") && !isMarketClosed,
            "hfi-down": pnlPercent.lt("0") && !isMarketClosed,
            "disabled-opacity": isMarketClosed,
          })}
          left="pnl"
          right={
            <FlashingNumber
              className={classNames(classes.flashingPrice)}
              value={+pnl.toString()}
            >
              {pnlDisplay}
            </FlashingNumber>
          }
        />
        <PositionRow
          className={classNames({
            "hfi-up": pnlPercent.gt("0") && !isMarketClosed,
            "hfi-down": pnlPercent.lt("0") && !isMarketClosed,
            "disabled-opacity": isMarketClosed,
          })}
          left="return"
          right={
            <FlashingNumber
              className={classNames()}
              value={+pnlPercent.toString()}
            >
              {`${pnlPercentDisplay}%`}
            </FlashingNumber>
          }
        />
        <PositionRow
          className={classNames({
            "hfi-down": totalPositionFees.gt("0"),
            "hfi-up": totalPositionFees.lt("0"),
          })}
          left={
            <div uk-tooltip={`title: ${t.fundingTooltip}; pos: right;`}>
              <span
                className={classNames("uk-tooltip-content", {
                  "hfi-down": totalPositionFees.gt("0"),
                  "hfi-up": totalPositionFees.lt("0"),
                })}
              >
                {t.funding}
              </span>
            </div>
          }
          right={totalPositionFeesDisplay}
        />
      </div>

      <ButtonSmart
        id={`${isMobile ? "mobile-" : ""}position-close-button`}
        className={classNames("uk-margin-small-top", {
          "uk-margin-small-bottom": isMobile,
        })}
        onClick={handleClosePosition}
        network={getTradeNetworkOrNull(network) ?? undefined}
        loading={isClosingPosition}
        disabled={isClosePositionButtonDisabled}
      >
        {closePositionButtonText()}
      </ButtonSmart>
    </div>
  );
};

export default ClosePosition;
