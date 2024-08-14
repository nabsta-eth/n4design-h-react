import classNames from "classnames";
import { uniqueId } from "../../utils/general";
import Button from "../Button";
import PairDisplay from "@handle-fi/react-components/dist/components/PairDisplay/PairDisplay";
import FlashingNumber from "../FlashingNumber/FlashingNumber";
import { PositionActionType } from "../Positions/Positions";
import {
  pairToDisplayString,
  pairToLowercaseHyphenatedDisplayString,
} from "../../utils/trade/toDisplayPair";
import { useLanguageStore } from "../../context/Translation";
import { TranslationKey } from "../../types/translation";
import classes from "./PositionElement.module.scss";
import * as React from "react";
import {
  POSITIONS_THRESHOLD_FOR_MARK_PRICE,
  POSITIONS_THRESHOLD_FOR_STACKED_TABLE,
} from "../../config/trade";
import {
  getFundingBreakdownTooltip,
  getPositionButtonTooltipText,
} from "../../config/tooltips/trade";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import { useUiStore } from "../../context/UserInterface";
import PriceDisplayExtended from "../PriceDisplayExtended/PriceDisplayExtended";
import "/src/assets/styles/animations.scss";
import { isKeyPressedEnterOrSpace } from "../../utils/ui";
import { useTrade } from "../../context/Trade";
import { usePosition } from "../../hooks/usePosition";
import { catchPriceError } from "../../utils/priceError";
import { bnToDisplayString } from "../../utils/format";
import { trade } from "handle-sdk";
import { useTradePrices } from "../../context/TradePrices";
import { Position } from "handle-sdk/dist/components/trade/position";
import { MouseOrKeyboardEvent } from "../../types/mouseAndKeyboard";
import { LOT_SIZE_MAX_DECIMALS, USD_DISPLAY_DECIMALS } from "../../utils/trade";
import { TradePairOrViewOnlyInstrument } from "../../types/trade";
import { useUserWalletStore } from "@handle-fi/react-components/dist/context/UserWallet";
import { useInstrumentOrThrow } from "../../hooks/trade/useInstrumentOrThrow";
import { pairToString } from "handle-sdk/dist/utils/general";
import { constants } from "ethers";

type Props = {
  position: Position;
  openModal: (type: PositionActionType, position: Position) => void;
  firstColumnWidth: number;
  isDashboard?: boolean;
  onClickMarket?: (pair: TradePairOrViewOnlyInstrument) => void;
  showSizeInUsd: boolean;
  width: number;
  index: number;
};

