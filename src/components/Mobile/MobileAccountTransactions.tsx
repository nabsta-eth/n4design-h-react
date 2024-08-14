import Loader from "@handle-fi/react-components/dist/components/Loader";
import classNames from "classnames";
import classes from "./MobileAccountTransactions.module.scss";
import { useUiStore } from "../../context/UserInterface";
import { getThemeFile } from "../../utils/ui";
import { Button } from "@handle-fi/react-components/dist/components/handle_uikit/components/Button/Button";
import MobileAccountTransactionElement from "./MobileAccountTransactionElement";
import { TRANSACTIONS_DISPLAY_QUANTITY_INCREMENT } from "../../config/trade";
import { useAccountTransactions } from "../../hooks/useAccountTransactions";
import TradeTextPlaceholderMobile from "./TradeTextPlaceholderMobile";

const MobileAccountTransactions = () => {
  const { activeTheme } = useUiStore();
  const {
    displayQuantity,
    setDisplayQuantity,
    sortedAccountTransactions,
    isLoading,
    showLoadMoreButton,
    showTransactionsPlaceholder,
  } = useAccountTransactions();
  const placeholderText = "no activity yet";

  return (
    <div className={classNames("uk-flex-1 positions-wrapper")}>
      <div id="mobile-transactions" className={classes.transactionsWrapper}>
        {showTransactionsPlaceholder && (
          <TradeTextPlaceholderMobile
            placeholderText={placeholderText}
            isLoading={isLoading}
          />
        )}

        {!showTransactionsPlaceholder &&
          sortedAccountTransactions?.map(transaction => (
            <MobileAccountTransactionElement
              transaction={transaction}
              key={transaction.txHash}
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
                  displayQuantity + TRANSACTIONS_DISPLAY_QUANTITY_INCREMENT,
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
      </div>
    </div>
  );
};

export default MobileAccountTransactions;
