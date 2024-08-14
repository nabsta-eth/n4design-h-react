import classNames from "classnames";
import classes from "./MarketChoice.module.scss";
import {
  FC,
  Fragment,
  HTMLAttributes,
  createRef,
  forwardRef,
  useEffect,
  useMemo,
  useState,
  MouseEvent as ReactMouseEvent,
  KeyboardEvent as ReactKeyboardEvent,
} from "react";
import Input from "../Input";
import onChangeSort, { Sorting } from "../../utils/sort";
import { useUiStore } from "../../context/UserInterface";
import { useParams } from "react-router-dom";
import { useTrade } from "../../context/Trade";
import { isSamePair, pairToString } from "handle-sdk/dist/utils/general";
import { useLanguageStore } from "../../context/Translation";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import { ViewOnlyInstrument } from "../../config/viewOnlyInstruments";
import MarketChoiceElement from "./MarketChoiceElement";
import Button from "../Button";
import { SelectedMarket } from "../MarketChoiceModal/MarketChoiceModal";
import { Checkbox } from "@handle-fi/react-components/dist/components/handle_uikit/components/Form/Checkbox";
import { Pair } from "handle-sdk/dist/types/trade";
import { useWindowSize } from "../../utils/ui";
import { TranslationMap } from "src/types/translation";
import { useInView } from "react-intersection-observer";
import { TradePairOrViewOnlyInstrument } from "../../types/trade";
import {
  MARKET_CHOICE_FAVOURITE_MARKET_BUTTON_ICON,
  MarketType,
} from "../../config/trade";
import { Instrument, marketTypes } from "handle-sdk/dist/components/trade";
import { getInstrument } from "../../utils/instruments";

const DEFAULT_MARKET_TYPE: MarketType = "crypto";
const THRESHOLD_TO_HIDE_BUTTON_COUNTS = 400;

type Props = HTMLAttributes<HTMLDivElement> & {
  isMarketsOnly?: boolean;
  onClickMarket: (
    e:
      | ReactMouseEvent<HTMLDivElement, MouseEvent>
      | ReactKeyboardEvent<HTMLDivElement>,
    market: TradePairOrViewOnlyInstrument,
  ) => void;
  sortedSelectedMarkets: SelectedMarket[];
  setSortedSelectedMarkets: (markets: SelectedMarket[]) => void;
  marketFocussed?: SelectedMarket;
  setMarketFocussed: (market: SelectedMarket) => void;
  addChartTab?: (pair: string) => void;
  isNewChartTab?: boolean;
  onClose: () => void;
};

const doesMarketMeetSearchCriteria = (
  market: TradePairOrViewOnlyInstrument,
  instrument: Instrument,
  marketType: ButtonMarketType = "all",
  favouriteMarkets: Pair[] = [],
  favouritesOnly: boolean = false,
  searchValue: string = "",
) =>
  (ViewOnlyInstrument.isViewOnlyInstrument(market) || market.isActive) &&
  pairToString(market.pair).toLowerCase().includes(searchValue.toLowerCase()) &&
  (marketType === "all" || marketType === instrument.marketType) &&
  (!favouritesOnly || favouriteMarkets.some(m => isSamePair(m, market.pair)));

