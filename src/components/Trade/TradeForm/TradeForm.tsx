import classNames from "classnames";
import "rc-slider/assets/index.css";
import { useInView } from "react-intersection-observer";
import { useLocation } from "react-router-dom";
import classes from "./TradeForm.module.scss";
import {
  PRICE_IMPACT_DECIMALS,
  SHOULD_SHOW_SPREAD_FEE,
  THRESHOLD_FOR_SHORT_CUSTOM_UNIT,
  TRADE_LP_DEFAULT_CURRENCY_SYMBOL,
  TRADE_MAINTENANCE_MESSAGE,
} from "../../../config/trade";
import { usePositions } from "../../../context/Positions";
import { getTradeNetworkOrNull, useTrade } from "../../../context/Trade";
import { useLanguageStore } from "../../../context/Translation";
import { useUserBalanceStore } from "../../../context/UserBalances";
import { useUiStore } from "../../../context/UserInterface";
import {
  useConnectedAccount,
  useConnectedNetwork,
} from "@handle-fi/react-components/dist/context/UserWallet";
import useSetAccount from "../../../hooks/useSetAccount";
import {
  bigNumberToFloat,
  getUkTooltip,
  getZeroDecimalString,
  stripStringPrefix,
  uniqueId,
} from "../../../utils/general";
import {
  checkCorrectNetworkAndSendNotification,
  formatPrice,
  getInputString,
} from "../../../utils/trade";
import FlashingNumber from "../../FlashingNumber/FlashingNumber";
import PositionSizeInput from "../../PositionSizeInput/PositionSizeInput";
import { Button } from "@handle-fi/react-components/dist/components/handle_uikit/components/Button";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import PriceDisplayExtended from "../../PriceDisplayExtended/PriceDisplayExtended";
import SelectTradePair from "../../SelectTradePair";
import { TradeFormRow } from "./TradeFormRow";
import ConfirmTradeModal from "../../ConfirmTradeModal/ConfirmTradeModal";
import TradeAccount from "../../Trade/TradeAccount/TradeAccount";
import { convertPartial } from "../../../utils/priceError";
import {
  MarketPrice,
  AMOUNT_DECIMALS,
  TradePairId,
} from "handle-sdk/dist/components/trade";
import { bnToDisplayString } from "../../../utils/format";
import ButtonSmart from "../../ButtonSmart/ButtonSmart";
import MobileConfirmTrade from "../../../components/Mobile/MobileConfirmTrade";
import { useTradeFormInput } from "../../../hooks/trade/useTradeFormInput";
import {
  Fragment,
  ReactNode,
  createRef,
  useCallback,
  useEffect,
  useMemo,
  useState,
  KeyboardEvent,
} from "react";
import { getContractUnitConfig } from "../../../config/contractUnit";
import useInputNumberState from "../../../hooks/useInputNumberState";
import { useTradeSize } from "../../../context/TradeSize";
import { useMarketAvailability } from "../../../hooks/useMarketAvailability";
import { constants } from "ethers";
import {
  Notify,
  showNotification,
} from "@handle-fi/react-components/dist/utils/notifications";
import { getPairUnavailabilityMessage } from "../../../utils/trade/errors/weekendTrading";
import { TradeNetwork, tradeNetworks } from "handle-sdk/dist/types/network";
import { isKeyPressedEnter } from "../../../utils/ui";
import { useTradePrices } from "../../../context/TradePrices";
import {
  AMOUNT_UNIT,
  PRICE_DECIMALS,
} from "handle-sdk/dist/components/trade/reader";
import { useTradeFormDimensions } from "../../../hooks/useTradeFormDimensions";
import { useIsMaxOpenInterestExceeded } from "../../../hooks/useIsMaxOpenInterestExceeded";
import { calculatePriceImpactPercentage } from "../../../utils/trade/calculatePriceImpact";
import usePromise from "@handle-fi/react-components/dist/hooks/usePromise";
import { fetchMaintenanceStatus } from "../../../utils/maintenance";
import { pairToString } from "handle-sdk/dist/utils/general";
import { useInstrumentOrThrow } from "../../../hooks/trade/useInstrumentOrThrow";
import { useTradeAccountDisplay } from "../../../context/TradeAccountDisplay";
import {
  getIsTiprActive,
  getTiprEligibilityMessage,
} from "../../../utils/trade/tiprFli";
import { TiprButton } from "../../Tipr/TiprButton";
import { useIncentives } from "../../../context/Incentives/Incentives";
import { TiprEligibilityMessage } from "../../../components/Tipr/TiprEligibilityMessage";
import { calculateApeMaxPositionSize } from "../../../utils/trade/apeMax";

