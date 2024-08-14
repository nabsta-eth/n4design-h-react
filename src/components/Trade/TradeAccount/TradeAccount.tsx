import classNames from "classnames";
import "rc-slider/assets/index.css";
import * as React from "react";
import { useLocation } from "react-router-dom";
import classes from "./TradeAccount.module.scss";
import { MIN_ACCOUNT_WIDTH } from "../../../config/trade";
import { useLanguageStore } from "../../../context/Translation";
import { useUiStore } from "../../../context/UserInterface";
import { TradeAccountRow } from "./TradeAccountRow";
import TradeDepositModal from "../TradeDepositModal/TradeDepositModal";
import TradeWithdrawModal from "../TradeWithdrawModal/TradeWithdrawModal";
import TradeDeposit from "../TradeDeposit/TradeDeposit";
import TradeWithdraw from "../TradeWithdraw/TradeWithdraw";
import { getTradeNetworkOrNull, useTrade } from "../../../context/Trade";
import { Button } from "@handle-fi/react-components/dist/components/handle_uikit/components/Button";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import { useCorrectNetworkUserCheck } from "../../../hooks/useCorrectNetworkUserCheck";
import { useUserWalletStore } from "@handle-fi/react-components/dist/context/UserWallet";
import ButtonSmart from "../../ButtonSmart/ButtonSmart";
import { convertPartial } from "../../../utils/priceError";
import { getUkTooltip, uniqueId } from "../../../utils/general";
import { getThemeFile } from "../../../utils/ui";
import { getLiqRiskProps } from "../../../utils/trade/getLiqRiskProps";
import ColouredStatusBar from "@handle-fi/react-components/dist/components/ColouredStatusBar";
import { TradeNetwork, tradeNetworks } from "handle-sdk/dist/types/network";
import OldToNewDisplay from "../../../components/OldToNewDisplay/OldToNewDisplay";
import { useOneClickTrading } from "../../../hooks/useOneClickTrading";
import {
  TradeAccountDisplay,
  useTradeAccountDisplay,
} from "../../../context/TradeAccountDisplay";

export type RowProps = {
  leftSide: React.ReactNode;
  rightSide: React.ReactNode;
  tooltip?: string[];
  className?: string;
};

type Props = {
  modal?: boolean;
};

