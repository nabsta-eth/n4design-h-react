import classNames from "classnames";
import React from "react";
import { useLanguageStore } from "../../context/Translation";
import { Link } from "@handle-fi/react-components/dist/components/handle_uikit/components/Link";
import classes from "./AccountTransactionElement.module.scss";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import {
  DepositOrWithdrawal,
  PeriodicFee,
} from "handle-sdk/dist/components/trade";
import { ACCOUNT_TRANSACTIONS_THRESHOLD_FOR_STACKED_TABLE } from "../../config/trade";
import { useAccountTransaction } from "../../hooks/useAccountTransaction";
import { ACCOUNT_TRANSACTIONS_FIRST_COLUMN_WIDTH } from "../AccountTransactions/AccountTransactions";

type Props = {
  transaction: DepositOrWithdrawal | PeriodicFee;
  firstColumnWidth: number;
  width: number;
};

const AccountTransactionElement = React.memo(
  ({ transaction, firstColumnWidth, width }: Props) => {
    const { t } = useLanguageStore();

    const accountTransaction = useAccountTransaction(transaction);
    const isStacked = width < ACCOUNT_TRANSACTIONS_THRESHOLD_FOR_STACKED_TABLE;

    return (
      <div
        className={classNames(
          "uk-flex uk-flex-between uk-flex-middle",
          classes.accountTransactionWrapper,
          {
            "uk-flex-column uk-flex-between": isStacked,
            [classes.accountTransactionWrapperStacked]: isStacked,
          },
        )}
      >
        <div
          className={classNames("uk-flex uk-flex-between", {
            "uk-width-expand": isStacked,
            [classes.transactionType]: !isStacked,
          })}
          style={isStacked ? undefined : { width: firstColumnWidth }}
        >
          {isStacked && (
            <div className="uk-text-left">{"transaction type"}</div>
          )}

          <div className="uk-flex uk-flex-between">
            <div>
              {accountTransaction.explorerMetadata && (
                <Link
                  tooltip={{
                    text: t.viewTxOnBlockExplorer,
                    position: "right",
                  }}
                  href={accountTransaction.explorerMetadata?.url}
                  target="_blank"
                  className="uk-margin-small-right"
                >
                  <FontAwesomeIcon icon={["fal", "external-link-square"]} />
                </Link>
              )}
            </div>

            <div
              className={classNames({
                "hfi-up": !accountTransaction.isWithdrawal,
                "hfi-down": accountTransaction.isWithdrawal,
              })}
              style={
                isStacked
                  ? undefined
                  : { width: ACCOUNT_TRANSACTIONS_FIRST_COLUMN_WIDTH }
              }
            >
              <FontAwesomeIcon
                className="uk-margin-small-right"
                icon={[
                  "fal",
                  accountTransaction.isWithdrawal
                    ? "arrow-up-from-bracket"
                    : "arrow-down-to-bracket",
                ]}
              />
              {accountTransaction.transactionType}
            </div>
          </div>
        </div>

        <div
          className={classNames(
            "uk-flex uk-flex-1 uk-flex-right uk-width-expand",
          )}
        >
          {isStacked && (
            <div className="uk-text-left">
              <div className="uk-flex">{"amount"}</div>
            </div>
          )}

          <div
            className={classNames("uk-flex-1 uk-flex-right", {
              "hfi-up": !accountTransaction.isWithdrawal,
              "hfi-down": accountTransaction.isWithdrawal,
            })}
          >
            {accountTransaction.amountToDisplay}
          </div>
        </div>

        <div
          className={classNames("uk-flex uk-flex-1 uk-flex-right", {
            "uk-width-expand": isStacked,
          })}
        >
          {isStacked && (
            <div className="uk-text-left">
              <div>
                {t.date}/{t.time}
              </div>
            </div>
          )}

          <div className="uk-flex-1 uk-text-right">
            <div>
              {new Date(accountTransaction.timestamp * 1000).toLocaleString(
                undefined,
                {
                  hour12: false,
                },
              )}
            </div>
          </div>
        </div>
      </div>
    );
  },
);

export default AccountTransactionElement;