type PanelType = "buy" | "sell";

export type TradeProps = {
  side?: PanelType;
  modal?: boolean;
  closeModal?: () => void;
  onConfirmOpen?: (open: boolean) => void;
};

export type RowProps = {
  id: string;
  className?: string;
  leftSide: ReactNode;
  rightSide: ReactNode;
  tooltip?: string[];
};

const TradeForm = (props: TradeProps) => {
  useSetAccount();
  useTradePrices();
  const network = useConnectedNetwork();
  const idPrefix = () => {
    if (isMobile) return "mobile";
    if (props.modal) return "modal";
    return "tab";
  };
  const [formId] = useState(uniqueId(5));
  const getUniqueId = useCallback(
    (v: string) => `${idPrefix()}-trade-${formId}-${v}`,
    [],
  );

  const connectedAccount = useConnectedAccount();
  const connectedNetwork = useConnectedNetwork();
  const {
    protocol,
    account,
    selectedTradePairId,
    selectedTradePair: tradePair,
    setSelectedPair,
    tradeGasFee,
  } = useTrade();
  const activePath = useLocation().pathname;
  const { isMobile } = useUiStore();
  const { t } = useLanguageStore();
  const { setShowPositionsInChart } = usePositions();
  const { setSize: setContextSize, setSizeLpc: setContextSizeLpc } =
    useTradeSize();
  const { tiprState } = useIncentives();

  const [tradeMaintenanceStatus] = usePromise(
    async () => fetchMaintenanceStatus("trade"),
    [],
  );
  useEffect(() => {
    if (tradeMaintenanceStatus) {
      showNotification({
        status: "info",
        message: TRADE_MAINTENANCE_MESSAGE,
        timeoutInSeconds: 0,
        showProgressBar: false,
      });
    }
  }, [tradeMaintenanceStatus]);

  useEffect(() => {
    if (connectedNetwork)
      checkCorrectNetworkAndSendNotification(t, connectedNetwork, activePath);
  }, [activePath, connectedNetwork]);

  const availability = useMarketAvailability(tradePair);
  const isMarketClosed = !availability.isAvailable;

  const setTradePairInternal = useCallback(
    (pairId: TradePairId) => {
      setSelectedPair(pairId.pair);
    },
    [setSelectedPair],
  );

  useEffect(() => {
    positionSizeInput.reset();
    setContextSize(constants.Zero);
    setContextSizeLpc(constants.Zero);
  }, [selectedTradePairId]);

  const [showConfirmTradeModal, setShowConfirmTradeModal] = useState(false);
  const { refreshBalance } = useUserBalanceStore();
  const [panelType, setPanelType] = useState<PanelType>(
    props.side ? props.side : "buy",
  );
  const isLong = panelType === "buy";

  const input = useTradeFormInput(isLong);
  const onChangePanelType = (to: PanelType) => {
    setPanelType(to);
    const longFactor = to === "buy" ? 1 : -1;
    setContextSize(input.sizeSigned);
    setContextSizeLpc(input.valueLpc.mul(longFactor));
  };
  const positionSizeInput = useInputNumberState();
  const tradePairPrice =
    protocol.tryGetPrice(selectedTradePairId, input.sizeSigned) ??
    MarketPrice.zero();
  const instrument = useInstrumentOrThrow(pairToString(tradePair.pair));
  const pairDisplayDecimals = instrument.getDisplayDecimals(
    tradePairPrice.index,
    true,
  );
  const isMaxOpenInterestExceeded = useIsMaxOpenInterestExceeded(
    input.sizeSigned,
  );

  const { simulated } = useTradeAccountDisplay();
  const { effect, spreadFee: spreadFeeNullable } = convertPartial(
    simulated?.result,
  );
  const entryPrice = tradePairPrice.getTradePrice(isLong);
  const hasSufficientMargin =
    simulated?.nextAccountDisplay?.hasSufficientMargin ?? true;
  const trueLeverage =
    simulated?.result.nextAccount.getLeverage() ?? constants.Zero;
  const trueLeverageDisplay =
    trueLeverage && bnToDisplayString(trueLeverage, AMOUNT_DECIMALS);

  const canTrade =
    tradeNetworks.includes(network as TradeNetwork) &&
    !!account &&
    !isMarketClosed &&
    input.size.gt(0) &&
    hasSufficientMargin &&
    !isMaxOpenInterestExceeded;

  const onConfirmClose = () => {
    setShowConfirmTradeModal(false);
    if (props.onConfirmOpen) props.onConfirmOpen(false);
  };

  const onConfirmTrade = (notification: Notify) => {
    showNotification(notification);
    input.clear();
    positionSizeInput.reset();
    setContextSize(constants.Zero);
    setContextSizeLpc(constants.Zero);
    refreshBalance(network).catch(console.error);
    setShowPositionsInChart(true);
    (document.activeElement as HTMLElement).blur();
    if (props.modal && props.closeModal) props.closeModal();
  };

  const [showDetails, setShowDetails] = useState(false);
  const toggleShowDetails = () => setShowDetails(!showDetails);

  // This is needed to make sure the form
  // is disabled when it's off screen (mobile).
  const { ref, inView } = useInView({ threshold: 0.5 });
  const isFormDisabled = isMobile && !inView;

  const marginFeeIfDisconnected = tradePair.getMarginFee(
    input.size,
    entryPrice,
  );
  const marginFee = effect?.marginFee ?? marginFeeIfDisconnected;
  const spreadFee = SHOULD_SHOW_SPREAD_FEE
    ? spreadFeeNullable ?? constants.Zero
    : constants.Zero;
  const fees = input.size.gt(0)
    ? marginFee.add(tradeGasFee).add(spreadFee)
    : constants.Zero;
  const feesDisplay = formatPrice(fees, undefined, "USD", AMOUNT_DECIMALS);
  const marginFeeToDisplay = bnToDisplayString(marginFee, AMOUNT_DECIMALS, 3);
  const spreadFeeToDisplay = bnToDisplayString(spreadFee, AMOUNT_DECIMALS, 3);
  const spreadFeeTooltip = SHOULD_SHOW_SPREAD_FEE
    ? ` and spread fee of ${spreadFeeToDisplay} USD`
    : "";
  const gasFeeToDisplay = bnToDisplayString(
    input.size.gt(0) ? tradeGasFee : constants.Zero,
    AMOUNT_DECIMALS,
    3,
  );
  const gasFeeTooltip = ` sequencer fee of ${gasFeeToDisplay} USD`;
  const feesTooltip = `trade fee of ${marginFeeToDisplay} USD${
    SHOULD_SHOW_SPREAD_FEE ? "," : " and"
  }${gasFeeTooltip}${spreadFeeTooltip}`;

  const maxLeverageDisplay = `${bnToDisplayString(
    AMOUNT_UNIT.div(tradePair.initialMarginFraction),
    0,
    0,
  )}x`;

  const onClickDegenMax = async () => {
    if (!account || !trueLeverage || !tradePairPrice || entryPrice.isZero()) {
      return;
    }
    const degenSize = calculateApeMaxPositionSize(
      account,
      tradePair,
      protocol,
      input.userInputType,
      entryPrice,
      tradeGasFee,
      isLong,
    );
    const isLpc = input.userInputType == "Lpc";
    positionSizeInput.onChange({
      bn: degenSize,
      string: getInputString(degenSize, isLpc, pairDisplayDecimals),
    });
  };

  const onClickTrade = () => {
    if (!connectedAccount) {
      return alert("Please connect your wallet");
    }
    setShowConfirmTradeModal(true);
    if (props.onConfirmOpen) props.onConfirmOpen(true);
  };

  const marketPrice = tradePairPrice.marketPrice ?? constants.Zero;
  const marketPriceDisplay = bnToDisplayString(
    marketPrice,
    PRICE_DECIMALS,
    pairDisplayDecimals,
    pairDisplayDecimals,
  );

  const entryPriceDisplay = bnToDisplayString(
    entryPrice,
    PRICE_DECIMALS,
    pairDisplayDecimals,
    pairDisplayDecimals,
  );

  const priceImpact = calculatePriceImpactPercentage(entryPrice, marketPrice);
  const priceImpactToDisplayIfNoSize = "-";
  const priceImpactDisplay = input.size.isZero()
    ? priceImpactToDisplayIfNoSize
    : `${bnToDisplayString(
        priceImpact,
        PRICE_DECIMALS,
        PRICE_IMPACT_DECIMALS,
      )}%`;

  const getTradeButtonText = () => {
    if (isMarketClosed) {
      const prefix = "market ";
      // Some unavailability messages start with market, so it is removed here.
      const message = stripStringPrefix(
        getPairUnavailabilityMessage(
          t,
          availability.reason,
          tradePair.pair,
          true,
          true,
        ),
        prefix,
      );
      return `${prefix}${message}`;
    }
    if (!hasSufficientMargin) {
      return t.insufficientFunds;
    }
    if (isMaxOpenInterestExceeded) {
      return t.maximumOpenInterestExceeded;
    }
    if (input.size.gt(0) && isLong) {
      return "buy @ market";
    }
    if (input.size.gt(0) && !isLong) {
      return "sell @ market";
    }
    return "trade";
  };

  const tradeButtonColour = () => {
    if (!canTrade) return;
    return isLong ? "up" : "down";
  };
  const shouldShowButtonAlert =
    !!account && (!hasSufficientMargin || isMaxOpenInterestExceeded);

  const showTradeForm =
    (isMobile && !showConfirmTradeModal) ||
    (!isMobile && !(props.modal && showConfirmTradeModal));

  const contractUnitConfig = useMemo(
    () =>
      getContractUnitConfig(
        tradePair.pair,
        instrument,
        TRADE_LP_DEFAULT_CURRENCY_SYMBOL,
      ),
    [tradePair.pair],
  );

  const lotSizeSuffix = useMemo(
    () => (contractUnitConfig.lotSize === 1 ? "unit" : "units"),
    [contractUnitConfig.lotSize],
  );

  const buttonRef = createRef<HTMLButtonElement>();
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (isKeyPressedEnter(e)) {
      e.preventDefault();
      buttonRef.current?.focus();
    }
  };

  const { tradeFormRef, tradeFormWidth } = useTradeFormDimensions();
  const [shouldShowShortCustomUnit, setShouldShowShortCustomUnit] =
    useState<boolean>(false);
  useEffect(() => {
    setShouldShowShortCustomUnit(
      tradeFormWidth <= THRESHOLD_FOR_SHORT_CUSTOM_UNIT,
    );
  }, [tradeFormWidth]);

  const tiprEligibilityMessage = getTiprEligibilityMessage(
    instrument,
    input.valueLpc,
    t,
    tiprState,
  );

  return (
    <Fragment>
      <div
        ref={ref}
        hidden={!showTradeForm}
        className={classNames({
          [classes.formContainer]: !props.modal,
          [classes.formContainerMobile]: isMobile,
        })}
      >
        {isMobile && getIsTiprActive() && (
          <TiprButton className="uk-margin-xsmall-top uk-margin-small-bottom" />
        )}
        {isMobile && <TradeAccount />}
        <div
          ref={tradeFormRef}
          className={classNames("uk-width-expand uk-flex uk-flex-center", {
            "uk-margin-small-top": isMobile,
          })}
        >
          <div
            className={classNames(
              "uk-align-center uk-flex-1 uk-margin-remove-bottom",
              {
                "uk-form-width-large": !isMobile,
              },
            )}
          >
            <div className="uk-margin-bottom">
              <label
                htmlFor={getUniqueId("market-select-wrapper")}
                className={classNames(
                  "uk-width-expand uk-flex uk-flex-between",
                  classes.label,
                )}
              >
                {t.market}
                <div className={classes.maxLeverage}>{maxLeverageDisplay}</div>
              </label>
              <SelectTradePair
                id={getUniqueId("market-select")}
                disabled={isFormDisabled}
                onChange={setTradePairInternal}
                value={tradePair.id}
                withSearch
                showInputAsSearch={false}
                shouldShowShortCustomUnit={shouldShowShortCustomUnit}
                showFavouritesOnly
                enableSelected
              />
            </div>

            <div className="uk-width-expand uk-flex uk-flex-center">
              <BuySellPrices
                prices={tradePairPrice}
                priceDecimals={pairDisplayDecimals}
                isLong={isLong}
              />
            </div>

            <div className="uk-button-group uk-flex uk-width-expand">
              <BuySellButton
                getUniqueId={getUniqueId}
                isLong={isLong}
                panelType="sell"
                setPanelType={onChangePanelType}
                disabled={isFormDisabled}
              />
              <BuySellButton
                getUniqueId={getUniqueId}
                isLong={isLong}
                panelType="buy"
                setPanelType={onChangePanelType}
                disabled={isFormDisabled}
              />
            </div>

            <div className="uk-margin-small-top">
              <PositionSizeInput
                onClickDegenMax={onClickDegenMax}
                id={getUniqueId("position-size")}
                marketPrice={tradePairPrice}
                alert={!hasSufficientMargin}
                inputState={positionSizeInput}
                isLong={isLong}
                input={input}
                disabled={isFormDisabled}
                onKeyDown={onKeyDown}
              />
            </div>

            <div className="uk-margin-small">
              <div className="uk-flex uk-flex-between">
                <div>{t.marketPrice}</div>
                <div>
                  <FlashingNumber
                    className={classNames(
                      "uk-tooltip-content",
                      classes.flashingPrice,
                    )}
                    value={tradePairPrice?.marketPrice.toNumber()}
                  >
                    <PriceDisplayExtended
                      price={marketPriceDisplay}
                      hasCurrency
                      className={classes.flashingPrice}
                    />
                  </FlashingNumber>
                </div>
              </div>

              <div className="uk-flex uk-flex-between">
                <div>{`${t.estimatedAbbrev} ${t.entryPrice}`}</div>
                <div>
                  <FlashingNumber
                    className={classNames(
                      "uk-tooltip-content",
                      classes.flashingPrice,
                    )}
                    value={
                      entryPrice
                        ? bigNumberToFloat(entryPrice, PRICE_DECIMALS)
                        : 0
                    }
                  >
                    <PriceDisplayExtended
                      price={entryPriceDisplay}
                      hasCurrency
                      className={classes.flashingPrice}
                    />
                  </FlashingNumber>
                </div>
              </div>

              <div className="uk-flex uk-flex-between">
                <div>{`${t.estimatedAbbrev} ${t.priceImpact}`}</div>
                <div className={classNames({ "hfi-down": priceImpact.lt(0) })}>
                  {priceImpactDisplay}
                </div>
              </div>

              {!!tiprEligibilityMessage && (
                <TradeFormRow
                  id={getUniqueId("tipr-eligibility-row")}
                  className="uk-flex uk-text-right"
                  leftSide={""}
                  rightSide={
                    <TiprEligibilityMessage
                      tiprEligibilityMessage={tiprEligibilityMessage}
                    />
                  }
                />
              )}

              <div className="uk-flex uk-flex-between">
                <span></span>
                <span
                  id={getUniqueId("toggle-details")}
                  onClick={toggleShowDetails}
                  uk-tooltip={getUkTooltip({
                    position: "bottom-right",
                    title: showDetails ? t.hideDetails : t.showDetails,
                    hide: isMobile,
                  })}
                >
                  <span className="uk-tooltip-content cursor-pointer">
                    <FontAwesomeIcon
                      icon={[
                        "far",
                        `${showDetails ? "chevron-up" : "chevron-down"}`,
                      ]}
                    />
                  </span>
                </span>
              </div>

              {showDetails && (
                <>
                  <TradeFormRow
                    id={getUniqueId("unit-row")}
                    leftSide={"unit"}
                    rightSide={contractUnitConfig.unit.display}
                  />
                  <TradeFormRow
                    id={getUniqueId("lot-size-row")}
                    leftSide="lot size"
                    rightSide={
                      <>
                        {contractUnitConfig.lotSize} {lotSizeSuffix}
                      </>
                    }
                  />
                  <TradeFormRow
                    id={getUniqueId("fees-row")}
                    leftSide={t.fees}
                    rightSide={feesDisplay}
                    tooltip={[feesTooltip]}
                  />
                </>
              )}
            </div>

            <div>
              <ButtonSmart
                id={getUniqueId("execute-button")}
                className={classes.tradeButton}
                expand
                ref={buttonRef}
                onClick={onClickTrade}
                disabled={isFormDisabled || !canTrade}
                alert={shouldShowButtonAlert}
                color={tradeButtonColour()}
                network={getTradeNetworkOrNull(network) ?? undefined}
              >
                {getTradeButtonText()}
              </ButtonSmart>
            </div>
          </div>
        </div>
      </div>

      {!isMobile && showConfirmTradeModal && (
        <ConfirmTradeModal
          show={showConfirmTradeModal}
          onClose={onConfirmClose}
          onConfirm={onConfirmTrade}
          isLong={isLong}
          input={input}
          leverage={trueLeverageDisplay ?? ""}
          tradePair={tradePair}
        />
      )}

      {isMobile && showConfirmTradeModal && (
        <MobileConfirmTrade
          onClose={onConfirmClose}
          onConfirm={onConfirmTrade}
          input={input}
          leverage={trueLeverageDisplay ?? ""}
          tradePair={tradePair}
          isLong={isLong}
        />
      )}
    </Fragment>
  );
};

