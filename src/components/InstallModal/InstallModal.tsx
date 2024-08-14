import * as React from "react";
import classes from "./InstallModal.module.scss";
import classNames from "classnames";
import { useUiStore } from "../../context/UserInterface";
import Modal from "@handle-fi/react-components/dist/components/Modal";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import MaterialDesignIcon from "@handle-fi/react-components/dist/components/MaterialDesignIcon";
import {
  hasInstallModalBeenDisplayedLocalStorage,
  isInstalledPwaLocalStorage,
} from "../../utils/local-storage";
import { useLanguageStore } from "../../context/Translation";
import { isWithinGnosisApp } from "@handle-fi/react-components/dist/utils/web3";

const InstallModal: React.FC = () => {
  const {
    isStandalone,
    isMobile,
    showChooseWalletModal,
    isDarkMode,
    browser,
    isAndroid,
    isIos,
  } = useUiStore();
  const { t } = useLanguageStore();
  const [showInstallModal, setShowInstallModal] =
    React.useState<boolean>(false);
  const hasInstallModalBeenDisplayed =
    hasInstallModalBeenDisplayedLocalStorage.get();
  const isInstalledPwa = isInstalledPwaLocalStorage.get();

  const isMobileIosSafari = isIos && browser === "safari";
  const isMobileAndroidChrome = isAndroid && browser === "chrome";
  const isDesktopChrome = !isMobile && browser === "chrome";
  const isDesktopEdge = !isMobile && browser === "edge";
  const isDesktopBrave = !isMobile && browser === "brave";

  React.useEffect(() => {
    const isInstallableBrowser =
      !isWithinGnosisApp() &&
      (isMobileIosSafari ||
        isMobileAndroidChrome ||
        isDesktopChrome ||
        isDesktopEdge ||
        isDesktopBrave);

    setShowInstallModal(
      !isStandalone &&
        !hasInstallModalBeenDisplayed &&
        !isInstalledPwa &&
        isInstallableBrowser &&
        !showChooseWalletModal,
    );
  }, [
    hasInstallModalBeenDisplayed,
    isStandalone,
    isInstalledPwa,
    showChooseWalletModal,
  ]);

  const installText = isMobileIosSafari
    ? "adding the app to your home screen"
    : "installing the app";
  const mobileInstallIcon = isMobileIosSafari
    ? "arrow-up-from-square"
    : "ellipsis-vertical";
  const desktopInstallIcon = isDesktopEdge
    ? "dashboard_customize"
    : "install_desktop";
  const installBoxText = isMobileIosSafari
    ? "Add to Home Screen"
    : "Install app";

  const onClose = () => {
    setShowInstallModal(false);
    hasInstallModalBeenDisplayedLocalStorage.set(true);
  };

  return (
    <Modal
      show={showInstallModal}
      showChooseWalletModal={showChooseWalletModal}
      classes={classNames("install-cta-modal", classes.modal, {
        [classes.iosSafari]: isMobileIosSafari,
        [classes.androidChrome]: isMobileAndroidChrome,
        [classes.desktop]: !isMobile,
        [classes.desktopChrome]: isDesktopChrome,
        [classes.desktopBrave]: isDesktopBrave,
        [classes.desktopEdge]: isDesktopEdge,
      })}
      onClose={onClose}
      title={"install"}
    >
      <div className="uk-flex uk-flex-column">
        <span>
          {`handle.fi app is optimised for ${
            isMobile ? "mobile" : "desktop"
          } so we recommend ${installText} for the best experience.`}
        </span>

        <span
          className={classNames(
            "uk-flex-center uk-flex uk-flex-middle uk-margin-top",
            {
              "uk-margin-bottom": isMobile,
            },
          )}
        >
          {`${isMobile ? t.tap : t.click} the `}
          <span
            className={classNames(
              classes.installIconBox,
              "uk-flex-center uk-flex uk-flex-middle uk-margin-small-left uk-margin-small-right",
              {
                "uk-margin-bottom uk-margin-top": isMobile,
                [classes.installIconBoxDark]: isDarkMode,
                [classes.installIconBoxLight]: !isDarkMode,
              },
            )}
          >
            {isMobile && (
              <FontAwesomeIcon
                className={classNames({
                  [classes.installIconIos]: isMobileIosSafari,
                  [classes.installIconDark]: !isMobileIosSafari && isDarkMode,
                  [classes.installIconLight]: !isMobileIosSafari && !isDarkMode,
                })}
                icon={["far", mobileInstallIcon]}
              />
            )}
            {!isMobile && (
              <MaterialDesignIcon
                className={classNames({
                  [classes.installIconIos]: isMobileIosSafari,
                  [classes.installIconDark]: isDarkMode,
                  [classes.installIconLight]: !isDarkMode,
                  [classes.installIconEdge]: isDesktopEdge,
                  [classes.installIconChrome]: isDesktopChrome,
                })}
                icon={desktopInstallIcon}
              />
            )}
          </span>
          {` icon ${isMobileIosSafari ? " below" : "above"}`}
        </span>

        {isMobile && (
          <React.Fragment>
            <span className="uk-flex-center uk-flex uk-flex-middle uk-margin-xsmall-bottom">
              {`scroll down and tap`}
            </span>

            <span
              className={classNames(
                "uk-flex uk-flex-middle uk-padding-small-left uk-padding-small-right",
                classes.installBox,
                {
                  [classes.installBoxDark]: isDarkMode,
                  [classes.installBoxLight]: !isDarkMode,
                  [classes.installBoxIos]: isMobileIosSafari,
                  [classes.installBoxAndroid]: isMobileAndroidChrome,
                },
              )}
            >
              {isMobileAndroidChrome && (
                <MaterialDesignIcon
                  className={classNames("uk-margin-small-right", {
                    [classes.installIconDark]: isDarkMode,
                    [classes.installIconLight]: !isDarkMode,
                  })}
                  icon="install_mobile"
                />
              )}
              {installBoxText}
              {isMobileIosSafari && (
                <FontAwesomeIcon
                  size="lg"
                  className={classNames("uk-margin-small-left", {
                    [classes.installIconDark]: isDarkMode,
                    [classes.installIconLight]: !isDarkMode,
                  })}
                  icon={["far", "plus-square"]}
                />
              )}
            </span>
          </React.Fragment>
        )}
      </div>
    </Modal>
  );
};

export default InstallModal;
