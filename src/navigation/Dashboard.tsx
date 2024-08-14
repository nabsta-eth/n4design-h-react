import * as React from "react";
import {
  VaultList,
  Wallet,
  Tabs,
  PageTitle,
  SelectCurrency,
} from "../components";
import { useVaults } from "../context/Vaults";
import useSetAccount from "../hooks/useSetAccount";
import { Container } from "@handle-fi/react-components/dist/components/handle_uikit/components/Container";
import InputAlternateAddress from "../components/InputAlternateAddress/InputAlternateAddress";
import { useNavigate, useParams } from "react-router-dom";
import Metatags from "../components/Metatags";
import Portfolio from "../components/Portfolio/Portfolio";
import classNames from "classnames";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import { useLanguageStore } from "../context/Translation";
import classes from "../components/Dashboard/Dashboard.module.scss";
import ThresholdInput from "../components/ThresholdInput/ThresholdInput";
import { useUserBalanceStore } from "../context/UserBalances";
import Positions from "../components/Positions/Positions";
import Trades from "../components/Trades/Trades";
import { useTrade } from "../context/Trade";
import { IconPrefix, IconName } from "@fortawesome/fontawesome-svg-core";
import { TranslationKey } from "src/types/translation";
import { useSelectedOrConnectedAccount } from "../hooks/useSelectedOrConnectedAccount";
import { useConnectedAccount } from "@handle-fi/react-components/dist/context/UserWallet";

enum TabType {
  Wallet,
  Positions,
  TradeHistory,
  Vaults,
}
const TAB_NAMES = ["wallet", "positions", "trade history", "vaults"] as const;
type TabName = (typeof TAB_NAMES)[TabType];

type TabInfo = {
  name: TabName;
  textTranslationKey: TranslationKey;
  icon: [IconPrefix, IconName];
};

const tabs: TabInfo[] = [
  {
    name: TAB_NAMES[TabType.Wallet],
    textTranslationKey: TAB_NAMES[TabType.Wallet],
    icon: ["fal", "wallet"],
  },
  {
    name: TAB_NAMES[TabType.Positions],
    textTranslationKey: TAB_NAMES[TabType.Positions],
    icon: ["fal", "list"],
  },
  {
    name: TAB_NAMES[TabType.TradeHistory],
    textTranslationKey: "tradeHistory",
    icon: ["fal", "history"],
  },
  {
    name: TAB_NAMES[TabType.Vaults],
    textTranslationKey: TAB_NAMES[TabType.Vaults],
    icon: ["fal", "vault"],
  },
];

type Params = {
  account: string;
  action?: TabName;
};
const DEFAULT_TAB: TabName = TAB_NAMES[0];

const DashboardPage: React.FC = () => {
  useSetAccount(`/dashboard/${DEFAULT_TAB}/:account`);
  useVaults({ fetch: true, indexed: true });
  const { t } = useLanguageStore();
  const navigate = useNavigate();
  const connectedOrSelectedAccount = useSelectedOrConnectedAccount();
  const connectedAccount = useConnectedAccount();
  const { currency, setCurrency } = useUserBalanceStore();
  const { account, action } = useParams() as Params;
  const { account: tradeAccount } = useTrade();
  const openPositionsCount = tradeAccount?.getAllPositions()?.length ?? 0;

  const [shouldShowCustomise, setShouldShowCustomise] =
    React.useState<boolean>(false);

  const tab: TabName = action || DEFAULT_TAB;

  const onChangeTab = (newTab: TabName) => {
    setShouldShowCustomise(false);
    navigate(`/dashboard/${newTab}/${account || ""}`);
  };

  const onClickCustomise = () => {
    setShouldShowCustomise(true);
  };

  const onClickDone = () => {
    setShouldShowCustomise(false);
  };

  return (
    <React.Fragment>
      <Metatags function={tab} description={`handle.fi ${tab}`} />

      <Container size="xl">
        <PageTitle
          text={t.dashboard}
          className="uk-flex-middle uk-margin-remove"
        >
          {!connectedAccount && <InputAlternateAddress />}
        </PageTitle>

        <div className={classes.dashboardWrapper}>
          <div
            className={classNames("uk-width-expand uk-flex uk-flex-right", {
              "uk-flex-top": tab === "wallet",
            })}
          >
            {shouldShowCustomise ? (
              <div className="uk-flex">
                <div
                  className="cursor-pointer"
                  uk-tooltip="title: save changes; pos: top-right;"
                  onClick={onClickDone}
                >
                  done
                  <FontAwesomeIcon
                    icon={["far", "check"]}
                    className="uk-margin-small-left"
                  />
                </div>
              </div>
            ) : (
              <div
                className="cursor-pointer"
                uk-tooltip="title: customise tiles; pos: top-right;"
                onClick={onClickCustomise}
                draggable={true}
              >
                <FontAwesomeIcon
                  icon={["far", "cog"]}
                  className="uk-margin-small-right"
                />
                {t.customise}
              </div>
            )}
          </div>

          {/* show keeps these tabs mounted when unselected for performance */}
          <Portfolio show shouldShowCustomise={shouldShowCustomise} />

          <div
            className={classNames(
              "uk-width-expand uk-flex uk-flex-between uk-margin-xsmall-top",
              {
                "uk-flex-top": tab === "wallet",
              },
            )}
          >
            {!shouldShowCustomise && (
              <>
                <Tabs
                  tabs={tabs.map(tab => tab.name)}
                  active={tab}
                  onClick={onChangeTab}
                  tabsClassName={classNames(classes.dashboardTabs)}
                  tabContent={tabName => {
                    const tabInfo = tabs.find(tab => tab.name === tabName);
                    return (
                      <span className={classNames("uk-flex uk-flex-middle")}>
                        {tabInfo && (
                          <FontAwesomeIcon
                            icon={tabInfo.icon}
                            className={classNames("uk-margin-small-right")}
                          />
                        )}
                        {tabInfo?.textTranslationKey
                          ? t[tabInfo.textTranslationKey]
                          : tabName}
                        {tabName === tabs[TabType.Positions].name && (
                          <span
                            key="number-tab-button"
                            className="number-tab-button uk-margin-xsmall-left"
                          >
                            {openPositionsCount}
                          </span>
                        )}
                      </span>
                    );
                  }}
                />

                {tab === tabs[TabType.Wallet].name &&
                  connectedOrSelectedAccount && (
                    <div className={classNames("uk-flex uk-flex-middle")}>
                      <ThresholdInput selectedCurrency={currency} />

                      <SelectCurrency
                        id="select-currency"
                        size="small"
                        value={currency}
                        dropdownOffset="0"
                        width={100}
                        onChange={setCurrency}
                      />
                    </div>
                  )}
              </>
            )}
          </div>

          <Wallet
            show={tab === tabs[TabType.Wallet].name && !shouldShowCustomise}
            currency={currency}
          />
          <VaultList
            show={tab === tabs[TabType.Vaults].name && !shouldShowCustomise}
          />
          <Positions
            show={tab === tabs[TabType.Positions].name && !shouldShowCustomise}
            isDashboard
          />
          <Trades
            show={
              tab === tabs[TabType.TradeHistory].name && !shouldShowCustomise
            }
            isDashboard
          />
        </div>
      </Container>
    </React.Fragment>
  );
};

export default DashboardPage;
