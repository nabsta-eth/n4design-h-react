import classNames from "classnames";
import FlashingNumber from "../FlashingNumber/FlashingNumber";
import classes from "./MarketPriceDisplay.module.scss";
import React from "react";
import Loader from "@handle-fi/react-components/dist/components/Loader";
import { getPairUnavailabilityMessage } from "../../utils/trade/errors/weekendTrading";
import { useChartHeaderData } from "../../hooks/useChartHeaderData";
import { useLanguageStore } from "../../context/Translation";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import PriceDisplayExtended from "../PriceDisplayExtended/PriceDisplayExtended";
import { useUiStore } from "../../context/UserInterface";
import { getThemeFile } from "../../utils/ui";
import { ViewOnlyInstrument } from "../../config/viewOnlyInstruments";
import { useMarketAvailability } from "../../hooks/useMarketAvailability";
import { removeWholeNumberSeparatorsFromNumberString } from "../../utils/format";
import { TradePairOrViewOnlyInstrument } from "../../types/trade";
import { HIDE_PRICE_CHANGE_ARROWS } from "../../config/trade";

type Props = {
  tradePair: TradePairOrViewOnlyInstrument;
};

const MarketPriceDisplay = ({ tradePair }: Props) => {
  const { activeTheme } = useUiStore();
  const { t } = useLanguageStore();
  const marketData = useChartHeaderData(tradePair);
  const marketDataChange = marketData.change ? marketData.change : 0;
  const marketDataChangeIsPositive =
    marketData.change && marketData.change >= 0;
  const marketDataChangeDisplayValue =
    marketData.change && +(marketData.change * 100).toFixed(2);
  const isViewOnly = ViewOnlyInstrument.isViewOnlyInstrument(tradePair);
  const availability = useMarketAvailability(tradePair);
  const isMarketClosed = !availability.isAvailable;
  const areReducedOpacityPrices = isMarketClosed || isViewOnly;

  return (
    <div
      className={classNames(
        "uk-flex uk-flex-1 uk-flex-column uk-flex-center uk-flex-bottom uk-height-1-1",
        {
          "disabled-opacity": areReducedOpacityPrices,
        },
      )}
    >
      <FlashingNumber
        className={classNames(
          "uk-flex uk-flex-middle uk-height-1-1 uk-flex-right uk-width-expand margin-left-unset",
          classes.price,
        )}
        value={
          marketData.marketPriceDisplay
            ? +removeWholeNumberSeparatorsFromNumberString(
                marketData.marketPriceDisplay,
              )
            : undefined
        }
      >
        {marketData.marketPriceDisplay ? (
          <PriceDisplayExtended
            price={marketData.marketPriceDisplay}
            isViewOnly={isViewOnly}
          />
        ) : (
          <Loader color={getThemeFile(activeTheme).primaryColor} />
        )}
      </FlashingNumber>

      {!isMarketClosed ? (
        <FlashingNumber
          value={marketDataChangeDisplayValue}
          className={classNames(
            classes.change,
            "uk-flex uk-flex-middle uk-flex-right uk-width-expand uk-text-right",
            {
              "hfi-flash-down":
                marketData.isLoaded &&
                marketData.change &&
                marketData.change < 0,
              "hfi-flash-up":
                marketData.isLoaded &&
                marketData.change &&
                marketData.change >= 0,
            },
          )}
        >
          {marketData.isLoaded ? (
            <React.Fragment>
              {marketDataChangeIsPositive ? "+" : ""}
              {(marketDataChange * 100).toFixed(2)}%
              {!HIDE_PRICE_CHANGE_ARROWS && (
                <FontAwesomeIcon
                  icon={[
                    "fal",
                    marketDataChangeIsPositive ? "arrow-up" : "arrow-down",
                  ]}
                  className="uk-margin-small-left"
                />
              )}
            </React.Fragment>
          ) : (
            <Loader color={getThemeFile(activeTheme).primaryColor} />
          )}
        </FlashingNumber>
      ) : (
        <div className={classes.unavailableMessage}>
          {getPairUnavailabilityMessage(
            t,
            availability.reason,
            tradePair.pair,
            true,
            true,
          )}
        </div>
      )}
    </div>
  );
};

export default MarketPriceDisplay;
