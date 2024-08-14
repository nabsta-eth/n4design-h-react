import Loader from "@handle-fi/react-components/dist/components/Loader";
import classes from "./MobileTrades.module.scss";
import { useUiStore } from "../../context/UserInterface";
import MobileTradeElement from "./MobileTradeElement";
import { useLanguageStore } from "../../context/Translation";
import { getThemeFile } from "../../utils/ui";
import { Button } from "@handle-fi/react-components/dist/components/handle_uikit/components/Button/Button";
import { pairToString } from "handle-sdk/dist/utils/general";
import { TRADES_DISPLAY_QUANTITY_INCREMENT } from "../../config/trade";
import { useTrades } from "../../hooks/useTrades";
import TradeTextPlaceholderMobile from "./TradeTextPlaceholderMobile";

const MobileTrades = () => {
  const { t } = useLanguageStore();
  const { activeTheme } = useUiStore();
  const {
    displayQuantity,
    setDisplayQuantity,
    sortedTradeHistory,
    isLoading,
    showLoadMoreButton,
    showTradePlaceholder,
  } = useTrades();
  const placeholderText = t.noTradesYet;

  return (
    <div className="uk-flex-1 positions-wrapper">
      <div id="mobile-transactions" className={classes.transactionsWrapper}>
        {showTradePlaceholder && (
          <TradeTextPlaceholderMobile
            placeholderText={placeholderText}
            isLoading={isLoading}
          />
        )}

        {!showTradePlaceholder &&
          sortedTradeHistory?.map(trade => (
            <MobileTradeElement
              trade={trade}
              key={`${pairToString(trade.pairId.pair)}${trade.timestamp}`}
            />
          ))}

        {showLoadMoreButton && (
          <div className="uk-width-expand uk-flex uk-flex-center uk-margin-small-top uk-margin-small-bottom">
            <Button
              className={classes.loadMoreButton}
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
                <Loader color={getThemeFile(activeTheme).backgroundColor} />
              ) : (
                "load more"
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileTrades;
