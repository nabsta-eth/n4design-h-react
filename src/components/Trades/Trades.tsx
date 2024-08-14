import classNames from "classnames";
import React from "react";
import { useLanguageStore } from "../../context/Translation";
import { useUiStore } from "../../context/UserInterface";
import {
  useConnectedAccount,
  useConnectedNetwork,
} from "@handle-fi/react-components/dist/context/UserWallet";
import { sortIcon } from "../../utils/sort";
import Button from "../Button";
import ColouredScrollbars from "../ColouredScrollbars";
import TransactionsPlaceholder from "../TransactionsPlaceholder/TransactionsPlaceholder";
import classes from "./Trades.module.scss";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import { useTradesFrameDimensions } from "../../hooks/useTradesFrameDimensions";
import {
  TRADES_DISPLAY_QUANTITY_INCREMENT,
  TRADES_THRESHOLD_FOR_STACKED_TABLE,
} from "../../config/trade";
import TradeElement from "../TradeElement/TradeElement";
import Loader from "@handle-fi/react-components/dist/components/Loader";
import { getThemeFile } from "../../utils/ui";
import { pairToString } from "handle-sdk/dist/utils/general";
import { useTrades } from "../../hooks/useTrades";

export const TRADES_FIRST_COLUMN_WIDTH = 160;

type Props = {
  show: boolean;
  isDashboard?: boolean;
};

const Trades = ({ show, isDashboard }: Props) => {
  const { t } = useLanguageStore();
  const {
    showChooseWalletModal,
    setShowChooseWalletModal,
    activeTheme,
    isModernTheme,
  } = useUiStore();
  const connectedAccount = useConnectedAccount();
  const connectedNetwork = useConnectedNetwork();
  const {
    displayQuantity,
    setDisplayQuantity,
    sortedTradeHistory,
    isLoading,
    showLoadMoreButton,
    showTradePlaceholder,
    sort,
    onChangeTradesSort,
    sortTooltip,
  } = useTrades();

  const [showSizeInUsd, setShowSizeInUsd] = React.useState(true);

  const { tradesRef, frameScrollHeight, frameWidth, tradeHeight } =
    useTradesFrameDimensions();
  const isStacked = frameWidth < TRADES_THRESHOLD_FOR_STACKED_TABLE;

  const desktopHeight = isDashboard ? "100vh - 600px" : "100% - 49px";
  const scrollHeight = `calc(${desktopHeight})`;
  const numberOfRowsToShow =
    sortedTradeHistory.length > 0 && sortedTradeHistory.length < displayQuantity
      ? sortedTradeHistory.length
      : displayQuantity;
  const actualHeight = showTradePlaceholder
    ? 60
    : +tradeHeight * numberOfRowsToShow;

  return (
    <div
      ref={tradesRef}
      className={classNames("uk-flex-1 uk-height-1-1", {
        "uk-margin-bottom": !isDashboard,
        [classes.dashboardWrapper]: isDashboard,
      })}
      hidden={!show}
    >
      {(isDashboard || !isStacked) && (
        <div
          className={classNames(
            "uk-flex uk-flex-between uk-flex-middle uk-border-bottom uk-position-sticky uk-width-expand",
            classes.tradesHeaderWrapper,
            {
              [classes.tradesHeaderNoBorder]:
                isModernTheme && isDashboard && !showTradePlaceholder,
            },
          )}
        >
          <div
            className="uk-text-left"
            style={{ width: `${TRADES_FIRST_COLUMN_WIDTH}px` }}
          >
            <div className="uk-flex">
              <div
                className={classNames("uk-display-block", {
                  "hfi-up": sort.by === "baseSymbol",
                })}
              >
                {t.market}
                <FontAwesomeIcon
                  onClick={() => onChangeTradesSort("baseSymbol")}
                  uk-tooltip={sortTooltip("baseSymbol")}
                  icon={["far", sortIcon(sort, "baseSymbol")]}
                  className="uk-margin-xsmall-left uk-margin-small-right"
                />
              </div>
              <div
                className={classNames("uk-display-block", {
                  "hfi-up": sort.by === "isLong",
                })}
              >
                {t.side}
                <FontAwesomeIcon
                  onClick={() => onChangeTradesSort("isLong")}
                  uk-tooltip={sortTooltip("isLong")}
                  icon={["far", sortIcon(sort, "isLong")]}
                  className="uk-margin-xsmall-left"
                />
              </div>
            </div>
          </div>

          <div className="uk-flex-1 uk-text-right">
            <div
              className={classNames(
                "uk-flex uk-flex-middle uk-flex-right",
                classes.sizeHeader,
              )}
            >
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

          <div className="uk-flex-1 uk-text-right">
            <div
              className={classNames("uk-display-block", {
                "hfi-up": sort.by === "price",
              })}
            >
              {t.price}
              <FontAwesomeIcon
                onClick={() => onChangeTradesSort("price")}
                uk-tooltip={sortTooltip("price")}
                icon={["far", sortIcon(sort, "price")]}
                className="uk-margin-xsmall-left"
              />
            </div>
          </div>

          <div className="uk-flex-1 uk-text-right">
            <div
              className={classNames("uk-display-block", {
                "hfi-up": sort.by === "timestamp",
              })}
            >
              {t.date}/{t.time}
              <FontAwesomeIcon
                onClick={() => onChangeTradesSort("timestamp")}
                uk-tooltip={sortTooltip("timestamp")}
                icon={["far", sortIcon(sort, "timestamp")]}
                className="uk-margin-xsmall-left"
              />
            </div>
          </div>
        </div>
      )}

      <ColouredScrollbars
        universal
        style={{
          minHeight: isDashboard ? 49 : undefined,
          height: isDashboard ? actualHeight : frameScrollHeight,
          maxHeight: isDashboard ? scrollHeight : undefined,
        }}
      >
        {showTradePlaceholder && (
          <TransactionsPlaceholder
            type="trades"
            connectedNetwork={connectedNetwork}
            showChooseWalletModal={showChooseWalletModal}
            setShowChooseWalletModal={setShowChooseWalletModal}
            loading={isLoading}
            t={t}
            connectedAccount={connectedAccount}
          />
        )}

        {!showTradePlaceholder &&
          sortedTradeHistory.map((trade, index) => (
            <TradeElement
              trade={trade}
              key={pairToString(trade.pairId.pair) + trade.timestamp}
              firstColumnWidth={TRADES_FIRST_COLUMN_WIDTH}
              pair={trade.pairId.pair}
              width={frameWidth}
              showSizeInUsd={showSizeInUsd}
              setShowSizeInUsd={setShowSizeInUsd}
              index={index}
              isDashboard={isDashboard}
            />
          ))}

        {showLoadMoreButton && (
          <div className="uk-width-expand uk-flex uk-flex-center uk-margin-small-top uk-margin-small-bottom">
            <Button
              className={classNames(classes.loadMoreButton)}
              size="small"
              type="secondary"
              disabled={isLoading}
              onClick={() =>
                setDisplayQuantity(
                  displayQuantity + TRADES_DISPLAY_QUANTITY_INCREMENT,
                )
              }
            >
              {isLoading ? (
                <Loader color={getThemeFile(activeTheme).primaryColor} />
              ) : (
                "load more"
              )}
            </Button>
          </div>
        )}
      </ColouredScrollbars>
    </div>
  );
};

export default Trades;
