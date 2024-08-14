import { useState } from "react";
import Tabs from "../Tabs";
import { Params, useParams } from "react-router-dom";
import { useMediaQueries } from "../../hooks/useMediaQueries";
import classes from "./MobileTransactions.module.scss";
import { useUiStore } from "../../context/UserInterface";
import { useLanguageStore } from "../../context/Translation";
import { useUserWalletStore } from "@handle-fi/react-components/dist/context/UserWallet";
import MobilePositions from "./MobilePositions";
import MobileTrades from "./MobileTrades";
import MobileAccountTransactions from "./MobileAccountTransactions";

const MobileTransactions = () => {
  const { t } = useLanguageStore();
  const { isDev } = useUserWalletStore();

  const tabs = isDev
    ? [t.positions, t.orders, t.tradeHistory, "account"]
    : [t.positions, t.tradeHistory, "account"];
  const [display, setDisplay] = useState(t.positions);
  const { isMobile } = useUiStore();

  // gets the optional component param from the route
  // to display the correct tab content
  const { component: componentParam } = useParams() as Params;
  const componentOnly = componentParam && tabs.includes(componentParam);
  const stickyParams = componentOnly && !isMobile ? "offset: 0;" : undefined;

  const maxTablet = useMediaQueries().maxTablet;

  return (
    <div className="uk-flex-1 positions-wrapper">
      <div
        className="uk-flex uk-flex-middle hfi-background positions-tabs"
        data-uk-sticky={stickyParams}
      >
        <div className="uk-flex uk-flex-between uk-width-expand">
          <Tabs
            tabs={tabs}
            active={display}
            onClick={setDisplay}
            tabsClassName={
              maxTablet ? "uk-margin-remove-bottom" : "uk-margin-small-bottom"
            }
          />
        </div>
      </div>

      <div id="mobile-transactions" className={classes.transactionsWrapper}>
        {display === t.positions && <MobilePositions />}
        {display === t.tradeHistory && <MobileTrades />}
        {display === "account" && <MobileAccountTransactions />}
      </div>
    </div>
  );
};

export default MobileTransactions;
