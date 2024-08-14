import classNames from "classnames";
import * as React from "react";
import { useLocation } from "react-router-dom";
import { useLanguageStore } from "../../context/Translation";
import Modal from "@handle-fi/react-components/dist/components/Modal";
import GasSettings from "../GasSettings/GasSettings";
import ThemeChooser from "../ThemeChooser/ThemeChooser";
import { TradeSettings } from "../TradeSettings/TradeSettings";
import classes from "./SettingsModal.module.scss";
import { useMemo } from "react";
import { LayoutChooser } from "../LayoutChooser/LayoutChooser";
import { useUiStore } from "../../context/UserInterface";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import { BASE_THEMES } from "../../config/constants";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

type TabName = "gas" | "theme" | "trade" | "layout";
type SettingsTab = {
  tab: TabName;
  tabName: string;
  active: boolean;
  disabled: boolean;
  component: React.ReactNode;
};

const NUM_THEMES = BASE_THEMES.length;
// This is used to fix the settings height
// to be consistent across all tabs.
// Because themes is the largest,
// the height is set based upon the number of themes
// (51px per theme),
// the "modern", checkbox (51px),
// and the "beta" warning + padding (36px).
const THEMES_HEIGHT = (NUM_THEMES + 1) * 51 + 36;

const SettingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { isLayoutSettingsOpen, setIsLayoutSettingsOpen } = useUiStore();
  const activePath = useLocation().pathname;
  const { t } = useLanguageStore();
  const { showChooseWalletModal } = useUiStore();

  const tabs: SettingsTab[] = [
    {
      tab: "theme",
      tabName: t.theme,
      active: false,
      disabled: false,
      component: <ThemeChooser />,
    },
    {
      tab: "gas",
      tabName: t.gas,
      active: true,
      disabled: false,
      component: <GasSettings />,
    },
    {
      tab: "trade",
      tabName: t.trade,
      active: false,
      disabled: activePath !== "/trade",
      component: <TradeSettings />,
    },
    {
      tab: "layout",
      tabName: t.layout,
      active: false,
      disabled: false,
      component: <LayoutChooser />,
    },
  ];

  const [activeTab, setActiveTab] = React.useState<TabName>(
    isLayoutSettingsOpen ? "layout" : "theme",
  );

  const setActiveTabInternal = (tab: TabName) => {
    setIsLayoutSettingsOpen(tab === "layout");
    setActiveTab(tab);
  };

  const tabComponent = useMemo(
    () => tabs.find(({ tab }) => tab === activeTab)?.component,
    [activeTab],
  );

  return (
    <Modal
      show={isOpen}
      onClose={onClose}
      showChooseWalletModal={showChooseWalletModal}
    >
      <ul className="uk-nav uk-dropdown-nav handle-select">
        <li
          className="uk-margin-small-bottom uk-h4"
          style={{ marginTop: "-4px" }}
        >
          <FontAwesomeIcon
            className="hfi-error uk-margin-small-right"
            icon={["fal", "sliders-h"]}
          />
          {t.settings}
        </li>

        <li className="uk-nav-divider"></li>

        <li>
          <div className="uk-grid uk-grid-small uk-height-1-1">
            <div
              className={classNames("uk-flex uk-flex-column", classes.leftTabs)}
              style={{ height: THEMES_HEIGHT }}
            >
              <ul className="uk-tab uk-tab-left">
                {tabs.map(tab => (
                  <li
                    key={tab.tab}
                    className={classNames("uk-flex uk-flex-right", {
                      "uk-active": tab.tab === activeTab,
                      "uk-disabled": tab.disabled,
                    })}
                  >
                    <span
                      onClick={
                        tab.tab !== activeTab && !tab.disabled
                          ? () => setActiveTabInternal(tab.tab)
                          : undefined
                      }
                    >
                      {tab.tabName}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            {tabComponent}
          </div>
        </li>
      </ul>
    </Modal>
  );
};

export default SettingsModal;
