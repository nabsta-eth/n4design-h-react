import * as React from "react";
import classNames from "classnames";
import classes from "./MobileTradeAccount.module.scss";
import { useNavigate } from "react-router-dom";
import TradeAccount from "../Trade/TradeAccount/TradeAccount";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import { useTrade } from "../../context/Trade";
import { useUiMobileStore } from "../../context/UserInterfaceMobile";
import Button from "../Button";

const MobileTradeAccount: React.FC = () => {
  const { account } = useTrade();
  const { activeMenuItemTitle } = useUiMobileStore();
  const navigate = useNavigate();
  const idForAccountId = React.useMemo(() => {
    const idBase = "mobile-account-id";
    if (!account) return `${idBase}-empty`;
    return idBase;
  }, [account?.id]);

  return (
    <div id="mobile-account" className={classNames(classes.accountContainer)}>
      <div
        className={classNames("uk-flex uk-flex-middle", classes.accountHeader)}
      >
        <Button
          id="back-button"
          className="uk-button-text"
          onClick={() => navigate(`/${activeMenuItemTitle}`)}
        >
          <FontAwesomeIcon
            icon={["far", "chevron-left"]}
            className="uk-margin-small-right"
          />
        </Button>
        <h4 className="uk-margin-remove-vertical uk-width-expand uk-flex uk-flex-between">
          <span>{"account"}</span>
          <span id={idForAccountId}>{account?.id}</span>
        </h4>
      </div>

      <TradeAccount />
    </div>
  );
};

export default MobileTradeAccount;
