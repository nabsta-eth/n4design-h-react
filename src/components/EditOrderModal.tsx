import {
  ActiveDecreaseOrder,
  ActiveIncreaseOrder,
  PRICE_DECIMALS,
} from "handle-sdk/dist/components/trade/platforms/legacyInterface";
import { getActionPrice } from "handle-sdk/dist/utils/trade";
import React from "react";
import { useRefreshOrders } from "../context/Orders";
import { useTrade } from "../context/Trade";
import { useTradePrices } from "../context/TradePrices";
import {
  useSigner,
  useUserWalletStore,
} from "@handle-fi/react-components/dist/context/UserWallet";
import useInputNumberState from "../hooks/useInputNumberState";
import useSendTransaction from "../hooks/useSendTransaction";
import { USD_DISPLAY_DECIMALS, formatPrice } from "../utils/trade";
import { oldToNew } from "../utils/trade/oldToNew";
import {
  getDecreaseTriggerOrderError,
  isIncreaseOrder,
  orderTypeToDisplay,
  triggerThresholdToOrderType,
} from "../utils/trade/orders";
import { pairToDisplayString } from "../utils/trade/toDisplayPair";
import InputNumber from "./InputNumber/InputNumber";
import Modal from "@handle-fi/react-components/dist/components/Modal";
import { Button } from "@handle-fi/react-components/dist/components/handle_uikit/components/Button";
import { bnToDisplayString } from "../utils/format";
import useGasPriceToUse from "../hooks/useGasPriceToUse";
import { BigNumber } from "ethers";
import ButtonSmart from "./ButtonSmart/ButtonSmart";
import { DEFAULT_HLP_NETWORK } from "handle-sdk/dist/components/trade/platforms/hlp/config";
import { useLanguageStore } from "../context/Translation";
import { useUiStore } from "../context/UserInterface";
import { MarketPrice } from "handle-sdk/dist/components/trade";

type Props = {
  order: ActiveIncreaseOrder | ActiveDecreaseOrder;
  onClose: () => void;
};

