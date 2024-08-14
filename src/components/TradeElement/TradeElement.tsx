import classNames from "classnames";
import { Pair } from "handle-sdk/dist/types/trade";
import React from "react";
import { useLanguageStore } from "../../context/Translation";
import { Link } from "@handle-fi/react-components/dist/components/handle_uikit/components/Link";
import PairDisplay from "@handle-fi/react-components/dist/components/PairDisplay/PairDisplay";
import classes from "./TradeElement.module.scss";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import { AMOUNT_DECIMALS, TradeAction } from "handle-sdk/dist/components/trade";
import { TRADES_THRESHOLD_FOR_STACKED_TABLE } from "../../config/trade";
import { useTradeDetails } from "../../hooks/useTradeDetails";
import { getUkTooltip } from "../../utils/general";
import { bnToDisplayString } from "../../utils/format";
import { LOT_SIZE_MAX_DECIMALS, USD_DISPLAY_DECIMALS } from "../../utils/trade";
import { useInstrumentOrThrow } from "../../hooks/trade/useInstrumentOrThrow";
import { pairToString } from "handle-sdk/dist/utils/general";

type Props = {
  trade: TradeAction;
  firstColumnWidth: number;
  pair: Pair;
  width: number;
  showSizeInUsd: boolean;
  setShowSizeInUsd: (showSizeInUsd: boolean) => void;
  index: number;
  isDashboard?: boolean;
};

const TradeElement = React.memo(
  ({
    trade,
    firstColumnWidth,
    pair,
    width,
    showSizeInUsd,
    setShowSizeInUsd,
    index,
    isDashboard,
  }: Props) => {
    const { t } = useLanguageStore();
    const tradeDetails = useTradeDetails(trade, showSizeInUsd);
    const instrument = useInstrumentOrThrow(pairToString(pair));
    const isStacked = width < TRADES_THRESHOLD_FOR_STACKED_TABLE;
    const rowClass =
      index % 2 === 0 && isDashboard ? classes.tradeElementOdd : "";

    return (
      <div
        className={classNames(
          "uk-flex uk-flex-between uk-flex-middle",
          classes.tradeWrapper,
          rowClass,
          {
            "uk-flex-column uk-flex-between": isStacked,
            [classes.tradeWrapperStacked]: isStacked,
          },
        )}
      >
        <div
          className={classNames("uk-flex uk-flex-between", {
            "uk-width-expand": isStacked,
          })}
          style={
            isStacked
              ? {
                  borderBottom: "var(--app-border-thin-xx-light-primary-color)",
                  paddingBottom: "4px",
                  marginBottom: "4px",
                }
              : { width: `${firstColumnWidth}px` }
          }
        >
          {isStacked && (
            <div className="uk-text-left">
              <div>
                {t.market}/{t.side}
              </div>
            </div>
          )}

          <div className="uk-flex uk-flex-between uk-flex-middle">
            <div>
              {tradeDetails.explorerMetadata && (
                <Link
                  tooltip={{
                    text: t.viewTxOnBlockExplorer,
                    position: "right",
                  }}
                  href={tradeDetails.explorerMetadata?.url}
                  target="_blank"
                  className="uk-margin-xsmall-right"
                >
                  <FontAwesomeIcon icon={["fal", "external-link-square"]} />
                </Link>
              )}
            </div>

            {pair && (
              <div>
                <PairDisplay
                  pair={pair}
                  className="uk-margin-small-right"
                  firstAssetStyle={{ marginBottom: -1 }}
                  slashStyle={{ marginBottom: -1 }}
                  assetsFontSize={14}
                  secondAssetStyle={{ marginBottom: -1.5 }}
                  instrument={instrument}
                />
              </div>
            )}

            <div
              className={classNames({
                "uk-text-right": isStacked,
              })}
            >
              <div
                className={classNames("uk-flex", {
                  "uk-flex-column": isStacked,
                })}
              >
                <span
                  className={classNames({
                    "uk-margin-small-right": !isStacked,
                    "hfi-up": tradeDetails.isLong,
                    "hfi-down": !tradeDetails.isLong,
                  })}
                >
                  {tradeDetails.isLongDisplay}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div
          className={classNames("uk-flex uk-flex-1 uk-flex-right", {
            "uk-width-expand": isStacked,
          })}
        >
          {isStacked && (
            <div className="uk-text-left">
              <div className="uk-flex">
                {t.size}
                {" ("}
                {showSizeInUsd ? "USD" : "lots"}
                {")"}
                <div
                  className={classes.switchButton}
                  onClick={e => setShowSizeInUsd(!showSizeInUsd)}
                  onKeyDown={e => setShowSizeInUsd(!showSizeInUsd)}
                  uk-tooltip={`title: show trade sizes in ${
                    showSizeInUsd ? "lots" : "USD"
                  }; pos: bottom;`}
                >
                  <FontAwesomeIcon icon={["fal", "exchange"]} />
                </div>
              </div>
            </div>
          )}

          <div className="uk-flex uk-flex-1 uk-text-right uk-flex-right">
            <div
              className={classNames(
                "uk-display-flex uk-flex-right uk-tooltip-content",
                {
                  "hfi-down": tradeDetails.isLiquidation,
                },
              )}
            >
              {bnToDisplayString(
                tradeDetails.displayAmount,
                AMOUNT_DECIMALS,
                USD_DISPLAY_DECIMALS,
                showSizeInUsd ? USD_DISPLAY_DECIMALS : LOT_SIZE_MAX_DECIMALS,
              )}
            </div>
          </div>
        </div>

        <div
          className={classNames("uk-flex uk-flex-1 uk-flex-right", {
            "uk-width-expand": isStacked,
          })}
        >
          {isStacked && (
            <div className="uk-text-left">
              <div>{t.price}</div>
            </div>
          )}

          <div className="uk-flex-1 uk-text-right">
            <div
              className={classNames(
                "uk-display-flex uk-flex-right uk-tooltip-content",
                {
                  "hfi-down": tradeDetails.isLiquidation,
                },
              )}
            >
              <span
                className={classNames({
                  "hfi-down": tradeDetails.isLiquidation,
                })}
                uk-tooltip={
                  tradeDetails.isLiquidation
                    ? getUkTooltip({
                        title: `liquidated at ${tradeDetails.priceToDisplay}`,
                        position: "right",
                        classes: "hfi-down",
                      })
                    : undefined
                }
              >
                <span
                  className={classNames({
                    "uk-tooltip-content": tradeDetails.isLiquidation,
                  })}
                >
                  {tradeDetails.priceToDisplay}
                </span>
              </span>
            </div>
          </div>
        </div>

        <div
          className={classNames("uk-flex uk-flex-1 uk-flex-right", {
            "uk-width-expand": isStacked,
          })}
        >
          {isStacked && (
            <div className="uk-text-left">
              <div>
                {t.date}/{t.time}
              </div>
            </div>
          )}

          <div className="uk-flex-1 uk-text-right">
            <div>
              {new Date(tradeDetails.timestamp * 1000).toLocaleString(
                undefined,
                {
                  hour12: false,
                },
              )}
            </div>
          </div>
        </div>
      </div>
    );
  },
);

export default TradeElement;
