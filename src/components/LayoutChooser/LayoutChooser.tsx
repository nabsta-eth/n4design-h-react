import React from "react";
import { useUiStore } from "../../context/UserInterface";
import { Checkbox } from "@handle-fi/react-components/dist/components/handle_uikit/components/Form/Checkbox";
import { useLanguageStore } from "../../context/Translation";
import classNames from "classnames";

type Layout = "desktop" | "mobile";
export const LayoutChooser = () => {
  const { isUserLayoutMobile, setIsUserLayoutMobile, isMobile } = useUiStore();
  const { t } = useLanguageStore();

  const setLayoutInternal = (value: Layout) => {
    const isNewUserLayoutMobile = value === "mobile";
    setIsUserLayoutMobile(isNewUserLayoutMobile);
  };

  return (
    <div className="uk-flex uk-flex-middle uk-margin-small-top">
      <div className={classNames({ "uk-margin-xsmall-top": isMobile })}>
        <label className="uk-flex uk-flex-middle">
          <Checkbox
            className="uk-margin-small-right"
            name="layout-desktop-checkbox"
            checked={!isUserLayoutMobile}
            onChange={() => setLayoutInternal("desktop")}
          />
          {t.desktop}
        </label>
        <label className="uk-flex uk-flex-middle uk-margin-top">
          <Checkbox
            className="uk-margin-small-right"
            name="layout-mobile-checkbox"
            checked={isUserLayoutMobile}
            onChange={() => setLayoutInternal("mobile")}
          />
          {t.mobile}
        </label>
      </div>
    </div>
  );
};
