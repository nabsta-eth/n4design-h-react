import classNames from "classnames";
import { FC, useMemo } from "react";
import classes from "./MobileMarket.module.scss";
import PairDisplay from "@handle-fi/react-components/dist/components/PairDisplay/PairDisplay";
import { Pair } from "handle-sdk/dist/types/trade";
import { MAX_MOBILE_FAVOURITE_CHARTS } from "../../config/trade";
import { useUiMobileStore } from "../../context/UserInterfaceMobile";
import MarketPriceDisplay from "../MarketPriceDisplay/MarketPriceDisplay";
import { TradePairOrViewOnlyInstrument } from "../../types/trade";
import { getDisplayPair } from "../../utils/trade/toDisplayPair";
import { useInstrumentOrThrow } from "../../hooks/trade/useInstrumentOrThrow";
import { isSamePair, pairToString } from "handle-sdk/dist/utils/general";
import { showNotification } from "@handle-fi/react-components/dist/utils/notifications";
import { useLanguageStore } from "../../context/Translation";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import { MouseOrKeyboardEvent } from "src/types/mouseAndKeyboard";

type Props = {
  tradePair: TradePairOrViewOnlyInstrument;
};

const MobileMarket: FC<Props> = ({ tradePair }) => {
  const { onClickMarket, setClickedChart } = useUiMobileStore();
  const instrument = useInstrumentOrThrow(pairToString(tradePair.pair));
  const displayPair = getDisplayPair(tradePair.pair, instrument);

  const handleClickMarket = async (market: TradePairOrViewOnlyInstrument) => {
    setClickedChart(market.pair);
    onClickMarket(market.pair);
  };

  const handleClickMarketAttributes = {
    onClick: () => handleClickMarket(tradePair),
    tabIndex: 0,
    role: "button",
  };

  return (
    <div
      className={classNames("uk-flex uk-flex-middle", classes.marketContainer)}
    >
      <div className={classNames("uk-flex uk-flex-middle", classes.select)}>
        <div className={classNames("uk-flex uk-flex-middle")}>
          <div
            className={classNames(
              "uk-height-1-1 uk-flex uk-flex-middle uk-margin-small-right",
              classes.favouriteButton,
            )}
          >
            <FavouriteMobileChartIconButton tradePair={tradePair} />
          </div>
          <div className="uk-flex" {...handleClickMarketAttributes}>
            <PairDisplay
              pair={displayPair as Pair}
              noAssets
              size="1.5x"
              instrument={instrument}
            />

            <div
              className={classNames(
                "uk-flex uk-flex-column uk-flex-center uk-flex-top",
              )}
            >
              <PairDisplay
                pair={displayPair as Pair}
                noIcons
                size="1.5x"
                assetsFontSize={16}
                instrument={instrument}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="uk-width-expand" {...handleClickMarketAttributes}>
        <MarketPriceDisplay tradePair={tradePair} />
      </div>
    </div>
  );
};

export default MobileMarket;

const FavouriteMobileChartIconButton = ({
  tradePair,
}: {
  tradePair: TradePairOrViewOnlyInstrument;
}) => {
  const {
    favouriteMobileCharts,
    setFavouriteMobileChart,
    unsetFavouriteMobileChart,
  } = useUiMobileStore();
  const { t } = useLanguageStore();
  const isChartFavourite = useMemo(
    () => favouriteMobileCharts.some(f => isSamePair(f, tradePair.pair)),
    [favouriteMobileCharts],
  );

  const handleOnClickFavouriteChart = (
    e: MouseOrKeyboardEvent<HTMLDivElement>,
    market: TradePairOrViewOnlyInstrument,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (isChartFavourite) {
      unsetFavouriteMobileChart(market.pair);
    } else {
      if (favouriteMobileCharts.length + 1 > MAX_MOBILE_FAVOURITE_CHARTS) {
        return showNotification({
          status: "info",
          message: t.maxFavouriteChartsExceeded.replace(
            "#maxFavouriteCharts#",
            MAX_MOBILE_FAVOURITE_CHARTS.toString(),
          ),
          showProgressBar: true,
          timeoutInSeconds: 5,
        });
      }
      setFavouriteMobileChart(market.pair);
    }
  };
  return (
    <div
      className={classNames(classes.favourite, {
        [classes.showIcon]: isChartFavourite,
      })}
      tabIndex={0}
      role="button"
      onClick={e => handleOnClickFavouriteChart(e, tradePair)}
    >
      <FontAwesomeIcon icon={["fal", "chart-simple"]} />
    </div>
  );
};
