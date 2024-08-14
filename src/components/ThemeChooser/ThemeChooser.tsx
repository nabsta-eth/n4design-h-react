import classNames from "classnames";
import { MODERN_THEME_NAME_SUFFIX, BASE_THEMES } from "../../config/constants";
import { useUiStore } from "../../context/UserInterface";
import { Theme } from "../../types/theme";
import { getUkTooltip } from "../../utils/general";
import classes from "./ThemeChooser.module.scss";
import { Checkbox } from "@handle-fi/react-components/dist/components/handle_uikit/components/Form/Checkbox";
import { useLanguageStore } from "../../context/Translation";

const ThemeChooser = () => {
  const {
    activeTheme,
    setActiveTheme,
    isMobile,
    isModernTheme,
    setIsModernTheme,
  } = useUiStore();
  const { t } = useLanguageStore();

  const onToggleModernTheme = () => {
    const newTheme = isModernTheme
      ? activeTheme.replace(MODERN_THEME_NAME_SUFFIX, "")
      : `${activeTheme}${MODERN_THEME_NAME_SUFFIX}`;
    setActiveTheme(newTheme);
    setIsModernTheme(!isModernTheme);
  };

  const baseTheme = activeTheme.replace(MODERN_THEME_NAME_SUFFIX, "");

  return (
    <div className={classNames("uk-width-expand", classes.wrapper)}>
      {BASE_THEMES.map((theme: Theme) => (
        <div
          key={theme}
          className={classNames(
            "uk-flex uk-flex-between uk-flex-middle",
            classes.themeWrapper,
            {
              [classes.active]: baseTheme === theme,
            },
          )}
          uk-tooltip={getUkTooltip({
            title: t.selectTheme,
            position: "bottom",
            hide: isMobile || baseTheme === theme,
          })}
          onClick={
            baseTheme === theme
              ? undefined
              : () => {
                  setActiveTheme(
                    `${theme}${isModernTheme ? MODERN_THEME_NAME_SUFFIX : ""}`,
                  );
                }
          }
        >
          <span>{theme}</span>
          <div className={classNames("uk-flex", classes.colourGrid)}>
            <span
              className={classNames(
                classes.colouredBoxBackground,
                classes[theme],
              )}
            />
            <span
              className={classNames(classes.colouredBoxPrimary, classes[theme])}
            />
            <span
              className={classNames(classes.colouredBoxUp, classes[theme])}
            />
            <span
              className={classNames(classes.colouredBoxDown, classes[theme])}
            />
            <span
              className={classNames(
                classes.colouredBoxSecondary,
                classes[theme],
              )}
            />
            <span
              className={classNames(
                classes.colouredBoxTertiary,
                classes[theme],
              )}
            />
          </div>
        </div>
      ))}

      <div
        className={classNames(
          "uk-flex uk-flex-1 uk-flex-between uk-flex-middle uk-width-expand",
          classes.checkboxWrapper,
        )}
        uk-tooltip={getUkTooltip({
          title: t.chooseModernOrClassicVersion,
          position: "bottom",
          hide: isMobile,
        })}
      >
        <span>{t.modern}</span>
        <Checkbox
          className={classNames(
            "uk-margin-small-left uk-display-block",
            classes.checkbox,
          )}
          checked={isModernTheme}
          onChange={() => onToggleModernTheme()}
        />
      </div>

      <div
        className={classNames(
          "uk-flex uk-flex-1 uk-flex-right uk-width-expand hfi-warning",
          classes.betaWarning,
        )}
      >
        <span>{t.beta}</span>
      </div>
    </div>
  );
};

export default ThemeChooser;
