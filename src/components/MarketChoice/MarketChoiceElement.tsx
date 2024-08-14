import { FC, memo, useEffect } from "react";
import classNames from "classnames";
import classes from "./MarketChoiceElement.module.scss";
import { useUiStore } from "../../context/UserInterface";
import { getUkTooltip } from "../../utils/general";
import { useTrade } from "../../context/Trade";
import MarketPriceDisplay from "../MarketPriceDisplay/MarketPriceDisplay";
import { pairToDisplayString } from "../../utils/trade/toDisplayPair";
import { ViewOnlyInstrument } from "../../config/viewOnlyInstruments";
import { pairToString } from "handle-sdk/dist/utils/general";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import { SelectedMarket } from "../MarketChoiceModal/MarketChoiceModal";
import { useLanguageStore } from "../../context/Translation";
import { TradePairOrViewOnlyInstrument } from "../../types/trade";
import { MarketPairDisplay } from "../Market/MarketPairDisplay";
import { useInstrumentOrThrow } from "../../hooks/trade/useInstrumentOrThrow";
import { deepEquals } from "@handle-fi/react-components/dist/utils/general";
import { showNotification } from "@handle-fi/react-components/dist/utils/notifications";
import { IconName } from "@fortawesome/fontawesome-common-types";
import { MouseOrKeyboardEvent } from "../../types/mouseAndKeyboard";

type Props = {
  market: SelectedMarket;
  isFavourite: boolean;
  onClickMarket: (
    e: MouseOrKeyboardEvent<HTMLDivElement>,
    market: TradePairOrViewOnlyInstrument,
  ) => void;
  onMarketFocus: (market: SelectedMarket) => void;
  focussed: boolean;
  marketFocussed: SelectedMarket | undefined;
  addChartTab?: (pair: string) => void;
  isNewChartTab?: boolean;
  onClose: () => void;
};

// This is a memo component so it only re renders when its specific
// price changes, instead of if any price changes
const MarketChoiceElement: FC<Props> = memo(
  ({
    market,
    isFavourite,
    onClickMarket,
    onMarketFocus,
    focussed,
    marketFocussed,
    isNewChartTab,
  }) => {
    const displayPair = market.tradePairOrViewOnlyInstrument.pair;
    if (!displayPair) {
      throw new Error("displayPair is undefined");
    }

    const { isMobile } = useUiStore();
    const { t } = useLanguageStore();
    const instrument = useInstrumentOrThrow(
      pairToString(market.tradePairOrViewOnlyInstrument.pair),
    );
    const marketType = instrument.marketType;
    const isViewOnlyMarket = ViewOnlyInstrument.isViewOnlyInstrument(
      market.tradePairOrViewOnlyInstrument,
    );
    const description = instrument.getDescription();
    const marketPairClassName = `market-choice-modal-pair-${pairToDisplayString(
      market.tradePairOrViewOnlyInstrument.pair,
    )
      .replace("/", "-")
      .toLowerCase()}`;

    const rowSelectTooltipTitle = isViewOnlyMarket
      ? t.thisMarketIsNotTradeable
      : `${t.selectMarket} ${pairToString(
          market.tradePairOrViewOnlyInstrument.pair,
        )}`;
    const rowTooltipTitle = isNewChartTab
      ? t.addChartForMarketTooltip.replace(
          "#pair#",
          pairToString(market.tradePairOrViewOnlyInstrument.pair),
        )
      : rowSelectTooltipTitle;

    useEffect(() => {
      marketFocussed?.ref.current?.focus();
    }, [marketFocussed]);

    return (
      <div
        ref={market.ref}
        className={classNames("uk-flex-middle", classes.marketContainer, {
          "cursor-pointer": !isMobile,
          [classes.focussed]: focussed,
        })}
        tabIndex={0}
        onClick={e => onClickMarket(e, market.tradePairOrViewOnlyInstrument)}
        onFocus={() => onMarketFocus(market)}
        uk-tooltip={
          isMobile
            ? undefined
            : getUkTooltip({
                title: rowTooltipTitle,
                position: "bottom",
              })
        }
      >
        <div
          className={classNames("uk-flex uk-flex-middle", marketPairClassName)}
        >
          <FavouriteMarketIconButton
            market={market}
            isFavourite={isFavourite}
          />
          <MarketPairDisplay
            tradePairOrViewOnlyInstrument={market.tradePairOrViewOnlyInstrument}
            instrument={instrument}
            showLeverage
          />
        </div>

        {!isMobile && <div className={classes.description}>{description}</div>}

        <div>{marketType}</div>

        {!isMobile && <div className={classes.priceChart}></div>}

        <MarketPriceDisplay tradePair={market.tradePairOrViewOnlyInstrument} />
      </div>
    );
  },
  deepEquals,
);

export default MarketChoiceElement;

const FavouriteMarketIconButton = ({
  market,
  isFavourite,
}: {
  market: SelectedMarket;
  isFavourite: boolean;
}) => {
  const { isMobile, maxMobileFavouriteMarkets } = useUiStore();
  const { setFavouriteMarket, unsetFavouriteMarket, favouriteMarkets } =
    useTrade();
  const { t } = useLanguageStore();
  const favouriteIconClassName = isFavourite ? "disabled-opacity" : "";
  const favouriteIcon: IconName = isFavourite ? "minus" : "plus";
  const isMaxMarketsExceeded =
    isMobile && favouriteMarkets.length + 1 > maxMobileFavouriteMarkets;
  const favouriteTooltipText = (
    isFavourite
      ? t.removeAsFavouriteMarketTooltip
      : t.addAsFavouriteMarketTooltip
  ).replace("#pair#", pairToString(market.tradePairOrViewOnlyInstrument.pair));

  const handleClickFavouriteMarket = (
    e: MouseOrKeyboardEvent<HTMLDivElement>,
    market: TradePairOrViewOnlyInstrument,
  ) => {
    e.stopPropagation();
    if (isFavourite) {
      return unsetFavouriteMarket(market.pair);
    }
    if (!isMaxMarketsExceeded) {
      return setFavouriteMarket(market.pair);
    }
    showNotification({
      status: "info",
      message: t.maxFavouriteMarketsExceeded,
      showProgressBar: true,
      timeoutInSeconds: 5,
    });
  };

  return (
    <FontAwesomeIcon
      icon={["far", favouriteIcon]}
      className={classNames(
        "uk-margin-small-right cursor-pointer",
        favouriteIconClassName,
      )}
      onClick={e =>
        handleClickFavouriteMarket(e, market.tradePairOrViewOnlyInstrument)
      }
      uk-tooltip={
        isMobile
          ? undefined
          : getUkTooltip({
              title: favouriteTooltipText,
              position: "bottom-left",
            })
      }
    />
  );
};
