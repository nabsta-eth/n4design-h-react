import * as React from "react";
import GasSettings from "../GasSettings/GasSettings";
import classNames from "classnames";
import classes from "./MobileSettings.module.scss";
import { useNavigate } from "react-router-dom";
import { useLanguageStore } from "../../context/Translation";
import ThemeChooser from "../ThemeChooser/ThemeChooser";
import { LayoutChooser } from "../LayoutChooser/LayoutChooser";
import { useUiStore } from "../../context/UserInterface";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";

type TabName = "gas" | "theme" | "layout";
type SettingsTab = {
  tab: TabName;
  tabName: string;
  active: boolean;
};

const MobileSettings = () => {
  const navigate = useNavigate();
  const { isLayoutSettingsOpen, setIsLayoutSettingsOpen } = useUiStore();
  const { t } = useLanguageStore();
  const title = t.settings;

  const tabs: SettingsTab[] = [
    {
      tab: "gas",
      tabName: t.gas,
      active: false,
    },
    {
      tab: "theme",
      tabName: t.theme,
      active: false,
    },
    {
      tab: "layout",
      tabName: t.layout,
      active: false,
    },
  ];

  const [activeTab, setActiveTab] = React.useState<TabName>(
    isLayoutSettingsOpen ? "layout" : "gas",
  );
  React.useEffect(() => {
    setIsLayoutSettingsOpen(activeTab === "layout");
    navigate(`/settings?tab=${activeTab}`, { replace: true });
  }, [activeTab]);

  return (
    <React.Fragment>
      <div
        className={classNames("uk-flex uk-flex-middle", classes.settingsHeader)}
      >
        <FontAwesomeIcon
          icon={["far", "chevron-left"]}
          className="uk-margin-small-right"
          onClick={() => navigate(-1)}
        />
        <h4 className="uk-margin-remove-vertical">{title}</h4>
      </div>

      <div className="uk-flex uk-flex-middle hfi-background settings-tabs tabs-class">
        {tabs.map(tab => (
          <div
            key={tab.tab}
            className={classNames(
              "uk-tab uk-flex uk-flex-center uk-flex-middle uk-flex-1",
              classes.tab,
              {
                [classes.active]: tab.tab === activeTab,
              },
            )}
            tabIndex={0}
            role="button"
            onClick={() => setActiveTab(tab.tab)}
          >
            <span>{tab.tabName}</span>
          </div>
        ))}
      </div>

      <div className={classNames(classes.mobileSettingsWrapper)}>
        <div className={classNames(classes.settingsPadding)}>
          {activeTab === "gas" && <GasSettings />}
        </div>

        {activeTab === "theme" && <ThemeChooser />}

        <div className={classes.settingsPadding}>
          {activeTab === "layout" && <LayoutChooser />}
        </div>
      </div>
    </React.Fragment>
  );
};

export default MobileSettings;