export const EditOrderModal: React.FC<Props> = props => {
  const { order, onClose } = props;
  const { getPrice } = useTradePrices();
  const { sendTransaction, sendingTransaction } = useSendTransaction();
  const signer = useSigner();
  const { slippage } = useUserWalletStore();
  const refreshOrder = useRefreshOrders();
  const isIncrease = isIncreaseOrder(order);
  const gasPrice = useGasPriceToUse();
  const { t } = useLanguageStore();
  const { showChooseWalletModal } = useUiStore();

  // State starts equal to the order, and can be reset to that value
  const initialTriggerPriceDisplay = {
    bn: order.triggerPrice,
    string: bnToDisplayString(order.triggerPrice, PRICE_DECIMALS),
  };
  const triggerPrice = useInputNumberState(initialTriggerPriceDisplay);
  const resetTriggerPrice = () =>
    triggerPrice.onChange(initialTriggerPriceDisplay);

  const initialSizeDeltaDisplay = {
    bn: order.sizeDelta,
    string: bnToDisplayString(order.sizeDelta, PRICE_DECIMALS),
  };
  const sizeDelta = useInputNumberState(initialSizeDeltaDisplay);
  const resetSizeDelta = () => sizeDelta.onChange(initialSizeDeltaDisplay);

  const initialCollateralDeltaDisplay = !isIncrease
    ? {
        bn: order.collateralDelta,
        string: bnToDisplayString(order.collateralDelta, PRICE_DECIMALS),
      }
    : undefined;
  const collateralDelta = useInputNumberState(initialCollateralDeltaDisplay);
  const resetCollateralDelta = () => {
    // initialCollateralDeltaDisplay will be undefined if the position is an increase.
    // This should not happen in that case the button should not be able to be pressed.
    if (initialCollateralDeltaDisplay) {
      collateralDelta.onChange(initialCollateralDeltaDisplay);
    }
  };

  const onSubmit = async () => {
    if (!signer) return;

    await sendTransaction(
      () => {
        return isIncrease
          ? // @ts-ignore TODO IMPLEMENT/FIX
            platform.updateIncreasePositionOrder({
              orderId: order.orderId,
              collateralDelta: collateralDelta.value.bn,
              indexDelta: sizeDelta.value.bn,
              shouldTriggerAboveThreshold: order.shouldTriggerAboveThreshold,
              signer,
              slippagePercent: slippage,
              triggerPrice: triggerPrice.value.bn,
              pair: order.pair,
              overrides: { gasPrice },
            })
          : // @ts-ignore TODO IMPLEMENT/FIX
            platform.updateDecreasePositionOrder({
              orderId: order.orderId,
              collateralDelta: collateralDelta.value.bn,
              indexDelta: sizeDelta.value.bn,
              shouldTriggerAboveThreshold: order.shouldTriggerAboveThreshold,
              signer,
              slippagePercent: slippage,
              triggerPrice: triggerPrice.value.bn,
              pair: order.pair,
              overrides: { gasPrice },
            });
      },
      {
        awaitingApproval: "awaitingApproval",
        error: "error",
        pending: "pending",
        success: "success",
      },
      {
        callback: async () => {
          refreshOrder();
          onClose();
        },
      },
    );
  };

  const actionPrice = getActionPrice(
    order.isLong,
    false,
    getPrice(order.pair) ?? MarketPrice.zero(),
    0,
  );

  const decreaseTriggerOrderError = getDecreaseTriggerOrderError(
    t,
    triggerPrice,
    order.isLong,
    triggerThresholdToOrderType(
      order.isLong,
      order.shouldTriggerAboveThreshold,
      isIncrease,
    ),
    actionPrice,
  );

  // Note that there is no collateral for increases, so collateral is
  // considered the same for increases.
  const isCollateralSame =
    isIncrease || order.collateralDelta.eq(collateralDelta.value.bn);

  const areValuesSame =
    order.triggerPrice.eq(triggerPrice.value.bn) &&
    order.sizeDelta.eq(sizeDelta.value.bn) &&
    isCollateralSame;

  const buttonError = areValuesSame
    ? t.valuesUnchanged
    : decreaseTriggerOrderError;

  return (
    <Modal
      show={true}
      onClose={onClose}
      title={`${t.editOrder}: ${pairToDisplayString(
        order.pair,
      )} ${orderTypeToDisplay(
        t,
        triggerThresholdToOrderType(
          order.isLong,
          order.shouldTriggerAboveThreshold,
          isIncrease,
        ),
      )}`}
      classes="add-trigger-position-modal"
      showChooseWalletModal={showChooseWalletModal}
    >
      <div className="uk-margin">
        <InputNumber
          id="edit-trigger-order-limit-price"
          value={triggerPrice.value}
          onChange={triggerPrice.onChange}
          decimals={PRICE_DECIMALS}
          label="trigger price"
          wrapperClassName="uk-margin"
          placeholder={t.enterTheTriggerPrice}
          disabled={sendingTransaction}
          rightComponent={
            <ResetButton
              reset={resetTriggerPrice}
              previous={order.triggerPrice}
              current={triggerPrice.value.bn}
            />
          }
        />
        <InputNumber
          id="edit-trigger-order-size-delta"
          value={sizeDelta.value}
          onChange={sizeDelta.onChange}
          decimals={PRICE_DECIMALS}
          label="size"
          wrapperClassName="uk-margin"
          placeholder={t.enterOrderSize}
          disabled={sendingTransaction}
          rightComponent={
            <ResetButton
              reset={resetSizeDelta}
              previous={order.sizeDelta}
              current={sizeDelta.value.bn}
            />
          }
        />
        {!isIncrease && (
          <InputNumber
            id="edit-trigger-order-collateral-delta"
            value={collateralDelta.value}
            onChange={collateralDelta.onChange}
            decimals={PRICE_DECIMALS}
            label={t.collateral}
            wrapperClassName="uk-margin"
            placeholder="enter order collateral"
            disabled={sendingTransaction}
            rightComponent={
              <ResetButton
                reset={resetCollateralDelta}
                previous={order.collateralDelta}
                current={collateralDelta.value.bn}
              />
            }
          />
        )}
      </div>
      <div className="uk-margin">
        <div className="uk-flex uk-flex-between">
          <div>{t.side}</div>
          <div>{order.isLong ? t.buy : t.sell}</div>
        </div>
        <div className="uk-flex uk-flex-between">
          <div>{t.orderType}</div>
          <div>
            {orderTypeToDisplay(
              t,
              triggerThresholdToOrderType(
                order.isLong,
                order.shouldTriggerAboveThreshold,
                isIncrease,
              ),
            )}
          </div>
        </div>
        <div className="uk-flex uk-flex-between">
          <div>{t.triggerPrice}</div>
          <div>
            {oldToNew(
              formatPrice(order.triggerPrice, USD_DISPLAY_DECIMALS),
              formatPrice(triggerPrice.value.bn, USD_DISPLAY_DECIMALS),
            )}{" "}
            USD
          </div>
        </div>
        <div className="uk-flex uk-flex-between">
          <div>{isIncrease ? t.sizeIncrease : t.sizeDecrease}</div>
          <div>
            {oldToNew(
              formatPrice(order.sizeDelta, USD_DISPLAY_DECIMALS),
              formatPrice(sizeDelta.value.bn, USD_DISPLAY_DECIMALS),
            )}{" "}
            USD
          </div>
        </div>
        {!isIncrease && (
          <div className="uk-flex uk-flex-between">
            <div>
              {isIncrease ? t.collateralIncrease : t.collateralDecrease}
            </div>
            <div>
              {oldToNew(
                formatPrice(order.collateralDelta, USD_DISPLAY_DECIMALS),
                formatPrice(collateralDelta.value.bn, USD_DISPLAY_DECIMALS),
              )}{" "}
              USD
            </div>
          </div>
        )}
      </div>
      <div>
        <ButtonSmart
          onClick={onSubmit}
          disabled={!!buttonError}
          expand
          network={DEFAULT_HLP_NETWORK}
          loading={sendingTransaction}
        >
          {buttonError || t.submitOrderEdit}
        </ButtonSmart>
      </div>
    </Modal>
  );
};

type ResetButtonProps = {
  reset: () => void;
  previous: BigNumber;
  current: BigNumber;
};

const ResetButton = ({ reset, previous, current }: ResetButtonProps) => {
  const { t } = useLanguageStore();
  return (
    <Button
      className="hfi-input-button uk-margin-small-left"
      onClick={reset}
      disabled={previous.eq(current)}
    >
      {t.reset}
    </Button>
  );
};
