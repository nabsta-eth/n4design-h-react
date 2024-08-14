import PortfolioTile, { TileProps } from "./PortfolioTile";
import { useTrade } from "../../../context/Trade";
import classNames from "classnames";
import classes from "./PortfolioTiles.module.scss";
import { useTradePrices } from "../../../context/TradePrices";
import { Button } from "@handle-fi/react-components/dist/components/handle_uikit/components/Button";
import { useNavigate } from "react-router-dom";
import { DisplayAmount } from "../DisplayAmount";
import {
  useConnectedAccount,
  useConnectedNetwork,
} from "@handle-fi/react-components/dist/context/UserWallet";
import { useUiStore } from "../../../context/UserInterface";
import { useLanguageStore } from "../../../context/Translation";
import { TradeNetwork, tradeNetworks } from "handle-sdk/dist/types/network";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import { useTradeAccountDisplay } from "../../../context/TradeAccountDisplay";

type TradeAccountTileProps = TileProps & {
  showDepositModal?: boolean;
  setShowDepositModal?: (show: boolean) => void;
  showWithdrawModal?: boolean;
  setShowWithdrawModal?: (show: boolean) => void;
};

const TradeAccountTile = ({
  isLoading,
  title,
  leftText,
  children,
  showDepositModal,
  setShowDepositModal,
  showWithdrawModal,
  setShowWithdrawModal,
  ...rest
}: TradeAccountTileProps) => {
  // Makes tile update on price change. Maybe not needed?
  // Added as a possible fix for #2878, which I could not replicate.
  useTradePrices();
  const { isMobile } = useUiStore();
  const { t } = useLanguageStore();
  const navigate = useNavigate();
  const connectedAccount = useConnectedAccount();
  const network = useConnectedNetwork();
  const { account, protocol } = useTrade();
  const lps = protocol.getLiquidityPools();
  const { currentAccountDisplay } = useTradeAccountDisplay(true);
  const { accountValueDisplay, availableEquityDisplay, accountEquity } =
    currentAccountDisplay;

  const deposit = () => {
    setShowDepositModal?.(true);
    setShowWithdrawModal?.(false);
  };
  const withdraw = () => {
    setShowWithdrawModal?.(true);
    setShowDepositModal?.(false);
  };
  const showDepositWithdrawButtons =
    connectedAccount &&
    tradeNetworks.includes(network as TradeNetwork) &&
    account?.id &&
    !isMobile &&
    setShowDepositModal &&
    setShowWithdrawModal;

  return (
    <PortfolioTile
      key="account"
      isLoading={isLoading}
      titleElement={
        <div
          className={classNames(
            "uk-flex uk-flex-between uk-position-relative pointer-events-all",
            classes.buttonWrapper,
          )}
        >
          <span>
            {`trade account${account?.id ? ":" : ""} `}
            <span>{account?.id}</span>
          </span>
          {connectedAccount && !account?.id && (
            <Button
              id="dashboard-trade-account-tile-open-account-button"
              type="secondary"
              size="xsmall"
              className={classNames(classes.button)}
              onClick={() => navigate("/trade")}
              tooltip={
                isMobile
                  ? undefined
                  : {
                      text: "go to trade to deposit funds and open a trade account",
                      position: "bottom-right",
                    }
              }
            >
              {t.openAccount}
            </Button>
          )}

          {showDepositWithdrawButtons && (
            <div
              className={classNames(
                "uk-flex hfi-button-collection",
                classes.buttonsWrapper,
              )}
            >
              <Button
                id="dash-deposit-button"
                type="secondary"
                size="xsmall"
                className={classNames(classes.button)}
                expand
                active={isMobile && showDepositModal}
                onClick={deposit}
              >
                <FontAwesomeIcon
                  className="uk-margin-small-right"
                  icon={["far", "arrow-down-to-bracket"]}
                />
                {t.deposit}
              </Button>

              <Button
                id="dash-withdraw-button"
                type="secondary"
                size="xsmall"
                className={classNames(classes.button)}
                expand
                active={isMobile && showWithdrawModal}
                disabled={accountEquity?.isZero()}
                onClick={withdraw}
              >
                <FontAwesomeIcon
                  className="uk-margin-small-right"
                  icon={["far", "arrow-up-from-bracket"]}
                />
                {t.withdraw}
              </Button>
            </div>
          )}
        </div>
      }
      leftText={
        <span className="uk-flex uk-flex-column">
          <span className={classNames(classes.caption)}>value</span>
          <DisplayAmount amount={accountValueDisplay} />
        </span>
      }
      rightText={
        <span className="uk-flex uk-flex-column uk-flex-bottom">
          <span className={classNames(classes.caption)}>available</span>
          <DisplayAmount amount={availableEquityDisplay} />
        </span>
      }
      {...rest}
    />
  );
};

export default TradeAccountTile;
