import {
  RefObject,
  createRef,
  useState,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
} from "react";
import MarketChoice from "../MarketChoice/MarketChoice";
import { useLanguageStore } from "../../context/Translation";
import { useUiStore } from "../../context/UserInterface";
import Modal from "@handle-fi/react-components/dist/components/Modal";
import { useTrade } from "../../context/Trade";
import { isSamePair, pairToString } from "handle-sdk/dist/utils/general";
import classNames from "classnames";
import classes from "./MarketChoiceModal.module.scss";
import { isKeyPressedEnterOrSpace } from "../../utils/ui";
import { TradePairOrViewOnlyInstrument } from "../../types/trade";

type Props = {
  onClose: () => void;
  addChartTab?: (pair: string) => void;
  isNewChartTab?: boolean;
};

export type SelectedMarket = {
  tradePairOrViewOnlyInstrument: TradePairOrViewOnlyInstrument;
  ref: RefObject<HTMLDivElement>;
};

const MarketChoiceModal = ({ onClose, addChartTab, isNewChartTab }: Props) => {
  const {
    selectedPair,
    favouriteMarkets,
    setFavouriteMarket,
    unsetFavouriteMarket,
    setSelectedPair,
  } = useTrade();
  const { t } = useLanguageStore();
  const { isMobile, showChooseWalletModal } = useUiStore();
  const marketsRef = createRef<HTMLDivElement>();
  const [sortedSelectedMarkets, setSortedSelectedMarkets] = useState<
    SelectedMarket[]
  >([]);
  const [marketFocussed, setMarketFocussed] = useState<
    SelectedMarket | undefined
  >(
    sortedSelectedMarkets.find(p =>
      isSamePair(p.tradePairOrViewOnlyInstrument.pair, selectedPair),
    ),
  );

  const onKeyDownInternal = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      return onClose();
    }
    if (event.code === "KeyF" && marketFocussed) {
      event.preventDefault();
      const isFavourite = favouriteMarkets.some(fave =>
        isSamePair(fave, marketFocussed.tradePairOrViewOnlyInstrument.pair),
      );
      if (isFavourite) {
        return unsetFavouriteMarket(
          marketFocussed.tradePairOrViewOnlyInstrument.pair,
        );
      }
      return setFavouriteMarket(
        marketFocussed.tradePairOrViewOnlyInstrument.pair,
      );
    }
    if (isKeyPressedEnterOrSpace(event) && marketFocussed) {
      event.preventDefault();
      return onClickMarket(event, marketFocussed.tradePairOrViewOnlyInstrument);
    }
    const isEventKeyArrows =
      event.key === "ArrowDown" || event.key === "ArrowUp";
    if (!isEventKeyArrows) return;

    event.preventDefault();
    const marketIndex = marketFocussed
      ? sortedSelectedMarkets.findIndex(m =>
          isSamePair(
            m.tradePairOrViewOnlyInstrument.pair,
            marketFocussed.tradePairOrViewOnlyInstrument.pair,
          ),
        )
      : 0;
    if (event.key === "ArrowDown") {
      const nextMarketIndex =
        marketIndex + 1 === sortedSelectedMarkets.length
          ? marketIndex
          : marketIndex + 1;
      setMarketFocussed(sortedSelectedMarkets[nextMarketIndex]);
    }
    if (event.key === "ArrowUp") {
      const prevMarketIndex = marketIndex === 0 ? marketIndex : marketIndex - 1;
      setMarketFocussed(sortedSelectedMarkets[prevMarketIndex]);
    }
  };

  const onClickMarket = (
    e:
      | ReactMouseEvent<HTMLDivElement, MouseEvent>
      | ReactKeyboardEvent<HTMLDivElement>,
    market: TradePairOrViewOnlyInstrument,
  ) => {
    if (!market) {
      return;
    }

    if (isMobile) {
      setFavouriteMarket(market.pair);
    }
    if (!isMobile) {
      setSelectedPair(market.pair);
      if (isNewChartTab) {
        addChartTab?.(pairToString(market.pair));
        onClose();
      }
    }
  };

  return (
    <Modal
      show={true}
      width={700}
      onClose={onClose}
      title={t.markets}
      showChooseWalletModal={showChooseWalletModal}
      onKeyDown={onKeyDownInternal}
      animation={isMobile ? "none" : undefined}
      classes={classNames({
        [classes.mobileModalShow]: isMobile,
      })}
      closeClasses={classes.closeButton}
      modalClasses={classNames({
        [classes.desktopModal]: !isMobile,
        [classes.mobileModal]: isMobile,
      })}
      closeIcon={isMobile ? "chevron-down" : undefined}
    >
      <MarketChoice
        ref={marketsRef}
        sortedSelectedMarkets={sortedSelectedMarkets}
        setSortedSelectedMarkets={setSortedSelectedMarkets}
        marketFocussed={marketFocussed}
        setMarketFocussed={setMarketFocussed}
        onClickMarket={onClickMarket}
        addChartTab={addChartTab}
        isNewChartTab={isNewChartTab}
        onClose={onClose}
      />
    </Modal>
  );
};

export default MarketChoiceModal;
