import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { IconName } from "@fortawesome/fontawesome-svg-core";
import { useUiStore } from "../../context/UserInterface";
import classNames from "classnames";
import classes from "./TopTaskbar.module.scss";
import {
  useConnectedAccount,
  useUserWalletStore,
} from "@handle-fi/react-components/dist/context/UserWallet";
import ChooseWalletModal from "@handle-fi/react-components/dist/components/ChooseWalletModal/ChooseWalletModal";
import Blockies from "react-blockies";
import { getThemeFile } from "../../utils/ui";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import { uniqueId } from "../../utils/general";
import { useLanguageStore } from "../../context/Translation";
import { DynamicOneClickTradingIcon } from "../OctButton/OctButton";
import { usePowerTileStore } from "@handle-fi/react-components/dist/context/PowerTile";
import { useUiMobileStore } from "../../context/UserInterfaceMobile";
import { useTrade } from "../../context/Trade";
import { PowerTileWrapper } from "../PowerTile/PowerTileWrapper";
import { WALLET_BUTTON_ID } from "../../config/constants";

type MobileTopTaskbarItem = {
  id?: string;
  title: string;
  button?: boolean;
  to?: string;
  icon: IconName;
  disabled?: boolean;
  onClick?: () => void;
  text?: string;
  hide?: boolean;
};

type MobileTopTaskbar = MobileTopTaskbarItem[];

