import classNames from "classnames";
import { constants, utils } from "ethers";
import {
  AMOUNT_DECIMALS,
  MarketPrice,
  PRICE_DECIMALS,
  TradePair,
  TradeSize,
} from "handle-sdk/dist/components/trade";
import { useTrade } from "../../context/Trade";
import { useLanguageStore } from "../../context/Translation";
import { LOT_SIZE_MAX_DECIMALS, USD_DISPLAY_DECIMALS } from "../../utils/trade";
import { pairToDisplayTokens } from "../../utils/trade/toDisplayPair";
import Button from "../Button";
import DisplayValue from "../DisplayValue/DisplayValue";
import PairDisplay from "@handle-fi/react-components/dist/components/PairDisplay/PairDisplay";
import PriceDisplayExtended from "../PriceDisplayExtended/PriceDisplayExtended";
import classes from "./ConfirmTrade.module.scss";
import { Row } from "./ConfirmTradeRow";
import {
  useSigner,
  useUserWalletStore,
} from "@handle-fi/react-components/dist/context/UserWallet";
import {
  Notify,
  showNotification,
} from "@handle-fi/react-components/dist/utils/notifications";
import { uniqueId, sleep, getZeroDecimalString } from "../../utils/general";
import { useUiStore } from "../../context/UserInterface";
import React from "react";
import Loader from "@handle-fi/react-components/dist/components/Loader";
import { getThemeFile } from "../../utils/ui";
import { bnToDisplayString } from "../../utils/format";
import { TradeFormInputHook } from "../../hooks/trade/useTradeFormInput";
import { getInputTypeLabel } from "../PositionSizeInput/PositionSizeInput";
import {
  getTradeSuccessNotification,
  getTradeNotifications,
  useDisplaySymbolAndIcon,
} from "../../config/notifications";
import { isTransactionCancelled } from "../../hooks/useSendTransaction";
import { shouldShowApprovalAndPendingNotification } from "../../utils/wallet";
import { LEVERAGE_DISPLAY_DECIMALS } from "../../config/constants";
import { AMOUNT_UNIT } from "handle-sdk/dist/components/trade/reader";
import { useOneClickTradingWallet } from "../../hooks/useOneClickTrading";
import { PRICE_IMPACT_DECIMALS } from "../../config/trade";
import { calculatePriceImpactPercentage } from "../../utils/trade/calculatePriceImpact";
import { useInstrumentOrThrow } from "../../hooks/trade/useInstrumentOrThrow";
import { pairToString } from "handle-sdk/dist/utils/general";
import { useTradeAccountDisplay } from "../../context/TradeAccountDisplay";
import { getTiprEligibilityMessage } from "../../utils/trade/tiprFli";
import { useIncentives } from "../../context/Incentives/Incentives";
import { TiprEligibilityMessage } from "../Tipr/TiprEligibilityMessage";

export type ConfirmTradeProps = {
  leverage: string;
  isLong: boolean;
  onClose: () => void;
  onConfirm: (notification: Notify) => void;
  tradePair: TradePair;
  input: TradeFormInputHook;
};