const PositionElement = ({
  position,
  openModal,
  firstColumnWidth,
  isDashboard,
  onClickMarket,
  showSizeInUsd,
  width,
  index,
}: Props) => {
  const { isDev } = useUserWalletStore();
  const { setSelectedPair, protocol } = useTrade();
  // Trigger re-render of position whenever prices change.
  useTradePrices();
  const { isMobile, isModernTheme } = useUiStore();
  const { t } = useLanguageStore();
  const instrument = useInstrumentOrThrow(pairToString(position.pairId.pair));
  const tradePair = protocol.getTradePair(position.pairId);
  const {
    sizeInUsdDisplay,
    entryPriceDisplay,
    markPrice,
    initialMarginDisplay,
    pnlDisplay,
    pnlPercent,
    pnlPercentDisplay,
    totalPositionFees,
    totalPositionFeesDisplay,
    accruedBorrowFee,
    accruedFundingFee,
    pairState,
    marketPrice,
  } = catchPriceError(() => usePosition(position));
  const priceDecimals = instrument.getDisplayDecimals(
    markPrice ?? constants.Zero,
  );

  const sizeInLots = bnToDisplayString(
    position.size,
    trade.AMOUNT_DECIMALS,
    USD_DISPLAY_DECIMALS,
    LOT_SIZE_MAX_DECIMALS,
  );
  const liquidityPool = protocol.getLiquidityPool(position.pairId.lpId);
  const marketClosed = !liquidityPool.getPairAvailability({
    pair: position.pairId.pair,
  }).isAvailable;
  const isLongDisplay = position.isLong ? t.long : t.short;
  const isStacked = width < POSITIONS_THRESHOLD_FOR_STACKED_TABLE;

  const canSelectMarket = !isDashboard;
  const tooltipPosition = isStacked ? "bottom" : "right";
  const marketTooltip =
    canSelectMarket && !isMobile
      ? `title: ${t.selectMarket} ${pairToDisplayString(
          position.pairId.pair,
        )}; pos: ${tooltipPosition};`
      : undefined;

  const onClickPosition = (e: MouseOrKeyboardEvent<HTMLDivElement>) => {
    if (
      e.type === "keydown" &&
      !isKeyPressedEnterOrSpace(e as React.KeyboardEvent)
    )
      return;
    setSelectedPair(position.pairId.pair);
    if (onClickMarket) onClickMarket(tradePair);
  };

  const displayDecimalsExtended = instrument.getDisplayDecimals(
    markPrice ?? constants.Zero,
    true,
  );

  const id = React.useMemo(() => uniqueId(5), []);
  const rowClass =
    index % 2 === 0 && isDashboard ? classes.positionElementOdd : "";

  return (
    <div
      className={classNames(
        "uk-flex-between uk-flex-middle ",
        classes.positionWrapper,
        rowClass,
        pairToLowercaseHyphenatedDisplayString(position.pairId.pair),
        {
          [classes.positionWrapperNoBorder]: isModernTheme && isDashboard,
          "uk-flex uk-flex-column uk-flex-between": isStacked,
          [classes.positionWrapperStacked]: isStacked,
          [classes.positionWrapperSmall]:
            !isStacked && width < POSITIONS_THRESHOLD_FOR_MARK_PRICE,
        },
      )}
    >
      <div
        className={classNames(
          "uk-flex uk-flex-between uk-height-1-1 uk-flex-middle",
          {
            "uk-width-expand": true,
            "cursor-pointer": canSelectMarket,
          },
        )}
        uk-tooltip={marketTooltip}
        tabIndex={canSelectMarket ? 0 : -1}
        onClick={canSelectMarket ? onClickPosition : undefined}
        onKeyDown={canSelectMarket ? onClickPosition : undefined}
        style={
          isStacked
            ? {
                borderBottom: "var(--app-border-thin-xx-light-primary-color)",
                paddingBottom: "4px",
                marginBottom: "4px",
              }
            : { minWidth: `${firstColumnWidth}px` }
        }
      >
        {isStacked && (
          <div className="uk-text-left">
            <div>{t.market}</div>
            <div>{t.side}</div>
          </div>
        )}

        <div className="uk-flex uk-flex-center uk-flex-middle">
          <div
            className={classNames("uk-flex uk-flex-center", {
              "disabled-opacity": marketClosed,
            })}
          >
            <PairDisplay
              pair={position.pairId.pair}
              isPosition={true}
              noAssets
              size="1.5x"
              className={classNames(classes.pairIcons)}
              instrument={instrument}
            />
            <div className="uk-flex uk-flex-column uk-flex-center">
              <div className="uk-flex">
                <PairDisplay
                  pair={position.pairId.pair}
                  isPosition={true}
                  noIcons
                  assetsFontSize={14}
                  instrument={instrument}
                />
              </div>

              <div
                className={classNames(classes.side, {
                  "uk-flex uk-text-right": isStacked,
                })}
              >
                <div
                  className={classNames("uk-flex", {
                    //"uk-flex-right": !isStacked,
                    "uk-flex-column uk-flex-bottom": isStacked,
                  })}
                >
                  <span
                    className={classNames({
                      "hfi-up": position.isLong,
                      "hfi-down": !position.isLong,
                    })}
                  >
                    {isLongDisplay}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className={classNames(
          "uk-flex uk-flex-1 uk-flex-right uk-height-1-1 uk-flex-middle",
          {
            "uk-width-expand": isStacked,
            "cursor-pointer": canSelectMarket,
          },
        )}
        tabIndex={canSelectMarket ? 0 : -1}
        onClick={canSelectMarket ? onClickPosition : undefined}
        onKeyDown={canSelectMarket ? onClickPosition : undefined}
      >
        {isStacked && (
          <div className="uk-text-left">
            <div>{t.size}</div>
            <div
              className={classes.initMarginHeader}
              uk-tooltip={`title: ${t.initMarginTooltip}; pos: right;`}
            >
              <span className="uk-tooltip-content">{t.initialMargin}</span>
            </div>
          </div>
        )}

        <div
          className={classNames("uk-flex-1 uk-text-right", {
            "disabled-opacity": marketClosed,
          })}
        >
          <div>{showSizeInUsd ? sizeInUsdDisplay : sizeInLots}</div>
          <div className={classes.initMargin}>{initialMarginDisplay}</div>
        </div>
      </div>

      <div
        className={classNames(
          "uk-flex uk-flex-1 uk-flex-right uk-height-1-1 uk-flex-middle",
          {
            "uk-width-expand": isStacked,
            "cursor-pointer": canSelectMarket,
          },
        )}
        tabIndex={canSelectMarket ? 0 : -1}
        onClick={canSelectMarket ? onClickPosition : undefined}
        onKeyDown={canSelectMarket ? onClickPosition : undefined}
      >
        {isStacked && (
          <div className="uk-text-left">
            <div uk-tooltip={`title: ${t.entryPriceTooltip}; pos: right;`}>
              <span className="uk-tooltip-content">{t.entryPrice}</span>
            </div>
          </div>
        )}

        <div
          className={classNames("uk-flex-1 uk-text-right", {
            [classes.entryPrice]: !isStacked,
            "disabled-opacity": marketClosed,
          })}
        >
          <div>
            {priceDecimals === 2 ? "  " : ""}
            {entryPriceDisplay}
          </div>
        </div>
      </div>

      {(isStacked || width >= POSITIONS_THRESHOLD_FOR_MARK_PRICE) && (
        <div
          className={classNames(
            "uk-flex uk-flex-1 uk-flex-right uk-height-1-1",
            {
              "uk-width-expand": isStacked,
              "cursor-pointer": canSelectMarket,
            },
          )}
          tabIndex={canSelectMarket ? 0 : -1}
          onClick={canSelectMarket ? onClickPosition : undefined}
          onKeyDown={canSelectMarket ? onClickPosition : undefined}
        >
          {isStacked && (
            <div
              className={classNames("uk-text-left", classes.markPriceHeader)}
              uk-tooltip={`title: ${t.markPriceTooltip}; pos: right;`}
            >
              <span className="uk-tooltip-content">{t.markPrice}</span>
            </div>
          )}

          <div
            className={classNames(
              "uk-flex uk-flex-column uk-flex-bottom uk-flex-1 uk-text-right uk-height-1-1",
              {
                "disabled-opacity": marketClosed,
              },
            )}
          >
            <FlashingNumber
              className={classNames(
                "uk-width-expand uk-flex uk-flex-middle uk-flex-right",
                classes.flashing,
                {
                  [classes.stacked]: isStacked,
                },
              )}
              value={+(markPrice?.toString() ?? "0")}
              disabled={marketClosed}
            >
              {!marketClosed && markPrice ? (
                <PriceDisplayExtended
                  price={bnToDisplayString(
                    markPrice,
                    trade.PRICE_DECIMALS,
                    displayDecimalsExtended,
                  )}
                />
              ) : (
                t.closed
              )}
            </FlashingNumber>
          </div>
        </div>
      )}

      <div
        className={classNames("uk-flex uk-flex-1 uk-flex-right uk-height-1-1", {
          "uk-width-expand": isStacked,
        })}
      >
        {isStacked && (
          <div
            className="uk-text-left"
            uk-tooltip={`title: ${t.fundingTooltip}; pos: right;`}
          >
            <span className="uk-tooltip-content">{t.funding}</span>
          </div>
        )}

        <div
          className={classNames(
            "uk-flex uk-flex-middle uk-flex-right uk-flex-1 uk-text-right uk-height-1-1",
            {
              "hfi-down": totalPositionFees?.gt(0),
              "hfi-up": totalPositionFees?.lt(0),
            },
          )}
        >
          {!isDev && <div>{totalPositionFeesDisplay}</div>}
          {isDev && (
            <div
              uk-tooltip={getFundingBreakdownTooltip(
                accruedFundingFee,
                accruedBorrowFee,
                pairState,
                marketPrice?.index,
              )}
            >
              {totalPositionFeesDisplay}
            </div>
          )}
        </div>
      </div>

      <div
        className={classNames("uk-flex uk-flex-1 uk-flex-right uk-height-1-1", {
          "uk-width-expand": isStacked,
          "cursor-pointer": canSelectMarket,
        })}
        tabIndex={canSelectMarket ? 0 : -1}
        onClick={canSelectMarket ? onClickPosition : undefined}
        onKeyDown={canSelectMarket ? onClickPosition : undefined}
      >
        {isStacked && (
          <div
            className="uk-text-left"
            uk-tooltip={`title: ${t.pnlTooltip}; pos: right;`}
          >
            <span>{t.profitAndLoss}</span>
            <div
              className={classNames(classes.stacked, classes.returnPercentage)}
            >
              <span className="uk-tooltip-content">{t.return}</span>
            </div>
          </div>
        )}

        <div
          className={classNames(
            "uk-flex uk-flex-column uk-flex-bottom uk-flex-1 uk-text-right uk-height-1-1",
            {
              "hfi-up": pnlPercent?.gt("0") && !marketClosed,
              "hfi-down": pnlPercent?.lte("0") && !marketClosed,
              "disabled-opacity": marketClosed,
              [classes.stacked]: isStacked,
            },
          )}
        >
          <FlashingNumber
            className={classNames(
              classes.return,
              "uk-width-expand uk-flex uk-flex-middle uk-flex-right",
              classes.flashing,
              {
                [classes.stacked]: isStacked,
              },
            )}
            value={+(pnlDisplay || 0)}
            disabled={marketClosed}
          >
            {pnlPercent?.gt("0") ? "+" : ""}
            {pnlDisplay}
          </FlashingNumber>

          {!marketClosed && (
            <FlashingNumber
              className={classNames(
                "uk-width-expand uk-flex uk-flex-middle uk-flex-right",
                classes.flashing,
                {
                  [classes.stacked]: isStacked,
                },
              )}
              value={+(pnlPercentDisplay || 0)}
              disabled={marketClosed}
            >
              {!marketClosed && (
                <span className={classNames(classes.returnPercentage)}>{`${
                  pnlPercent?.gt("0") ? "+" : ""
                }${pnlPercentDisplay}%`}</span>
              )}
            </FlashingNumber>
          )}
        </div>
      </div>

      <div
        className={classNames("uk-flex uk-flex-1 uk-flex-middle", {
          "uk-flex-right": !isStacked,
          "uk-width-expand uk-flex-left uk-margin-xsmall-top": isStacked,
        })}
        style={{
          borderTop: isStacked
            ? "var(--app-border-thin-xx-light-primary-color)"
            : undefined,
        }}
      >
        <div
          className={classNames("hfi-button-collection", {
            "uk-margin-small-top uk-margin-xsmall-bottom": isStacked,
          })}
        >
          <PositionButton
            id={`${pairToLowercaseHyphenatedDisplayString(
              position.pairId.pair,
            )}-share-button-${id}`}
            openModal={type => openModal(type, position)}
            action="share"
            t={t}
            marketClosed={marketClosed}
          >
            <FontAwesomeIcon icon={["fal", "share-nodes"]} />
          </PositionButton>

          <PositionButton
            id={`${pairToLowercaseHyphenatedDisplayString(
              position.pairId.pair,
            )}-close-button-${id}`}
            openModal={type => openModal(type, position)}
            action="close"
            t={t}
            marketClosed={marketClosed}
            className="hfi-error-button"
          >
            <FontAwesomeIcon icon={["fal", "times"]} />
          </PositionButton>
        </div>
      </div>
    </div>
  );
};

type PositionButtonProps = {
  id: string;
  openModal: (action: PositionActionType) => void;
  action: PositionActionType;
  children?: React.ReactNode;
  t: Record<TranslationKey, string>;
  marketClosed: boolean;
  style?: React.CSSProperties;
  className?: string;
};

const PositionButton = (props: PositionButtonProps) => {
  const { id, openModal, action, children, className, t, marketClosed } = props;
  const tooltipText = getPositionButtonTooltipText(t, action, marketClosed);
  const tooltip = tooltipText
    ? {
        text: tooltipText,
        position: "left" as const,
      }
    : undefined;
  return (
    <Button
      id={id}
      icon
      type="secondary"
      className={classNames("uk-margin-remove", className)}
      onClick={action && openModal ? () => openModal(action) : undefined}
      tooltip={tooltip}
      disabled={marketClosed || !action}
      style={props.style}
    >
      {children}
    </Button>
  );
};

type LiquidationProximityValues = {
  isCloseToLiquidation: boolean;
  liquidationProximityTooltip: string;
};

export default PositionElement;
