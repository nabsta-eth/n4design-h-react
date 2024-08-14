import classNames from "classnames";
import { useLanguageStore } from "../../context/Translation";
import { useUiStore } from "../../context/UserInterface";
import {
  useConnectedAccount,
  useUserWalletStore,
} from "@handle-fi/react-components/dist/context/UserWallet";
import Button from "../Button";
import ColouredScrollbars from "../ColouredScrollbars";
import TransactionsPlaceholder from "../TransactionsPlaceholder/TransactionsPlaceholder";
import classes from "./AccountTransactions.module.scss";
import {
  ACCOUNT_TRANSACTIONS_THRESHOLD_FOR_STACKED_TABLE,
  TRANSACTIONS_DISPLAY_QUANTITY_INCREMENT,
} from "../../config/trade";
import AccountTransactionElement from "../AccountTransactionElement/AccountTransactionElement";
import { useAccountTransactionsFrameDimensions } from "../../hooks/useAccountTransactionsFrameDimensions";
import { sortIcon } from "../../utils/sort";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import { getThemeFile } from "../../utils/ui";
import Loader from "@handle-fi/react-components/dist/components/Loader";
import { useAccountTransactions } from "../../hooks/useAccountTransactions";

export const ACCOUNT_TRANSACTIONS_FIRST_COLUMN_WIDTH = 140;

type Props = {
  isDashboard?: boolean;
};

const AccountTransactions = ({ isDashboard }: Props) => {
  const { t } = useLanguageStore();
  const { showChooseWalletModal, setShowChooseWalletModal, activeTheme } =
    useUiStore();
  const { connection } = useUserWalletStore();
  const connectedAccount = useConnectedAccount();
  const {
    displayQuantity,
    setDisplayQuantity,
    sortedAccountTransactions,
    isLoading,
    showLoadMoreButton,
    showTransactionsPlaceholder,
    sort,
    onChangeAccountTransactionsSort,
    sortTooltip,
  } = useAccountTransactions();

  const {
    transactionsRef,
    frameScrollHeight,
    frameWidth,
    accountTransactionHeight,
  } = useAccountTransactionsFrameDimensions();
  const isStacked =
    frameWidth < ACCOUNT_TRANSACTIONS_THRESHOLD_FOR_STACKED_TABLE;

  const desktopHeight = isDashboard ? "100vh - 600px" : "100% - 49px";
  const scrollHeight = `calc(${desktopHeight})`;
  const connectedAdjust = connectedAccount ? 49 : 60;
  const actualHeight = showTransactionsPlaceholder
    ? connectedAdjust
    : +accountTransactionHeight * displayQuantity;

  const dateTimeColumnHeader = `${t.date}/${t.time}`;

  if (!connection.chain.isConnected || !connection.chain.isSupportedNetwork) {
    return <></>;
  }

  return (
    <div
      ref={transactionsRef}
      className={classNames("uk-flex-1 uk-height-1-1", {
        "uk-margin-bottom": !isDashboard,
        [classes.dashboardWrapper]: isDashboard,
      })}
    >
      {!isStacked && (
        <div
          className={classNames(
            "uk-flex uk-flex-between uk-flex-middle uk-border-bottom uk-position-sticky uk-width-expand",
            classes.tradesHeaderWrapper,
          )}
        >
          <div
            className="uk-text-left"
            style={{ width: `${ACCOUNT_TRANSACTIONS_FIRST_COLUMN_WIDTH}px` }}
          >
            <div className="uk-flex">{"transaction type"}</div>
          </div>

          <div className="uk-flex-1 uk-text-right">{t.amount}</div>

          <div
            className={classNames("uk-flex-1 uk-flex-right", {
              "hfi-up": sort.by === "timestamp",
            })}
          >
            {dateTimeColumnHeader}
            <FontAwesomeIcon
              className="uk-margin-xsmall-left"
              icon={["far", sortIcon(sort, "timestamp")]}
              uk-tooltip={sortTooltip("timestamp")}
              onClick={() => onChangeAccountTransactionsSort("timestamp")}
            />
          </div>
        </div>
      )}

      <ColouredScrollbars
        universal
        style={{
          height: isDashboard ? actualHeight : frameScrollHeight,
          minHeight: isDashboard ? 49 : undefined,
          maxHeight: isDashboard ? scrollHeight : undefined,
        }}
      >
        {showTransactionsPlaceholder && (
          <TransactionsPlaceholder
            type="transactions"
            connectedNetwork={connection.chain.network}
            showChooseWalletModal={showChooseWalletModal}
            setShowChooseWalletModal={setShowChooseWalletModal}
            loading={isLoading}
            t={t}
            connectedAccount={connectedAccount}
          />
        )}

        {!showTransactionsPlaceholder &&
          sortedAccountTransactions.map(transaction => (
            <AccountTransactionElement
              key={transaction.txHash}
              transaction={transaction}
              firstColumnWidth={ACCOUNT_TRANSACTIONS_FIRST_COLUMN_WIDTH}
              width={frameWidth}
            />
          ))}

        {showLoadMoreButton && (
          <div className="uk-width-expand uk-flex uk-flex-center uk-margin-small-top uk-margin-small-bottom">
            <Button
              className={classNames(classes.loadMoreButton)}
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
      </ColouredScrollbars>
    </div>
  );
};

export default AccountTransactions;