const MarketChoice = forwardRef<HTMLDivElement, Props>(
  (
    {
      isMarketsOnly,
      onClickMarket,
      sortedSelectedMarkets,
      setSortedSelectedMarkets,
      marketFocussed,
      setMarketFocussed,
      addChartTab,
      isNewChartTab,
      onClose,
    },
    ref,
  ) => {
    const { isMobile } = useUiStore();
    const {
      pairs: markets,
      viewOnlyInstruments,
      favouriteMarkets,
      instruments,
    } = useTrade();
    const [searchValue, setSearchValue] = useState("");
    const [marketType, setMarketType] =
      useState<ButtonMarketType>(DEFAULT_MARKET_TYPE);
    const [favouritesOnly, setFavouritesOnly] = useState<boolean>(false);

    const baseMarkets = useMemo(
      () => [...markets, ...viewOnlyInstruments],
      [markets, viewOnlyInstruments],
    );
    const selectedMarkets = useMemo(
      () =>
        baseMarkets.filter(market => {
          const instrument = getInstrument(instruments, market.pair);
          return doesMarketMeetSearchCriteria(
            market,
            instrument,
            marketType,
            favouriteMarkets,
            favouritesOnly,
            searchValue,
          );
        }),
      [baseMarkets, searchValue, marketType, favouritesOnly],
    );

    const [sort, onSetSort] = useState<Sorting>({
      by: "symbol",
      direction: "asc",
    });

    const selectedMarketsReversed = [...selectedMarkets].reverse();
    useEffect(() => {
      const newSort =
        sort.direction === "asc" ? selectedMarkets : selectedMarketsReversed;
      const newSortWithRefs = newSort.map(market => ({
        tradePairOrViewOnlyInstrument: market,
        ref: createRef<HTMLDivElement>(),
      }));
      setSortedSelectedMarkets(newSortWithRefs as SelectedMarket[]);
    }, [selectedMarkets, sort]);

    const clearSearch = () => {
      setSearchValue("");
    };

    const reverseSort = () => {
      onChangeSort(sort, sort.by, onSetSort);
    };

    useEffect(() => {
      if (isMobile || !marketFocussed) return;
      marketFocussed?.ref?.current?.scrollIntoView({
        block: "center",
        behavior: "smooth",
      });
    }, [marketFocussed]);

    const onMarketFocus = (market: SelectedMarket) => {
      setMarketFocussed(market);
    };

    return (
      <Fragment>
        <MarketSearchSection
          searchValue={searchValue}
          setSearchValue={setSearchValue}
          clearSearch={clearSearch}
        />

        <MarketFilterSection
          marketType={marketType}
          setMarketType={setMarketType}
          baseMarkets={baseMarkets}
          favouriteMarkets={favouriteMarkets}
          favouritesOnly={favouritesOnly}
          setFavouritesOnly={setFavouritesOnly}
          searchValue={searchValue}
        />

        {isMobile && (
          <MarketChoiceKeyHints favouriteMarkets={favouriteMarkets} />
        )}

        <MarketListHeader reverseSort={reverseSort} sort={sort} />

        <MarketListSection
          ref={ref}
          isMarketsOnly={isMarketsOnly}
          marketType={marketType}
          sortedSelectedMarkets={sortedSelectedMarkets}
          reverseSort={reverseSort}
          sort={sort}
          favouriteMarkets={favouriteMarkets}
          onClickMarket={onClickMarket}
          onMarketFocus={onMarketFocus}
          marketFocussed={marketFocussed}
          addChartTab={addChartTab}
          isNewChartTab={isNewChartTab}
          onClose={onClose}
        />

        {!isMobile && (
          <MarketChoiceKeyHints favouriteMarkets={favouriteMarkets} />
        )}
      </Fragment>
    );
  },
);

type MarketSearchSectionProps = {
  searchValue: string;
  setSearchValue: (newValue: string) => void;
  clearSearch: () => void;
};

const MarketSearchSection: FC<MarketSearchSectionProps> = ({
  searchValue,
  setSearchValue,
  clearSearch,
}) => {
  const { isMobile } = useUiStore();
  const { showMarketChoiceModal } = useTrade();
  const { t } = useLanguageStore();
  const { ref, inView } = useInView();
  const searchRef = createRef<HTMLInputElement>();
  useEffect(() => {
    if (!searchRef.current) {
      return;
    }
    if (!inView || !showMarketChoiceModal) {
      return searchRef.current.blur();
    }
    if (!isMobile) {
      searchRef.current.focus();
    }
  }, [searchRef.current, inView, isMobile, showMarketChoiceModal]);

  return (
    <form
      ref={ref}
      noValidate
      autoComplete="off"
      className={classNames(
        "uk-flex uk-flex-between uk-margin-small-bottom",
        classes.searchWrapper,
      )}
    >
      <Input
        id="market-search"
        ref={searchRef}
        wrapperClassName={classNames(
          "hfi-input-small uk-width-expand",
          classes.searchInput,
        )}
        disabled={!inView || !showMarketChoiceModal}
        placeholder={t.searchMarkets}
        value={searchValue}
        inputClassName="uk-width-expand uk-width-1-1"
        onChange={(newValue: string) => setSearchValue(newValue)}
        leftIcon={{
          prefix: "far",
          name: "magnifying-glass",
        }}
        rightIcon={
          searchValue
            ? {
                prefix: "far",
                name: "times",
                onClick: clearSearch,
              }
            : undefined
        }
        autoFocus={!isMobile}
      />
    </form>
  );
};

type ButtonMarketType = MarketType | "all";

type MarketFilterSectionProps = {
  marketType: ButtonMarketType;
  setMarketType: (marketType: ButtonMarketType) => void;
  baseMarkets: TradePairOrViewOnlyInstrument[];
  favouriteMarkets: Pair[];
  favouritesOnly: boolean;
  setFavouritesOnly: (favouritesOnly: boolean) => void;
  searchValue: string;
};

