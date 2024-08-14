import classNames from "classnames";
import { useMemo, KeyboardEvent as ReactKeyboardEvent, FC, memo } from "react";
import classes from "./Market.module.scss";
import { useChartHeaderData } from "../../hooks/useChartHeaderData";
import { Network, trade } from "handle-sdk";
import { useUiStore } from "../../context/UserInterface";
import { MarketPrice } from "handle-sdk/dist/components/trade/platforms/legacyInterface";
import { formatPrice } from "../../utils/trade";
import { getUkTooltip } from "../../utils/general";
import { Pair } from "handle-sdk/dist/types/trade";
import { useMediaQueries } from "../../hooks/useMediaQueries";
import {
  MARKETS_RESPONSIVE_WIDTH,
  MARKET_COLUMN_WIDTH_DESKTOP,
  MARKET_COLUMN_WIDTH_MOBILE,
} from "../../config/trade";
import { useTrade } from "../../context/Trade";
import MarketPriceDisplay from "../MarketPriceDisplay/MarketPriceDisplay";
import { useLanguageStore } from "../../context/Translation";
import {
  getDisplayPair,
  pairToDisplayString,
} from "../../utils/trade/toDisplayPair";
import { ViewOnlyInstrument } from "../../config/viewOnlyInstruments";
import { BuySellButtons } from "./BuySellButtons";
import { ethers } from "ethers";
import { useMarketAvailability } from "../../hooks/useMarketAvailability";
import { getClickableMarketProps } from "../../utils/trade/marketProps";
import { MouseOrKeyboardEvent } from "../../types/mouseAndKeyboard";
import { TradePairOrViewOnlyInstrument } from "../../types/trade";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import { isKeyPressedEnterOrSpace } from "../../utils/ui";
import { MarketPairDisplay } from "./MarketPairDisplay";
import { useInstrumentOrThrow } from "../../hooks/trade/useInstrumentOrThrow";
import { pairToString } from "handle-sdk/dist/utils/general";
import { deepEquals } from "@handle-fi/react-components/dist/utils/general";
import { IconName } from "@fortawesome/fontawesome-common-types";

type Props = {
  tradePair: TradePairOrViewOnlyInstrument;
  price: MarketPrice | null;
  network: Network;
  hidden?: boolean;
  isMarketsOnly?: boolean;
  isFavourite: boolean;
  onClickMarket?: (pair: TradePairOrViewOnlyInstrument) => void;
  onClickFaveMarket?: (pair: Pair) => void;
  width?: number;
};

