import classNames from "classnames";
import { Pair } from "handle-sdk/dist/types/trade";
import { useLanguageStore } from "../../context/Translation";
import PairDisplay from "@handle-fi/react-components/dist/components/PairDisplay/PairDisplay";
import classes from "./PositionPairDisplay.module.scss";
import { useInstrumentOrThrow } from "../../hooks/trade/useInstrumentOrThrow";
import { pairToString } from "handle-sdk/dist/utils/general";

type Props = {
  pair: Pair;
  isLong: boolean;
  disableIsLongDisplay?: boolean;
};

const PositionPairDisplay: React.FC<Props> = props => {
  const { pair, isLong, disableIsLongDisplay } = props;
  const { t } = useLanguageStore();
  const instrument = useInstrumentOrThrow(pairToString(pair));

  const isUsdBase = pair.baseSymbol === "USD";
  const isLongDisplay = isLong ? t.long : t.short;
  const shouldHideQuote = instrument.hideQuoteSymbol;

  return (
    <div
      className={classNames("uk-flex uk-flex-middle", classes.indexPair, {
        [classes.reverse]: isUsdBase,
      })}
    >
      <PairDisplay pair={pair} noAssets size="1.5x" instrument={instrument} />

      <div
        className={classNames("uk-flex uk-flex-column", classes.assetsOnly, {
          [classes.noQuoteIcon]: shouldHideQuote,
        })}
      >
        <PairDisplay
          pair={pair}
          assetsFontSize={14}
          noIcons
          instrument={instrument}
        />

        {!disableIsLongDisplay && (
          <span
            className={classNames(classes.longShortDisplay, {
              [classes.shortDisplay]: !isLong,
              "hfi-up": isLong,
              "hfi-down": !isLong,
            })}
          >
            {isLongDisplay}
          </span>
        )}
      </div>
    </div>
  );
};

export default PositionPairDisplay;