const MarketFilterSection: FC<MarketFilterSectionProps> = ({
  marketType,
  setMarketType,
  baseMarkets,
  favouriteMarkets,
  favouritesOnly,
  setFavouritesOnly,
  searchValue,
}) => {
  const { t } = useLanguageStore();
  const { instruments } = useTrade();
  const { isMobile } = useUiStore();
  const windowSize = useWindowSize();
  const showButtonCounts =
    windowSize.windowWidth >= THRESHOLD_TO_HIDE_BUTTON_COUNTS;
  const marketTypeButtons = ([...marketTypes, "all"] as ButtonMarketType[]).map(
    symbolType => (
      <Button
        type="secondary"
        size="small"
        key={symbolType}
        className={classes.marketTypeButton}
        active={marketType === symbolType}
        onClick={() => setMarketType(symbolType)}
      >
        {t[symbolType as keyof TranslationMap]}
        {showButtonCounts && (
          <span className={classes.buttonCount}>
            {"("}
            {
              baseMarkets.filter(m => {
                const instrument = getInstrument(instruments, m.pair);
                return doesMarketMeetSearchCriteria(
                  m,
                  instrument,
                  symbolType,
                  favouriteMarkets,
                  favouritesOnly,
                  searchValue,
                );
              }).length
            }
            {")"}
          </span>
        )}
      </Button>
    ),
  );

  return (
    <div
      className={classNames(
        "uk-flex uk-flex-between uk-margin-xsmall-bottom uk-width-expand",
        {
          [classes.mobileFilterWrapper]: isMobile,
        },
      )}
    >
      <div
        className={classNames(
          "uk-button-group uk-width-expand",
          classes.marketTypeButtons,
        )}
      >
        {marketTypeButtons}
      </div>

      {!isMobile && (
        <div
          className={classNames(
            "uk-flex uk-flex-middle uk-flex-right uk-margin-small-left",
            classes.favouritesOnlyWrapper,
          )}
        >
          <span className="uk-text-small uk-text-nowrap uk-margin-small-right">
            {t.favourites}
          </span>

          <Checkbox
            className={classes.favouritesOnlyCheckbox}
            checked={favouritesOnly}
            onChange={() => setFavouritesOnly(!favouritesOnly)}
          />
        </div>
      )}
    </div>
  );
};

type MarketListSectionProps = {
  isMarketsOnly?: boolean;
  marketType: ButtonMarketType;
  sortedSelectedMarkets: SelectedMarket[];
  reverseSort: () => void;
  sort: Sorting;
  favouriteMarkets: Pair[];
  onClickMarket: (
    e:
      | ReactMouseEvent<HTMLDivElement, MouseEvent>
      | ReactKeyboardEvent<HTMLDivElement>,
    market: TradePairOrViewOnlyInstrument,
  ) => void;
  onMarketFocus: (market: SelectedMarket) => void;
  marketFocussed?: SelectedMarket;
  addChartTab?: (pair: string) => void;
  isNewChartTab?: boolean;
  onClose: () => void;
};

const MarketListSection = forwardRef<HTMLDivElement, MarketListSectionProps>(
  (
    {
      isMarketsOnly,
      marketType,
      sortedSelectedMarkets,
      reverseSort,
      sort,
      favouriteMarkets,
      onClickMarket,
      onMarketFocus,
      marketFocussed,
      addChartTab,
      isNewChartTab,
      onClose,
    },
    ref,
  ) => {
    const { isMobile } = useUiStore();
    const { t } = useLanguageStore();
    const { component: componentParam } = useParams();
    const isMobileMarkets =
      isMobile && !isMarketsOnly && componentParam !== "markets";
    const isMarkets = !isMarketsOnly && !isMobileMarkets;
    const noMarketsMessage =
      marketType === "all"
        ? t.noMarketsFound
        : t.noMarketsForTypeText.replace("#marketType#", marketType);

    const marketList = sortedSelectedMarkets.map(market => {
      const isFavourite = favouriteMarkets.some(fave =>
        isSamePair(fave, market.tradePairOrViewOnlyInstrument.pair),
      );
      return (
        <MarketChoiceElement
          key={pairToString(market.tradePairOrViewOnlyInstrument.pair)}
          market={market}
          isFavourite={isFavourite}
          onClickMarket={onClickMarket}
          onMarketFocus={onMarketFocus}
          focussed={marketFocussed === market}
          marketFocussed={marketFocussed}
          addChartTab={addChartTab}
          isNewChartTab={isNewChartTab}
          onClose={onClose}
        />
      );
    });

    return (
      <div className={classes.marketListWrapper}>
        <div
          ref={ref}
          className={classNames(classes.noBorder, {
            [classes.desktopMarkets]: !isMobileMarkets,
            [classes.mobileMarkets]: isMobileMarkets,
            [classes.marketsOnly]: isMarketsOnly,
            [classes.markets]: isMarkets,
          })}
        >
          {sortedSelectedMarkets.length > 0 ? (
            marketList
          ) : (
            <div className="uk-flex uk-flex-center uk-width-1-1 uk-margin-top">
              {noMarketsMessage}
            </div>
          )}
        </div>
      </div>
    );
  },
);