// This is a memo component so it only re renders when its specific
// price changes, instead of if any price changes
const Market: FC<Props> = memo(props => {
  const { isMobile } = useUiStore();
  const { setFavouriteMarket, unsetFavouriteMarket, setSelectedPair } =
    useTrade();
  const { t } = useLanguageStore();
  const isViewOnly = ViewOnlyInstrument.isViewOnlyInstrument(props.tradePair);
  const isMarketClosed = !useMarketAvailability(props.tradePair).isAvailable;
  const marketData = useChartHeaderData(props.tradePair);
  const mediaQueries = useMediaQueries();
  const instrument = useInstrumentOrThrow(pairToString(props.tradePair.pair));

  const buyPrice = props.price?.bestAsk ?? ethers.constants.Zero;
  const buyPriceDisplay = formatPrice(
    buyPrice,
    instrument.getDisplayDecimals(buyPrice, true),
    undefined,
    trade.PRICE_DECIMALS,
  );
  const sellPrice = props.price?.bestBid ?? ethers.constants.Zero;
  const sellPriceDisplay = formatPrice(
    sellPrice,
    instrument.getDisplayDecimals(sellPrice, true),
    undefined,
    trade.PRICE_DECIMALS,
  );

  const showBuySell = useMemo(
    () =>
      (props.width && props.width >= MARKETS_RESPONSIVE_WIDTH) ||
      (!props.width && mediaQueries.minMobile),
    [props.width],
  );

  const marketNameToDisplay = `${
    instrument.pair
  } (${instrument.getDescription()})`;

  const handleClickMarket = async (
    e: MouseOrKeyboardEvent<HTMLDivElement>,
    market: TradePairOrViewOnlyInstrument,
  ) => {
    if (
      e.type === "keydown" &&
      !isKeyPressedEnterOrSpace(e as ReactKeyboardEvent)
    ) {
      return;
    }
    setFavouriteMarket(market.pair);
    props.onClickMarket?.(market);
    if (!isMobile) setSelectedPair(market.pair);
  };

  const favouriteIconClassName = props.isFavourite ? "disabled-opacity" : "";
  const favouriteIcon: IconName = props.isFavourite ? "minus" : "plus";
  const handleClickFavouriteMarket = (
    e: MouseOrKeyboardEvent<HTMLDivElement>,
    market: TradePairOrViewOnlyInstrument,
  ) => {
    if (
      e.type === "keydown" &&
      !isKeyPressedEnterOrSpace(e as ReactKeyboardEvent)
    ) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    if (props.isFavourite) {
      unsetFavouriteMarket(market.pair);
    } else {
      setFavouriteMarket(market.pair);
    }
  };

  const showRowAsClickable = !isMobile && (isViewOnly || !showBuySell);
  const clickableRowProps = getClickableMarketProps(
    showRowAsClickable,
    t,
    props.tradePair,
    marketNameToDisplay,
    handleClickMarket,
  );
  const showPairAndPriceAsClickable = !isMobile && !isViewOnly && showBuySell;
  const clickablePairAndPriceProps = getClickableMarketProps(
    showPairAndPriceAsClickable,
    t,
    props.tradePair,
    marketNameToDisplay,
    handleClickMarket,
    "bottom-right",
  );

  const displayPair = getDisplayPair(props.tradePair.pair, instrument);

  if (!displayPair) {
    console.log(props.tradePair);
    throw new Error("displayPair is undefined");
  }

  const marketPairClassName = `market-pair-${pairToDisplayString(
    props.tradePair.pair,
  )
    .replace("/", "-")
    .toLowerCase()}`;

  return (
    <div
      className={classNames(
        "uk-flex uk-flex-between uk-flex-middle",
        classes.marketContainer,
        {
          "cursor-pointer": !isMobile,
        },
      )}
      {...clickableRowProps}
    >
      <div
        className={classNames(
          "uk-flex uk-flex-middle uk-height-1-1",
          classes.select,
        )}
        style={{
          width: isMobile
            ? MARKET_COLUMN_WIDTH_MOBILE
            : MARKET_COLUMN_WIDTH_DESKTOP,
        }}
      >
        {!props.isMarketsOnly && (
          <div
            className={classNames(
              "uk-height-1-1 uk-flex uk-flex-middle",
              classes.favouriteButton,
              {
                "cursor-pointer": !isMobile,
              },
            )}
            onClick={e => handleClickFavouriteMarket(e, props.tradePair)}
            onKeyDown={e => handleClickFavouriteMarket(e, props.tradePair)}
            uk-tooltip={getUkTooltip({
              title: (props.isFavourite
                ? t.removeAsFavouriteMarketTooltip
                : t.addAsFavouriteMarketTooltip
              ).replace("#pair#", pairToDisplayString(props.tradePair.pair)),
              position: "right",
            })}
          >
            <FontAwesomeIcon
              className={classNames(
                "uk-margin-small-right",
                favouriteIconClassName,
              )}
              icon={["far", favouriteIcon]}
            />
          </div>
        )}

        <div
          className={classNames(
            "uk-flex uk-flex-middle uk-height-1-1 uk-width-expand",
            marketPairClassName,
            {
              "cursor-pointer": !isMobile,
            },
          )}
          {...clickablePairAndPriceProps}
        >
          <MarketPairDisplay
            tradePairOrViewOnlyInstrument={props.tradePair}
            instrument={instrument}
            showLeverage
          />
        </div>
      </div>

      {showBuySell &&
        !ViewOnlyInstrument.isViewOnlyInstrument(props.tradePair) && (
          <BuySellButtons
            buyPriceDisplay={buyPriceDisplay}
            isMarketClosed={isMarketClosed}
            isMarketDataLoaded={!!marketData.isLoaded}
            sellPriceDisplay={sellPriceDisplay}
            tradePair={props.tradePair}
          />
        )}

      <div
        className={classNames(
          "uk-flex uk-flex-middle uk-height-1-1 uk-width-expand uk-margin-small-left",
          {
            "cursor-pointer": !isMobile,
          },
        )}
        {...clickablePairAndPriceProps}
      >
        <MarketPriceDisplay tradePair={props.tradePair} />
      </div>
    </div>
  );
}, deepEquals);

export default Market;
