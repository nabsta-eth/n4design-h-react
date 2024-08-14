import classNames from "classnames";
import * as React from "react";
import { useLanguageStore } from "../../context/Translation";
import classes from "./MobileLanguages.module.scss";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import { useNavigate } from "react-router-dom";
import LanguageChooser from "../LanguageChooser/LanguageChooser";

const MobileLanguages = () => {
  const navigate = useNavigate();
  const { t } = useLanguageStore();

  return (
    <React.Fragment>
      <div
        className={classNames(
          "uk-flex uk-flex-middle",
          classes.languagesHeader,
        )}
      >
        <FontAwesomeIcon
          icon={["far", "chevron-left"]}
          className="uk-margin-small-right"
          onClick={() => navigate(-1)}
        />
        <h4 className="uk-margin-remove-vertical">{t.chooseLanguage}</h4>
      </div>

      <LanguageChooser isMobile />
    </React.Fragment>
  );
};

export default MobileLanguages;