const TradeAccount = ({ modal }: Props) => {
  const activePath = useLocation().pathname;
  const isTrade = activePath.replace("/", "") === "trade";
  const { isMobile, activeTheme } = useUiStore();
  const { t } = useLanguageStore();
  const { account } = useTrade();
  const { connection, userStoreInitialising } = useUserWalletStore();
  const { isOneClickTradingActive } = useOneClickTrading();
  const canDeposit =
    connection.chain.isConnected &&
    connection.chain.isSupportedNetwork &&
    !userStoreInitialising &&
    tradeNetworks.includes(connection.chain.network as TradeNetwork) &&
    connection.user.isConnected;
  const { currentAccountDisplay, simulated } = useTradeAccountDisplay(true);
  const {
    accountValue,
    availableEquityDisplay,
    accountEquity,
    marginUsageDisplay,
    leverageDisplay,
    fundsUntilLiquidation,
    fundsUntilLiquidationDisplay,
    accountValueDisplay,
  } = currentAccountDisplay;

  useCorrectNetworkUserCheck();

  const hasSufficientMarginForCurrentAccount =
    currentAccountDisplay.hasSufficientMargin;
  const hasSufficientMarginForNextAccount =
    simulated?.nextAccountDisplay.hasSufficientMargin ?? true;
  const {
    accountValue: nextAccountValue,
    accountValueDisplay: nextAccountValueDisplay,
    availableEquity: nextAvailableEquity,
    availableEquityDisplay: nextAvailableEquityDisplay,
    fundsUntilLiquidation: nextFundsUntilLiquidation,
    fundsUntilLiquidationDisplay: nextFundsUntilLiquidationDisplay,
    maintenanceEquity: nextMaintenanceEquity,
    marginUsageDisplay: nextMarginUsageDisplay,
    leverageDisplay: nextLeverageDisplay,
  } = hasSufficientMarginForNextAccount
    ? convertPartial(simulated?.nextAccountDisplay ?? currentAccountDisplay)
    : convertPartial<TradeAccountDisplay>(undefined);

  const {
    liqRiskBarValue: nextLiqRiskValue,
    liqRiskTooltip,
    liqRiskBarTooltip,
    liqRiskClass,
  } = getLiqRiskProps(nextAccountValue, nextMaintenanceEquity);

  const [showDepositModal, setShowDepositModal] = React.useState(false);
  const deposit = () => {
    setShowDepositModal(true);
    setShowWithdrawModal(false);
  };
  const onCloseDepositModal = () => {
    setShowDepositModal(false);
  };

  const [showWithdrawModal, setShowWithdrawModal] = React.useState(false);
  const withdraw = () => {
    setShowWithdrawModal(true);
    setShowDepositModal(false);
  };
  const onCloseWithdrawModal = () => {
    setShowWithdrawModal(false);
  };

  const idPrefix = () => {
    if (isMobile) return "mobile";
    if (modal) return "modal";
    return "tab";
  };

  const id = React.useMemo(() => {
    const id = uniqueId(5);
    return (v: string) => `${idPrefix()}-account-${v}-${id}`;
  }, [account?.id]);

  const idForAccountId = () => {
    if (!account) return id(`id-empty`);
    return id("id");
  };

  return (
    <React.Fragment>
      <div
        id={id("container")}
        className={classNames("uk-flex uk-flex-column uk-flex-center", {
          [classes.accountContainer]: !modal && (!isMobile || !isTrade),
        })}
        style={isMobile ? undefined : { minWidth: MIN_ACCOUNT_WIDTH }}
      >
        {!modal && !isMobile && (
          <div className="uk-margin-xsmall-bottom uk-flex uk-flex-between">
            <span>{"account"}</span>
            <span
              uk-tooltip={
                isOneClickTradingActive
                  ? getUkTooltip({
                      title: t.oneClickTradingOnTooltip,
                      position: "left",
                    })
                  : undefined
              }
            >
              {isOneClickTradingActive && (
                <FontAwesomeIcon
                  className={"uk-margin-small-right"}
                  style={{ fontWeight: "bold" }}
                  icon={["fas", "bolt"]}
                />
              )}
              <span id={idForAccountId()}>{account?.id ?? ""}</span>
            </span>
          </div>
        )}

        {(!isMobile || !isTrade) && (
          <div
            className={classNames(
              "uk-flex uk-width-expand uk-margin-small-bottom",
              {
                "hfi-button-collection": canDeposit,
              },
            )}
          >
            {!canDeposit && (
              <ButtonSmart
                network={
                  connection.chain.isConnected &&
                  connection.chain.isSupportedNetwork
                    ? getTradeNetworkOrNull(connection.chain.network) ??
                      undefined
                    : undefined
                }
                type="secondary"
                expand
                className={classes.buttonSmart}
              />
            )}

            {canDeposit && (
              <React.Fragment>
                <Button
                  id={id("deposit-button")}
                  type="secondary"
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
                  id={id("withdraw-button")}
                  type="secondary"
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
              </React.Fragment>
            )}
          </div>
        )}

        {!(isMobile && (showDepositModal || showWithdrawModal)) && (
          <div>
            <TradeAccountRow
              leftSide={"account value"}
              rightSide={
                <OldToNewDisplay
                  id="account-value-amount"
                  className={classNames({
                    "is-zero": accountValue?.isZero(),
                  })}
                  old={accountValueDisplay}
                  oldValueClassName={classNames({
                    "hfi-error": accountValue?.lt(0),
                  })}
                  newValue={nextAccountValueDisplay}
                  options={{
                    suffix: " USD",
                  }}
                  newValueClassName={classNames({
                    "hfi-error": accountValue?.gt(0) && nextAccountValue?.lt(0),
                  })}
                />
              }
            />

            <TradeAccountRow
              leftSide={"available funds"}
              rightSide={
                <OldToNewDisplay
                  id="account-available-amount"
                  old={availableEquityDisplay}
                  newValue={nextAvailableEquityDisplay}
                  newValueClassName={classNames({
                    "hfi-error": nextAvailableEquity?.lte(0),
                  })}
                  options={{
                    suffix: " USD",
                  }}
                />
              }
            />

            <TradeAccountRow
              leftSide={`margin usage`}
              rightSide={
                <OldToNewDisplay
                  id="account-margin-amount"
                  old={marginUsageDisplay}
                  oldValueClassName={classNames({
                    "hfi-error": !hasSufficientMarginForCurrentAccount,
                  })}
                  newValue={nextMarginUsageDisplay}
                  newValueClassName={classNames({
                    "hfi-error": !hasSufficientMarginForNextAccount,
                  })}
                  options={{
                    suffix: "%",
                  }}
                />
              }
            />

            <TradeAccountRow
              leftSide={t.accountLeverage}
              rightSide={
                <OldToNewDisplay
                  id="account-leverage-amount"
                  old={leverageDisplay}
                  oldValueClassName={classNames({
                    "hfi-error": !hasSufficientMarginForCurrentAccount,
                  })}
                  newValue={nextLeverageDisplay}
                  newValueClassName={classNames({
                    "hfi-error": !hasSufficientMarginForNextAccount,
                  })}
                  options={{
                    suffix: "x",
                  }}
                />
              }
            />

            <TradeAccountRow
              leftSide={
                <span
                  className={classNames(liqRiskClass, classes.liqRiskLabel)}
                  uk-tooltip={liqRiskTooltip}
                >
                  <span
                    className={classNames(liqRiskClass, "uk-tooltip-content")}
                  >
                    {t.liqRisk}
                  </span>
                </span>
              }
              rightSide={
                <span uk-tooltip={liqRiskBarTooltip}>
                  <ColouredStatusBar
                    id="liq-risk-bar"
                    valueFraction={nextLiqRiskValue}
                    themeFile={getThemeFile(activeTheme)}
                    outerBarClasses={classes.outerBar}
                  />
                </span>
              }
            />

            <TradeAccountRow
              className={classNames()}
              leftSide={t.fundsUntilLiquidation}
              rightSide={
                <span>
                  <OldToNewDisplay
                    id="funds-until-liquidation-ammount"
                    old={fundsUntilLiquidationDisplay}
                    newValue={nextFundsUntilLiquidationDisplay}
                    newValueClassName={classNames({
                      "hfi-error":
                        fundsUntilLiquidation?.gt(0) &&
                        nextFundsUntilLiquidation?.lte(0),
                    })}
                    options={{
                      suffix: " USD",
                    }}
                  />
                </span>
              }
            />
          </div>
        )}
      </div>

      {showDepositModal && !isMobile && (
        <TradeDepositModal
          show={showDepositModal}
          onClose={onCloseDepositModal}
        />
      )}

      {showWithdrawModal && !isMobile && (
        <TradeWithdrawModal
          show={showWithdrawModal}
          onClose={onCloseWithdrawModal}
        />
      )}

      {showDepositModal && isMobile && (
        <TradeDeposit onClose={() => setShowDepositModal(false)} />
      )}

      {showWithdrawModal && isMobile && (
        <TradeWithdraw onClose={() => setShowWithdrawModal(false)} />
      )}
    </React.Fragment>
  );
};

export default TradeAccount;