type BuySellButtonProps = {
  getUniqueId: (v: string) => string;
  isLong: boolean;
  panelType: PanelType;
  setPanelType: (p: PanelType) => void;
  disabled?: boolean;
};

const BuySellButton = (props: BuySellButtonProps) => {
  const { t } = useLanguageStore();
  const upDown = props.panelType === "buy" ? "up" : "down";
  const panelTypeIsLong = props.panelType === "buy";
  return (
    <Button
      id={props.getUniqueId(`${props.panelType}-button`)}
      active={props.isLong === panelTypeIsLong}
      className={`hfi-${upDown}-button`}
      expand={true}
      onClick={() => props.setPanelType(props.panelType)}
      disabled={props.disabled}
    >
      <FontAwesomeIcon
        className="uk-margin-small-right"
        icon={["far", `chart-line-${upDown}`]}
      />
      {t[props.panelType]}
    </Button>
  );
};

type BuySellPricesProps = {
  prices: MarketPrice;
  priceDecimals: number;
  isLong: boolean;
};

const BuySellPrices = (props: BuySellPricesProps) => {
  return (
    <div
      className={classNames(classes.buySellPrices, "uk-flex uk-flex-center")}
    >
      <BuySellPrice
        panelType={"sell"}
        isLong={props.isLong}
        prices={props.prices}
        priceDecimals={props.priceDecimals}
      />
      <BuySellPrice
        panelType={"buy"}
        isLong={props.isLong}
        prices={props.prices}
        priceDecimals={props.priceDecimals}
      />
    </div>
  );
};

type BuySellPriceProps = {
  prices: MarketPrice;
  priceDecimals: number;
  isLong: boolean;
  panelType: PanelType;
};

const BuySellPrice = (props: BuySellPriceProps) => {
  const panelTypeIsLong = props.panelType === "buy";
  const isDisabled = props.isLong !== panelTypeIsLong;
  const price = props.prices.getTradePrice(panelTypeIsLong);
  const entryPriceDisplay = price
    ? bnToDisplayString(
        price,
        PRICE_DECIMALS,
        props.priceDecimals,
        props.priceDecimals,
      )
    : getZeroDecimalString(props.priceDecimals);
  return (
    <div
      className={classNames(classes[`${props.panelType}Price`], {
        [classes.disabled]: isDisabled,
      })}
    >
      {entryPriceDisplay}
    </div>
  );
};

export default TradeForm;
