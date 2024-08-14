import classNames from "classnames";
import { useTradeDetails } from "../../hooks/useTradeDetails";
import PairDisplay from "@handle-fi/react-components/dist/components/PairDisplay/PairDisplay";
import { useToken } from "../../context/TokenManager";
import { Link } from "@handle-fi/react-components/dist/components/handle_uikit/components/Link";
import classes from "./MobileTradeElement.module.scss";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import { AMOUNT_DECIMALS, TradeAction } from "handle-sdk/dist/components/trade";
import React from "react";
import { bnToDisplayString } from "../../utils/format";
import { LOT_SIZE_MAX_DECIMALS, USD_DISPLAY_DECIMALS } from "../../utils/trade";
import { useInstrumentOrThrow } from "../../hooks/trade/useInstrumentOrThrow";
import { pairToString } from "handle-sdk/dist/utils/general";

type Props = {
  trade: TradeAction;
};

const MobileTradeElement = ({ trade }: Props) => {
  const [showSizeInUsd, setShowSizeInUsd] = React.useState(true);
  const tradeAction = useTradeDetails(trade, showSizeInUsd);
  const isUsdBase = tradeAction.pair?.baseSymbol === "USD";
  const isLong = trade.size.gt(0);
  const instrument = useInstrumentOrThrow(pairToString(tradeAction.pair));

  return (
    <div
      className={classNames(
        "uk-flex uk-flex-between uk-flex-middle",
        classes.tradeContainer,
        {
          [classes.reverse]: isUsdBase,
        },
      )}
    >
      <div className="uk-flex uk-flex-middle">
        {tradeAction.pair && (
          <PairDisplay
            pair={tradeAction.pair}
            noAssets
            size="1.5x"
            instrument={instrument}
          />
        )}

        <div className="uk-flex uk-flex-column uk-flex-center uk-flex-top">
          {tradeAction.pair && (
            <PairDisplay
              pair={tradeAction.pair}
              noIcons
              className={classes.pairAssetsOnly}
              slashStyle={{ marginBottom: 0 }}
              secondAssetStyle={{ marginBottom: 0 }}
              instrument={instrument}
            />
          )}
          <div
            className={classNames({
              "hfi-up": isLong,
              "hfi-down": !isLong,
            })}
          >
            <span className={classNames(classes.isLongLeverage)}>
              {tradeAction.isLongDisplay}
            </span>
          </div>
        </div>
      </div>

      <div className={classNames("uk-flex uk-flex-middle", classes.dataColumn)}>
        <div className="uk-flex uk-flex-column uk-flex-center uk-flex-top">
          <div
            className={classNames("uk-flex uk-flex-1 uk-flex-right", {
              "uk-width-expand": tradeAction.maxTablet,
            })}
          >
            <div className="uk-flex-1 uk-text-right">
              <div
                className={classNames("uk-flex uk-flex-bottom uk-flex-right", {
                  "hfi-down": tradeAction.isLiquidation,
                })}
              >
                <div
                  className={classes.switchButton}
                  onClick={e => setShowSizeInUsd(!showSizeInUsd)}
                  onKeyDown={e => setShowSizeInUsd(!showSizeInUsd)}
                >
                  <FontAwesomeIcon icon={["fal", "exchange"]} />
                </div>
                {bnToDisplayString(
                  tradeAction.displayAmount,
                  AMOUNT_DECIMALS,
                  USD_DISPLAY_DECIMALS,
                  showSizeInUsd ? USD_DISPLAY_DECIMALS : LOT_SIZE_MAX_DECIMALS,
                )}
                <span className={classes.sizeUnit}>
                  {showSizeInUsd ? "USD" : "lots"}
                </span>
              </div>
            </div>
          </div>

          <div
            className={classNames("uk-flex uk-flex-1 uk-flex-right", {
              "uk-width-expand": tradeAction.maxTablet,
            })}
          >
            <div className="uk-flex-1 uk-text-right">
              <div
                className={classNames("uk-display-block", {
                  "hfi-up":
                    tradeAction.isPositive && !tradeAction.isLiquidation,
                  "hfi-down":
                    tradeAction.isNegative || tradeAction.isLiquidation,
                })}
              >
                <span className="uk-flex uk-flex-right uk-flex-bottom">
                  {tradeAction.isLiquidation && (
                    <span
                      className={classNames(
                        "uk-margin-small-right",
                        classes.smaller,
                      )}
                    >
                      {"liq. at "}
                    </span>
                  )}
                  {tradeAction.priceToDisplay}
                </span>
              </div>
            </div>
          </div>

          <div
            className={classNames(
              "uk-flex uk-flex-1 uk-width-expand uk-flex-right",
              classes.dateTime,
            )}
          >
            {new Date(tradeAction.timestamp * 1000).toLocaleString("en-AU", {
              hour12: false,
            })}
          </div>
        </div>

        {tradeAction.explorerMetadata && (
          <Link
            href={tradeAction.explorerMetadata?.url}
            target="_blank"
            className={classNames("uk-margin-left", classes.tradeLink)}
          >
            <FontAwesomeIcon icon={["fal", "external-link-square"]} />
          </Link>
        )}
      </div>
    </div>
  );
};

export default MobileTradeElement;
