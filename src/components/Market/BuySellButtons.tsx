import React from "react";
import classNames from "classnames";
import { useUiStore } from "../../context/UserInterface";
import { useTradeModal } from "../../hooks/useTradeModal";
import { TradePair } from "handle-sdk/dist/components/trade";
import classes from "./Market.module.scss";
import FlashingNumber from "../FlashingNumber/FlashingNumber";
import PriceDisplayExtended from "../PriceDisplayExtended/PriceDisplayExtended";
import Loader from "@handle-fi/react-components/dist/components/Loader";
import { getThemeFile } from "../../utils/ui";
import TradeModal from "../TradeFormModal/TradeFormModal";
import { removeWholeNumberSeparatorsFromNumberString } from "../../utils/format";
import { MouseOrKeyboardEvent } from "../../types/mouseAndKeyboard";

type Props = {
  isMarketClosed: boolean;
  tradePair: TradePair;
  isMarketDataLoaded: boolean;
  buyPriceDisplay: string;
  sellPriceDisplay: string;
};

export const BuySellButtons = (props: Props) => {
  const {
    isMarketClosed,
    tradePair,
    isMarketDataLoaded,
    buyPriceDisplay,
    sellPriceDisplay,
  } = props;
  const { isMobile, activeTheme } = useUiStore();
  const {
    openTrade,
    showTrade,
    setShowTrade,
    isLong,
    setIsLong,
    buyTooltip,
    sellTooltip,
  } = useTradeModal(tradePair);
  const openTradeInternal = (
    e: MouseOrKeyboardEvent<HTMLDivElement>,
    isLong: boolean,
  ) => {
    if (
      e.type === "keydown" &&
      !(
        (e as React.KeyboardEvent).key === "Enter" ||
        (e as React.KeyboardEvent).key === " "
      )
    )
      return;
    e.stopPropagation();
    setIsLong(isLong);
    openTrade(isLong);
  };
  return (
    <>
      <div
        className={classNames(
          "uk-flex uk-flex-1 uk-flex-middle uk-height-1-1 cursor-pointer buy-sell-button",
          {
            "disabled-opacity": isMarketClosed,
          },
        )}
        tabIndex={0}
        onClick={e => openTradeInternal(e, false)}
        onKeyDown={e => openTradeInternal(e, false)}
        uk-tooltip={isMobile || showTrade ? undefined : sellTooltip}
      >
        <FlashingNumber
          className={classNames(
            "uk-flex uk-flex-middle uk-height-1-1 uk-width-expand uk-flex-right margin-left-unset",
            classes.sellPrice,
          )}
          disabled={isMarketClosed}
          value={
            sellPriceDisplay
              ? +removeWholeNumberSeparatorsFromNumberString(sellPriceDisplay)
              : undefined
          }
        >
          {isMarketDataLoaded ? (
            <PriceDisplayExtended
              price={sellPriceDisplay}
              isViewOnly={false}
              className={classes.smaller}
            />
          ) : (
            <Loader color={getThemeFile(activeTheme).primaryColor} />
          )}
        </FlashingNumber>
      </div>

      <div
        className={classNames(
          "uk-flex uk-flex-1 uk-flex-middle uk-height-1-1 cursor-pointer buy-sell-button",
          {
            "disabled-opacity": isMarketClosed,
          },
        )}
        tabIndex={0}
        onClick={e => openTradeInternal(e, true)}
        onKeyDown={e => openTradeInternal(e, true)}
        uk-tooltip={isMobile || showTrade ? undefined : buyTooltip}
      >
        <FlashingNumber
          className={classNames(
            "uk-flex uk-flex-middle uk-height-1-1 uk-width-expand uk-flex-right margin-left-unset",
            classes.buyPrice,
          )}
          disabled={isMarketClosed}
          value={
            buyPriceDisplay
              ? +removeWholeNumberSeparatorsFromNumberString(buyPriceDisplay)
              : undefined
          }
        >
          {isMarketDataLoaded ? (
            <PriceDisplayExtended
              price={buyPriceDisplay}
              isViewOnly={false}
              className={classes.smaller}
            />
          ) : (
            <Loader color={getThemeFile(activeTheme).primaryColor} />
          )}
        </FlashingNumber>
      </div>

      {!isMobile && showTrade && props.tradePair && (
        <TradeModal
          pair={props.tradePair}
          isLong={isLong}
          onClose={() => setShowTrade(false)}
        />
      )}
    </>
  );
};
