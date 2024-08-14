import classNames from "classnames";
import Button from "../Button";
import { TradePair } from "handle-sdk/dist/components/trade";
import { useTradeModal } from "../../hooks/useTradeModal";
import classes from "./TradeChartHeader.module.scss";
import { useChartHeaderData } from "../../hooks/useChartHeaderData";
import {
  activateDragCapability,
  deactivateDragCapability,
} from "../../utils/ui";
import { createRef, useEffect } from "react";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import { getDragHandleClass } from "../../utils/general";
import { TRADE_CHART_WIDTH_THRESHOLD_FOR_CHART_LEGEND_WRAP } from "../../config/trade";
import { useUiStore } from "../../context/UserInterface";
import TradeModal from "../TradeFormModal/TradeFormModal";
import {
  adjustWidgetPosition,
  resetWidgetPosition,
} from "../../utils/trade/tv-chart/adjustWidgetPosition";

type Props = {
  tradePair: TradePair;
  chartId: string;
  headerWidth: number;
  show: boolean;
  iframeDrawingToolbarIsOpen: boolean;
};

export const TradeChartBuySellWidget = ({
  tradePair,
  headerWidth,
  chartId,
  show,
  iframeDrawingToolbarIsOpen,
}: Props) => {
  const marketData = useChartHeaderData(tradePair);
  const { isMobile } = useUiStore();
  const {
    buyTooltip,
    sellTooltip,
    openTrade,
    setIsLong,
    showTrade,
    setShowTrade,
    isLong,
  } = useTradeModal(tradePair);
  const openTradeInternal = (isLong: boolean) => {
    setIsLong(isLong);
    openTrade(isLong);
  };
  const buySellButtonsRef = createRef<HTMLDivElement>();
  const draghandleClass = getDragHandleClass(chartId);
  useEffect(() => {
    if (buySellButtonsRef.current) {
      activateDragCapability(
        buySellButtonsRef.current,
        draghandleClass,
        chartId,
        headerWidth,
        +classes.buySellWidgetPadding,
      );
    }
    return () => deactivateDragCapability(draghandleClass);
  }, [buySellButtonsRef]);
  const shouldShowBuySellButtonsLower =
    headerWidth < TRADE_CHART_WIDTH_THRESHOLD_FOR_CHART_LEGEND_WRAP;

  useEffect(() => {
    adjustWidgetPosition(chartId, headerWidth, iframeDrawingToolbarIsOpen);
  }, [iframeDrawingToolbarIsOpen]);

  return (
    <>
      <div
        ref={buySellButtonsRef}
        className={classNames(classes.buySellButtonGroup, {
          [classes.headerWrap]: shouldShowBuySellButtonsLower,
          "uk-hidden": !show,
        })}
      >
        <div
          className={classNames(draghandleClass, classes.drag)}
          onDoubleClick={() => resetWidgetPosition(chartId)}
          role="button"
          tabIndex={0}
        >
          <FontAwesomeIcon icon={["far", "grip-dots"]} />
        </div>
        <div
          className={classNames("hfi-button-collection uk-flex uk-flex-middle")}
        >
          <Button
            size="small"
            type="secondary"
            color="down"
            className={classNames(classes.button)}
            onClick={() => openTradeInternal(false)}
            presetTooltip={sellTooltip}
          >
            {marketData.bidPriceDisplay}
          </Button>
          <Button
            size="small"
            type="secondary"
            color="up"
            className={classNames(classes.button)}
            onClick={() => openTradeInternal(true)}
            presetTooltip={buyTooltip}
          >
            {marketData.askPriceDisplay}
          </Button>
        </div>
      </div>

      {!isMobile && showTrade && (
        <TradeModal
          pair={tradePair}
          isLong={isLong}
          onClose={() => setShowTrade(false)}
        />
      )}
    </>
  );
};
