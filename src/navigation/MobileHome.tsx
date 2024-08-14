import classNames from "classnames";
import { hlp } from "handle-sdk/dist/components/trade/platforms";
import { isSamePair, pairToString } from "handle-sdk/dist/utils/general";
import { useEffect, useMemo } from "react";
import { useSwipeable } from "react-swipeable";
import Markets from "../components/Markets/Markets";
import classes from "../components/Mobile/MobileHome.module.scss";
import TradeChart from "../components/TradeChart/TradeChart";
import { useTrade } from "../context/Trade";
import { useUiMobileStore } from "../context/UserInterfaceMobile";
import useSetAccount from "../hooks/useSetAccount";
import { sortMarketPairs } from "../utils/trade/sorting";
import { useConnectedAccount } from "@handle-fi/react-components/dist/context/UserWallet";
import MarketChoiceModal from "../components/MarketChoiceModal/MarketChoiceModal";

const NETWORK = hlp.config.DEFAULT_HLP_NETWORK;

const MobileHome = () => {
  useSetAccount();
  const {
    selectedPair,
    setShowMarketChoiceModal,
    showMarketChoiceModal,
    instruments,
  } = useTrade();
  const connectedAccount = useConnectedAccount();

  const {
    isMobileHomeInViewport,
    market,
    setMarket,
    marketsToDisplay,
    verticalSwipeIndex,
    setVerticalSwipeIndex,
    storePair,
  } = useUiMobileStore();

  // Syncs the pair according to the selectedPair while this component
  // is not in the viewport.
  useEffect(() => {
    if (isMobileHomeInViewport || !selectedPair) return;
    setMarket(selectedPair);
  }, [isMobileHomeInViewport, selectedPair]);

  // Sets the vertical swipe index according to the pair.
  useEffect(() => {
    const index = market
      ? marketsToDisplay.findIndex(p => isSamePair(p.pair, market))
      : -1;
    const verticalIndex = index === -1 ? 0 : index + 1;
    setVerticalSwipeIndex(verticalIndex);
  }, [market]);

  useEffect(() => {
    if (!connectedAccount) setVerticalSwipeIndex(0);
  }, [connectedAccount]);

  const sortedMarkets = useMemo(() => {
    return sortMarketPairs(instruments, marketsToDisplay);
  }, [marketsToDisplay]);

  const handlers = useSwipeable({
    onSwiped: eventData => {
      if (showMarketChoiceModal) return;
      if (eventData.dir === "Up") {
        if (verticalSwipeIndex === marketsToDisplay.length) {
          storePair(marketsToDisplay[marketsToDisplay.length - 1].pair);
          return setVerticalSwipeIndex(marketsToDisplay.length);
        }
        storePair(marketsToDisplay[verticalSwipeIndex].pair);
        return setVerticalSwipeIndex(verticalSwipeIndex + 1);
      }
      if (eventData.dir === "Down") {
        if (verticalSwipeIndex === 0) return;
        if (verticalSwipeIndex > 1)
          storePair(marketsToDisplay[verticalSwipeIndex - 2].pair);
        setVerticalSwipeIndex(verticalSwipeIndex - 1);
      }
    },
  });

  const onCloseMarketChoiceModal = () => {
    setShowMarketChoiceModal(false);
  };

  return (
    <div
      {...handlers}
      className={classes.wrapper}
      style={{ transform: `translate(0px, -${verticalSwipeIndex * 100}%)` }}
    >
      <div>
        <Markets
          network={NETWORK}
          setShowMarketChoiceModal={setShowMarketChoiceModal}
        />
      </div>

      {!showMarketChoiceModal &&
        sortedMarkets.map(tradePair => {
          return (
            <div key={pairToString(tradePair.pair)}>
              <TradeChart
                className={classNames(classes.mobileHome)}
                pair={tradePair.pair}
              />
            </div>
          );
        })}

      {showMarketChoiceModal && (
        <MarketChoiceModal onClose={onCloseMarketChoiceModal} />
      )}
    </div>
  );
};

export default MobileHome;