type MarketListHeaderProps = {
  reverseSort: () => void;
  sort: Sorting;
};

const MarketListHeader: FC<MarketListHeaderProps> = ({ reverseSort, sort }) => {
  const { t } = useLanguageStore();
  const { isMobile } = useUiStore();
  return (
    <div className={classNames("uk-flex-middle", classes.headerWrapper)}>
      <div className="uk-flex uk-flex-middle uk-flex-center">
        <span className="uk-margin-small-right">{t.market}</span>
        <button
          className="uk-button uk-button-text uk-button-small"
          onClick={reverseSort}
        >
          <FontAwesomeIcon
            icon={[
              "far",
              `chevron-${sort.direction === "asc" ? "down" : "up"}`,
            ]}
            className={classNames("cursor-pointer pointer-events-all")}
          />
        </button>
      </div>

      {!isMobile && (
        <div className="uk-flex uk-flex-middle">{t.description}</div>
      )}
      <div className="uk-flex uk-flex-middle">{t.type}</div>
      {!isMobile && <div></div>}

      <div
        className="
          uk-flex-1
          uk-margin-remove-vertical
          uk-flex
          uk-flex-column
          uk-text-right
          uk-flex-bottom
        "
      >
        <div className={classes.priceHeader}>{t.price}</div>
        <div className={classes.changeHeader}>
          {t.tradeChartHeader24hChangeText}
        </div>
      </div>
    </div>
  );
};

type MarketChoiceHintsProps = {
  favouriteMarkets: Pair[];
};

const MarketChoiceKeyHints: FC<MarketChoiceHintsProps> = ({
  favouriteMarkets,
}) => {
  const { t } = useLanguageStore();
  const { isMobile, maxMobileFavouriteMarkets } = useUiStore();
  const { isNewChartTab } = useTrade();
  const maxFavouriteMobileMarketsReached =
    isMobile && favouriteMarkets.length >= maxMobileFavouriteMarkets;
  const maxMarketsMessageBase = maxFavouriteMobileMarketsReached
    ? t.maxMarketsReachedMessage
    : t.maxMarketsMessage;
  const maxMarketsText = isMobile
    ? maxMarketsMessageBase.replace(
        "#maxMarkets#",
        maxMobileFavouriteMarkets.toString(),
      )
    : "";
  const maxFavouriteMobileMarketsExceeded =
    isMobile && favouriteMarkets.length > maxMobileFavouriteMarkets;
  return (
    <div
      className={classNames(
        "uk-flex uk-flex-middle uk-flex-between",
        classes.keyHintsWrapper,
        {
          [classes.keyHintsWrapperDesktop]: !isMobile,
        },
      )}
    >
      {!isMobile && (
        <div className="uk-flex uk-flex-middle">
          <span className="uk-margin-xsmall-right uk-text-small">
            {t.navigate}
          </span>
          <div className={classes.keyBox}>
            <FontAwesomeIcon icon={["fal", "arrow-up"]} />
          </div>
          <div className={classes.keyBox}>
            <FontAwesomeIcon icon={["fal", "arrow-down"]} />
          </div>
        </div>
      )}

      <div className="uk-flex uk-flex-middle">
        <span className="uk-margin-xsmall-right uk-text-small">
          {t.addToWatchlist}
        </span>
        <div
          className={classNames(classes.keyBox, {
            [classes.keyBoxMobile]: isMobile,
          })}
        >
          <FontAwesomeIcon
            icon={["fal", MARKET_CHOICE_FAVOURITE_MARKET_BUTTON_ICON]}
          />
        </div>
        {!isMobile && (
          <div
            className={classNames(classes.keyBox, {
              [classes.keyBoxMobile]: isMobile,
            })}
          >
            f
          </div>
        )}
        {isMobile && !!maxMarketsText && (
          <span
            className={classNames(
              classes.maxMarketsText,
              "uk-margin-small-left uk-text-small",
              {
                [classes.maxFavouriteMobileMarketsExceeded]:
                  maxFavouriteMobileMarketsExceeded,
              },
            )}
          >
            {maxMarketsText}
          </span>
        )}
      </div>

      {!isMobile && (
        <div className="uk-flex uk-flex-middle">
          <span className="uk-margin-xsmall-right uk-text-small">
            {isNewChartTab ? t.addChart : t.selectMarket}
          </span>
          <div className={classes.keyBox}>
            <span>{t.enterKey}</span>
          </div>
          <div className={classes.keyBox}>
            <span>{t.spaceKey}</span>
          </div>
        </div>
      )}

      {!isMobile && (
        <div className="uk-flex uk-flex-middle">
          <span className="uk-margin-xsmall-right uk-text-small">
            {t.close}
          </span>
          <div className={classes.keyBox}>
            <span>{t.escKey}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketChoice;
