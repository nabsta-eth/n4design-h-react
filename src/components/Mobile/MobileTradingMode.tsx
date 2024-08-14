import { Fragment } from "react";
import classNames from "classnames";
import { useLanguageStore } from "../../context/Translation";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import { useNavigate } from "react-router-dom";
import { TradingModeChooser } from "../TradingModeChooser/TradingModeChooser";
import {
  useConnectedAccount,
  useConnectedNetwork,
} from "@handle-fi/react-components/dist/context/UserWallet";
import ButtonSmart from "../ButtonSmart/ButtonSmart";
import { getTradeNetworkOrNull } from "../../context/Trade";
import classes from "./MobileTradingMode.module.scss";

const MobileTradingMode = () => {
  const navigate = useNavigate();
  const { t } = useLanguageStore();
  const connectedAccount = useConnectedAccount();
  const network = useConnectedNetwork();

  return (
    <Fragment>
      <div
        className={classNames(
          "uk-flex uk-flex-middle",
          classes.tradingModeHeader,
        )}
      >
        <FontAwesomeIcon
          icon={["far", "chevron-left"]}
          className="uk-margin-small-right"
          onClick={() => navigate(-1)}
        />
        <h4 className="uk-margin-remove-vertical">
          {t.oneClickTradingModalTitle}
        </h4>
      </div>
      {connectedAccount ? (
        <div className={classes.mobileWrapper}>
          <TradingModeChooser hideHeader />
        </div>
      ) : (
        <div className="uk-flex uk-flex-center">
          <ButtonSmart
            className="uk-margin-top"
            network={getTradeNetworkOrNull(network) ?? undefined}
          />
        </div>
      )}
    </Fragment>
  );
};

export default MobileTradingMode;