const ConfirmTrade = ({
  isLong,
  onClose,
  onConfirm,
  tradePair,
  input,
}: ConfirmTradeProps) => {
  const { protocol, selectedTradePairId, account } = useTrade();
  const { isMobile, activeTheme } = useUiStore();
  const { walletChoice } = useUserWalletStore();
  const tradePairPrice =
    protocol.tryGetPrice(selectedTradePairId, input.sizeSigned) ??
    MarketPrice.zero();
  const entryPrice = isLong ? tradePairPrice.bestAsk : tradePairPrice.bestBid;
  const { t } = useLanguageStore();
  const signer = useSigner();
  const oneClickTradeSigner = useOneClickTradingWallet(account?.id);
  const [isSubmittingTrade, setIsSubmittingTrade] =
    React.useState<boolean>(false);
  const id = React.useMemo(
    () => `${isMobile ? "mobile" : "tab"}-trade-confirm-${uniqueId(5)}`,
    [],
  );
  const instrument = useInstrumentOrThrow(pairToString(tradePair.id.pair));
  const pairDisplayDecimals = instrument.getDisplayDecimals(entryPrice, true);
  const { tiprState } = useIncentives();

  const displaySymbolAndIcon = useDisplaySymbolAndIcon(
    tradePair.id.pair,
    instrument,
  );

  const initialMargin = tradePair.getInitialMargin(
    input.sizeSigned,
    tradePairPrice.index,
  );
  const initialMarginDisplay = bnToDisplayString(
    initialMargin,
    AMOUNT_DECIMALS,
    USD_DISPLAY_DECIMALS,
  );

  const { currentAccountDisplay, simulated } = useTradeAccountDisplay();
  const nextAccount = simulated?.result.nextAccount;
  const trueLeverage = nextAccount?.getLeverage();
  const trueLeverageDisplay = trueLeverage
    ? bnToDisplayString(
        trueLeverage,
        AMOUNT_DECIMALS,
        LEVERAGE_DISPLAY_DECIMALS,
      )
    : getZeroDecimalString(LEVERAGE_DISPLAY_DECIMALS);

  const trade = async () => {
    if (!account || !signer) {
      return alert("no account");
    }

    const notifications = getTradeNotifications({
      displaySymbolAndIcon,
      isLong,
      input,
      hasOneClickTradingWallet: !!oneClickTradeSigner,
    });

    const pendingNotification = notifications.pending
      ? showNotification({
          status: "pending",
          message: notifications.pending,
        })
      : undefined;
    let approvalNotification = null;

    try {
      setIsSubmittingTrade(true);
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
      const tradeSize =
        input.userInputType == "Lpc"
          ? TradeSize.fromLpc(input.valueLpcSigned)
          : TradeSize.fromLot(input.sizeSigned);
      const response = await account.trade({
        pairId: tradePair.id,
        signer: oneClickTradeSigner ?? signer,
        size: tradeSize,
      });

      // success notification needs to show the filled price/value
      // and needs to be shown by the trade form
      // or it doesn't appear on mobile
      const successNotification: Notify = {
        status: "success",
        message: getTradeSuccessNotification(
          tradePair.id.pair,
          displaySymbolAndIcon,
          instrument.getDisplayDecimals(entryPrice),
          response,
          input,
          isLong,
        ),
      };
      onConfirm(successNotification);
      account?.onUpdate?.();
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
      setIsSubmittingTrade(false);
      pendingNotification?.close();
      approvalNotification?.close();
    }
  };

  const longText = isLong ? t.buy : t.sell;
  const displayPair = pairToDisplayTokens(tradePair.id.pair);
  const displayDecimalsExtended = instrument.getDisplayDecimals(
    entryPrice,
    true,
  );
  const entryPriceDisplay = bnToDisplayString(
    entryPrice,
    PRICE_DECIMALS,
    displayDecimalsExtended,
    displayDecimalsExtended,
  );

  const userInputValue =
    input.userInputType === "Lot" ? input.size : input.valueLpc;
  const userInputType = input.userInputType;
  const userInputValueToDisplay = bnToDisplayString(
    userInputValue,
    AMOUNT_DECIMALS,
    USD_DISPLAY_DECIMALS,
    input.decimals,
  );

  const marginUsage =
    simulated?.nextAccountDisplay.marginUsage ??
    currentAccountDisplay.marginUsage;
  const canTrade = marginUsage?.lt(AMOUNT_UNIT.mul(100));
  const confirmButtonText = canTrade
    ? `confirm ${longText} @ market`
    : t.insufficientFunds;

  const marketPrice = tradePairPrice.marketPrice ?? constants.Zero;
  const marketPriceDisplay = bnToDisplayString(
    marketPrice,
    PRICE_DECIMALS,
    pairDisplayDecimals,
    pairDisplayDecimals,
  );
  const priceImpact = calculatePriceImpactPercentage(entryPrice, marketPrice);
  const priceImpactDisplay = `${bnToDisplayString(
    priceImpact,
    PRICE_DECIMALS,
    PRICE_IMPACT_DECIMALS,
  )}%`;

  const tiprEligibilityMessage = getTiprEligibilityMessage(
    instrument,
    input.valueLpc,
    t,
    tiprState,
  );

  return (
    <div
      className={classNames("uk-margin-small-top", classes.wrapper, {
        [classes.container]: isMobile,
      })}
    >
      <div className="uk-flex uk-flex-wrap uk-width-1-1 uk-margin-small">
        <span className="uk-margin-small-right">
          {userInputValueToDisplay}{" "}
          {getInputTypeLabel(userInputType, userInputValue)}
        </span>
        <span
          className={classNames(
            "uk-flex uk-margin-small-right",
            classes.pairDisplay,
          )}
        >
          <PairDisplay pair={displayPair} instrument={instrument} />
        </span>
        <span
          className={classNames("uk-margin-small-right", {
            "hfi-up": isLong,
            "hfi-down": !isLong,
          })}
        >
          {longText}
        </span>
        <span>
          {/*
           * If the user input is in LPC, show the equivalent in lots.
           * If the user input is in lots, show the equivalent in LPC.
           */}
          <DisplayValue
            value={
              +utils.formatUnits(
                input.userInputType === "Lot" ? input.valueLpc : input.size,
                AMOUNT_DECIMALS,
              )
            }
            minDecimals={USD_DISPLAY_DECIMALS}
            decimals={
              input.userInputType == "Lot"
                ? USD_DISPLAY_DECIMALS
                : LOT_SIZE_MAX_DECIMALS
            }
            parentheses
            currency={getInputTypeLabel(
              input.userInputType === "Lot" ? "Lpc" : "Lot",
              input.userInputType === "Lot" ? input.valueLpc : input.size,
            )}
          />
        </span>
      </div>

      <Row
        left={t.marketPrice}
        right={
          <PriceDisplayExtended
            price={marketPriceDisplay}
            hasCurrency={true}
            className={classes.priceDisplayExtended}
          />
        }
      />
      <Row
        left={`${t.estimatedAbbrev} ${t.entryPrice}`}
        right={
          <PriceDisplayExtended
            price={entryPriceDisplay}
            hasCurrency={true}
            className={classes.priceDisplayExtended}
          />
        }
      />
      <Row
        left={`${t.estimatedAbbrev} ${t.priceImpact}`}
        right={
          <span className={classNames({ "hfi-down": priceImpact.lt(0) })}>
            {priceImpactDisplay}
          </span>
        }
      />
      {!!tiprEligibilityMessage && (
        <Row
          left={""}
          right={
            <TiprEligibilityMessage
              tiprEligibilityMessage={tiprEligibilityMessage}
            />
          }
        />
      )}
      <div className="hfi-divider" />
      <Row left={t.initialMargin} right={initialMarginDisplay} />
      <Row left={t.accountLeverage} right={`${trueLeverageDisplay}x`} />

      <Button
        id={`${id}-execute-button`}
        className={classNames("uk-margin-small-top", {
          "hfi-up-button": canTrade && isLong,
          "hfi-down-button": !canTrade || (canTrade && !isLong),
        })}
        expand
        disabled={!canTrade || isSubmittingTrade}
        onClick={trade}
      >
        {isSubmittingTrade ? (
          <Loader color={getThemeFile(activeTheme).backgroundColor} />
        ) : (
          confirmButtonText
        )}
      </Button>
    </div>
  );
};

export default ConfirmTrade;