const TopTaskbar = () => {
  const {
    activeTheme,
    setShowChooseWalletModal,
    showChooseWalletModal,
    isMobile,
  } = useUiStore();
  const { verticalSwipeIndex } = useUiMobileStore();
  const { setWalletChoice, connection, userStoreInitialising } =
    useUserWalletStore();
  const { showMarketChoiceModal } = useTrade();
  const { t } = useLanguageStore();
  const navigate = useNavigate();
  const connectedAccount = useConnectedAccount();
  const { onClickWalletButton } = usePowerTileStore();
  const shouldShowOneClickTradingButton = connectedAccount;

  const connectButtonText = () => {
    if (connectedAccount) return "";
    if (connection.user.isConnecting || userStoreInitialising)
      return `${t.connecting}...`;
    return t.connect;
  };

  const onClickInternal = () => {
    setWalletChoice({ walletName: "dynamic", dynamicWalletType: undefined });
    navigate("/choosewallet");
  };

  const topTaskbar: MobileTopTaskbar = [
    {
      id: `mobile-${WALLET_BUTTON_ID}`,
      title: "wallet",
      button: true,
      icon: "wallet",
      disabled: connection.user.isConnecting,
      onClick: connectedAccount ? onClickWalletButton : onClickInternal,
      text: connectButtonText(),
    },
    {
      title: "account",
      to: "/account",
      button: !connectedAccount,
      icon: "database",
      hide: !connectedAccount,
    },
  ];

  const activePath = useLocation().pathname;
  const activeMenuItem = topTaskbar.find(topTaskbarItem =>
    activePath.includes(topTaskbarItem.title),
  );
  const isMobileHome = activePath.includes("mobileHome");
  const isSettings = activePath.includes("settings");
  const isLanguage = activePath.includes("language");
  const noBorder = verticalSwipeIndex === 0 && showMarketChoiceModal;

  const topTaskbarItem = (taskbarItem: MobileTopTaskbarItem, ix: number) => {
    const itemId = taskbarItem.id
      ? taskbarItem.id
      : `${activePath.replace("/", "")}-taskbar-${
          taskbarItem.title
        }-button-${uniqueId(5)}`;
    return (
      <div
        hidden={taskbarItem.hide}
        key={taskbarItem.title}
        className={classNames(
          "uk-flex uk-width-expand uk-flex-between uk-flex-middle",
          classes.taskbarItem,
          {
            [classes.active]: taskbarItem.title === activeMenuItem?.title,
            "uk-margin-right": ix < topTaskbar.length - 1,
          },
        )}
      >
        {taskbarItem.button ? (
          <span
            id={itemId}
            onClick={taskbarItem.onClick}
            className={classNames("uk-flex uk-flex-middle")}
          >
            {connectedAccount && taskbarItem.title === "wallet" ? (
              <div
                className={classNames(classes.qrBorder, {
                  "uk-margin-small-right": taskbarItem.text,
                })}
              >
                <Blockies
                  seed={connectedAccount}
                  bg={getThemeFile(activeTheme).primaryColor}
                  fg={getThemeFile(activeTheme).backgroundColor}
                  spotColor={getThemeFile(activeTheme).errorColor}
                  size={6}
                />
              </div>
            ) : (
              <FontAwesomeIcon
                className={classNames(classes.taskbarIcon, {
                  "uk-margin-small-right": taskbarItem.text,
                })}
                icon={[
                  taskbarItem.title === activeMenuItem?.title ? "fas" : "fal",
                  taskbarItem.icon,
                ]}
              />
            )}
            {taskbarItem.text ? taskbarItem.text : ""}
          </span>
        ) : (
          <RouterLink
            id={itemId}
            tabIndex={0}
            to={taskbarItem.to || taskbarItem.title}
            className={classNames("uk-flex uk-flex-middle", {
              [classes.disabled]: taskbarItem.disabled,
            })}
          >
            {connectedAccount && taskbarItem.title === "wallet" ? (
              <div
                className={classNames(classes.qrBorder, {
                  "uk-margin-small-right": taskbarItem.text,
                })}
              >
                <Blockies
                  seed={connectedAccount}
                  bg={getThemeFile(activeTheme).primaryColor}
                  fg={getThemeFile(activeTheme).backgroundColor}
                  spotColor={getThemeFile(activeTheme).errorColor}
                  size={6}
                />
              </div>
            ) : (
              <FontAwesomeIcon
                icon={[
                  taskbarItem.title === activeMenuItem?.title ? "fas" : "fal",
                  taskbarItem.icon,
                ]}
                className={classNames(classes.taskbarIcon, {
                  "uk-margin-small-right": taskbarItem.text,
                })}
              />
            )}
            {taskbarItem.text ? taskbarItem.text : ""}
          </RouterLink>
        )}
      </div>
    );
  };

  return (
    <div
      className={classNames(
        "uk-flex uk-flex-between uk-flex-middle uk-width-expand",
        classes.taskbar,
        {
          "hfi-background": !isMobileHome,
          [classes.noBorder]: noBorder,
        },
      )}
    >
      <div className="uk-flex">
        {!isMobileHome &&
          topTaskbar.map((taskbarItem, ix) => topTaskbarItem(taskbarItem, ix))}
      </div>

      <div className="uk-flex uk-flex-middle">
        <RouterLink
          className="hfi-error uk-flex uk-flex-middle uk-margin-right"
          style={{ display: "flex !important" }}
          to="/settings"
        >
          <FontAwesomeIcon
            icon={[isSettings ? "fas" : "fal", "sliders-h"]}
            className={classNames(classes.taskbarIcon)}
          />
        </RouterLink>

        <RouterLink
          className={classNames("uk-flex uk-flex-middle", {
            "uk-margin-right":
              connectedAccount && shouldShowOneClickTradingButton,
          })}
          style={{ display: "flex !important" }}
          to="/language"
        >
          <FontAwesomeIcon
            icon={[isLanguage ? "fas" : "fal", "globe"]}
            className={classNames(classes.taskbarIcon)}
          />
        </RouterLink>

        {connectedAccount && shouldShowOneClickTradingButton && (
          <RouterLink
            className={classNames("uk-flex uk-flex-middle")}
            style={{ display: "flex !important" }}
            to="/oct"
          >
            <DynamicOneClickTradingIcon
              className={classNames(classes.taskbarIcon)}
              isMobile
            />
          </RouterLink>
        )}
      </div>

      <ChooseWalletModal
        showChooseWalletModal={showChooseWalletModal}
        setShowChooseWalletModal={setShowChooseWalletModal}
        isMobile={isMobile}
        primaryColor={getThemeFile(activeTheme).primaryColor}
      />

      <PowerTileWrapper />
    </div>
  );
};

export default TopTaskbar;
