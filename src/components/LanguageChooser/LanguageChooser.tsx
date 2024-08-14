import classNames from "classnames";
import * as React from "react";
import { useLanguageStore } from "../../context/Translation";
import Button from "../Button";
import classes from "./LanguageChooser.module.scss";
import { Language } from "../../types/translation";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";

type Props = {
  isMobile?: boolean;
  onClose?: () => void;
};

const LanguagesModal: React.FC<Props> = ({ isMobile, onClose }) => {
  const { languages, t, language, setLanguage } = useLanguageStore();

  const setLanguageInternal = (lang: Language) => {
    setLanguage(lang);
    if (onClose) onClose();
  };

  return (
    <ul
      className={classNames("uk-nav uk-dropdown-nav handle-select", {
        [classes.mobileLanguagesNav]: isMobile,
      })}
    >
      {!isMobile && (
        <li
          className="uk-margin-small-bottom uk-h4"
          style={{ marginTop: "-4px" }}
        >
          <FontAwesomeIcon
            className="uk-margin-small-right"
            icon={["fal", "globe"]}
          />
          {t.chooseLanguage}
        </li>
      )}

      <li className="uk-nav-divider">
        <div
          className={classNames(
            "uk-flex uk-flex-wrap uk-padding-small uk-padding-remove-bottom uk-flex-between",
            classes.languages,
          )}
        >
          {languages.map(lang => (
            <Button
              key={lang.language}
              size="small"
              type="secondary"
              disabled={lang.language === language}
              className={classNames(
                "uk-flex uk-flex-middle",
                classes.languageButton,
                classes.lastLanguageButton,
              )}
              onClick={() => setLanguageInternal(lang.language)}
            >
              {lang.icon && (
                <span className="uk-margin-small-right uk-flex uk-flex-middle">
                  <img
                    width="20"
                    src={`/assets/flags/${lang.icon}`}
                    alt={lang.language}
                  />
                </span>
              )}
              {lang.languageDisplay}
            </Button>
          ))}
        </div>
      </li>
    </ul>
  );
};

export default LanguagesModal;
