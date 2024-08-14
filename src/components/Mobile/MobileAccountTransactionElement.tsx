import classNames from "classnames";
import { Link } from "@handle-fi/react-components/dist/components/handle_uikit/components/Link";
import classes from "./MobileAccountTransactionElement.module.scss";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import { DepositOrWithdrawal } from "handle-sdk/dist/components/trade";
import { useAccountTransaction } from "../../hooks/useAccountTransaction";

type Props = {
  transaction: DepositOrWithdrawal;
};

const MobileAccountTransactionElement = ({ transaction }: Props) => {
  const accountTransaction = useAccountTransaction(transaction);

  return (
    <div
      className={classNames(
        "uk-flex uk-flex-between uk-flex-middle",
        classes.accountTransactionContainer,
      )}
    >
      <div
        className={classNames("uk-flex uk-flex-middle", classes.iconColumn, {
          "hfi-up": !accountTransaction.isWithdrawal,
          "hfi-down": accountTransaction.isWithdrawal,
        })}
      >
        <FontAwesomeIcon
          icon={[
            "fal",
            accountTransaction.isWithdrawal
              ? "arrow-up-from-bracket"
              : "arrow-down-to-bracket",
          ]}
        />
        {accountTransaction.transactionType}
      </div>

      <div className="uk-flex uk-flex-middle">
        <div className="uk-flex uk-flex-column uk-flex-center uk-flex-top">
          <div
            className={classNames("uk-flex uk-flex-1 uk-flex-right", {
              "uk-width-expand": accountTransaction.maxTablet,
            })}
          >
            <div className="uk-flex-1 uk-text-right">
              <div
                className={classNames("uk-display-block", {
                  "hfi-up": !accountTransaction.isWithdrawal,
                  "hfi-down": accountTransaction.isWithdrawal,
                })}
              >
                {accountTransaction.amountToDisplay}
                <sub style={{ bottom: 0 }}>USD</sub>
              </div>
            </div>
          </div>

          <div
            className={classNames(
              "uk-flex uk-flex-1 uk-flex-right",
              classes.dateTime,
            )}
          >
            {new Date(accountTransaction.timestamp * 1000).toLocaleString(
              "en-AU",
              {
                hour12: false,
              },
            )}
          </div>
        </div>

        {accountTransaction.explorerMetadata && (
          <Link
            href={accountTransaction.explorerMetadata?.url}
            target="_blank"
            className={classNames(
              "uk-margin-left",
              classes.accountTransactionLink,
            )}
          >
            <FontAwesomeIcon icon={["fal", "external-link-square"]} />
          </Link>
        )}
      </div>
    </div>
  );
};

export default MobileAccountTransactionElement;
