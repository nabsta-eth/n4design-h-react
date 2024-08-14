import { useLanguageStore } from "../../context/Translation";
import {
  Connection,
  useConnectedAccount,
  useConnectedNetwork,
  useUserWalletStore,
} from "@handle-fi/react-components/dist/context/UserWallet";
import { useEffect, useState } from "react";
import { useUiStore } from "../../context/UserInterface";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import { Button, SelectNetwork, SettingsModal } from "../index";
import LanguagesModal from "../LanguagesModal/LanguagesModal";
import ChooseWalletModal from "@handle-fi/react-components/dist/components/ChooseWalletModal/ChooseWalletModal";
import { getThemeFile } from "../../utils/ui";
import classes from "./RightHeaderComponents.module.scss";
import classNames from "classnames";
import { useTrade } from "../../context/Trade";
import { getActivePath } from "../../utils/url";
import { TiprButton } from "../Tipr/TiprButton";
import { getIsTiprActive } from "../../utils/trade/tiprFli";
import DynamicWalletButton from "@handle-fi/react-components/dist/components/DynamicWalletButton/DynamicWalletButton";
import { Network } from "handle-sdk";
import { NetworkDisplay } from "../SelectNetwork";
import { OctButton } from "../OctButton/OctButton";
import OneClickTradingModal from "../OneClickTradingModal/OneClickTradingModal";
import { usePowerTileStore } from "@handle-fi/react-components/dist/context/PowerTile";
import { PowerTileWrapper } from "../PowerTile/PowerTileWrapper";
import { WALLET_BUTTON_GROUP_ID } from "../../config/constants";

export const RightHeaderComponents = () => {
  const { t } = useLanguageStore();
  const connectedNetwork = useConnectedNetwork();
  const connectedAccount = useConnectedAccount();
  const [showSettings, setShowSettings] = useState(false);
  const [showLanguages, setShowLanguages] = useState(false);
  const {
    showChooseWalletModal,
    setShowChooseWalletModal,
    setIsLayoutSettingsOpen,
    isLayoutSettingsOpen,
    isMobile,
    activeTheme,
  } = useUiStore();
  const { setShowMarketChoiceModal } = useTrade();
  const { onClickWalletButton } = usePowerTileStore();
  const isTrade = getActivePath() === "trade";

  const openSettingsModal = () => {
    setShowSettings(true);
    setIsLayoutSettingsOpen(true);
  };

  useEffect(() => {
    if (isLayoutSettingsOpen) {
      openSettingsModal();
    }
  }, [isLayoutSettingsOpen]);
  const { connection, switchNetwork } = useUserWalletStore();
  const networkToBeDisplayed = getNetworkToBeDisplayed(connection);

  const onSwitchNetwork = (newNetwork: Network) => {
    switchNetwork(newNetwork).catch(console.error);
  };

  const [showOctModal, setShowOctModal] = useState(false);

  return (
    <>
      {getIsTiprActive() && isTrade && (
        <TiprButton className={classNames(classes.tiprButton)} />
      )}

      {isTrade && (
        <div
          className="hfi-yellow uk-flex uk-flex-middle uk-margin-small-right cursor-pointer"
          role="button"
          tabIndex={0}
          onClick={() => setShowMarketChoiceModal(true)}
          uk-tooltip={`title: ${t.ctrlKToSelectMarkets}; pos: bottom; cls: uk-active hfi-yellow;`}
        >
          <span className="uk-tooltip-content hfi-yellow">ctrl-k</span>
        </div>
      )}

      <Button
        icon
        type="default"
        color="red"
        className="uk-margin-small-left"
        onClick={openSettingsModal}
        disabled={!connectedNetwork}
        noBorder={true}
        tooltip={{
          text: t.adjustSettings,
          position: "bottom",
        }}
      >
        <FontAwesomeIcon icon={["fal", "sliders-h"]} />
      </Button>

      <Button
        icon
        type="default"
        className={classNames("uk-margin-small-left uk-margin-right")}
        onClick={() => setShowLanguages(true)}
        tooltip={{
          text: t.selectLanguage,
          position: "bottom",
        }}
      >
        <FontAwesomeIcon icon={["fal", "globe"]} />
      </Button>

      <div
        id={`desktop-${WALLET_BUTTON_GROUP_ID}`}
        className={classNames("hfi-button-collection", classes.powerTileButton)}
      >
        <DynamicWalletButton
          themeFile={getThemeFile(activeTheme)}
          isMobile={isMobile}
          setShowChooseWalletModal={setShowChooseWalletModal}
          showChooseWalletModal={showChooseWalletModal}
          onClick={onClickWalletButton}
        />

        <OctButton onClick={() => setShowOctModal(true)} />

        <SelectNetwork
          id="header-select-network"
          containerId="handle"
          dropdownClassName={classes.networkDropdown}
          wrapperClassName={classes.networkSelect}
          value={networkToBeDisplayed}
          onChange={onSwitchNetwork}
          showIconRight
          showIconButton
          dropdownOffset="10"
          dropdownPosition="bottom-right"
        />
      </div>

      {connectedAccount && <PowerTileWrapper />}

      <div className="modal-wrapper">
        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
        />
        <LanguagesModal
          isOpen={showLanguages}
          onClose={() => setShowLanguages(false)}
        />
        <ChooseWalletModal
          showChooseWalletModal={showChooseWalletModal}
          setShowChooseWalletModal={setShowChooseWalletModal}
          isMobile={isMobile}
          primaryColor={getThemeFile(activeTheme).primaryColor}
        />
        <OneClickTradingModal
          open={showOctModal}
          onClose={() => setShowOctModal(false)}
        />
      </div>
    </>
  );
};

export const getNetworkToBeDisplayed = (
  connection: Connection,
): NetworkDisplay => {
  if (connection.chain.isConnecting) {
    return "connecting...";
  }
  if (!connection.chain.isConnected) {
    return "disconnected";
  }
  return connection.chain.isSupportedNetwork
    ? connection.chain.network
    : "unsupported";
};
