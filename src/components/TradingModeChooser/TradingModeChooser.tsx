import { useLanguageStore } from "../../context/Translation";
import { useOneClickTrading } from "../../hooks/useOneClickTrading";
import { useState } from "react";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import classNames from "classnames";
import classes from "./TradingModeChooser.module.scss";
import { useUiStore } from "../../context/UserInterface";
import Loader from "@handle-fi/react-components/dist/components/Loader";
import { getThemeFile } from "../../utils/ui";
import { Button } from "@handle-fi/react-components/dist/components/handle_uikit/components/Button";

export type TradingModeChooserProps = {
  onClose?: () => void;
  isModal?: boolean;
  hideHeader?: boolean;
};

export const TradingModeChooser = ({
  onClose,
  isModal,
  hideHeader,
}: TradingModeChooserProps) => {
  const { t } = useLanguageStore();
  const { isMobile } = useUiStore();
  const {
    isOneClickTradingActive,
    enableOneClickTrading,
    disableOneClickTrading,
  } = useOneClickTrading();
  const onInUppercase = t.on.toLocaleUpperCase();
  const [isProcessingEnableCounter, setIsProcessingEnableCounter] = useState(0);
  const oneClickTradingOnStatusToDisplay = isOneClickTradingActive
    ? onInUppercase
    : t.turnOn;
  const oneClickTradingOffStatusToDisplay = isOneClickTradingActive
    ? t.turnOff
    : onInUppercase;
  const header = (
    <>
      <div className={classNames({ "uk-margin-xsmall-bottom uk-h4": isModal })}>
        {!hideHeader && (
          <div className="uk-flex uk-flex-middle uk-flex-between">
            <div>
              {!isModal && !isMobile && (
                <FontAwesomeIcon
                  className={classes.leftIcon}
                  icon={["far", "chevron-left"]}
                  onClick={onClose}
                />
              )}
              <FontAwesomeIcon
                className="uk-margin-small-right"
                icon={["fal", "bolt"]}
                style={{ fontWeight: "bold" }}
              />
              {t.oneClickTradingModalTitle}
            </div>
            {!isModal && isMobile && (
              <FontAwesomeIcon
                className="cursor-pointer"
                icon={["far", "chevron-down"]}
                onClick={onClose}
              />
            )}
          </div>
        )}
      </div>
    </>
  );
  return (
    <div
      className={classNames("uk-nav uk-dropdown-nav handle-select", {
        "uk-margin-small-top": !isModal,
        "uk-margin-xsmall-top": hideHeader,
      })}
    >
      {header}
      <div
        className={classNames(classes.cardWrapper, {
          [classes.mobile]: isMobile,
        })}
      >
        <Card
          title={
            <div
              className={classNames("uk-flex uk-flex-middle", classes.title)}
            >
              <FontAwesomeIcon
                icon={["fal", "bolt"]}
                style={{ fontWeight: "bold" }}
              />
            </div>
          }
          suggestion={<Suggestion />}
          header={t.oneClickTrading}
          items={[t.seamlessTrading, t.walletStoredLocally]}
          footerRightLabel={oneClickTradingOnStatusToDisplay}
          isProcessing={isProcessingEnableCounter > 0}
        />

        <Card
          title={
            <div
              className={classNames("uk-flex uk-flex-middle", classes.title)}
            >
              <FontAwesomeIcon
                icon={["fas", "key"]}
                style={{ fontWeight: "bold" }}
              />
              <span className="uk-margin-small-left"></span>
            </div>
          }
          header={t.signEveryTransaction}
          items={[t.useYourOwnWallet]}
          footerRightLabel={oneClickTradingOffStatusToDisplay}
        />
      </div>
      <div
        className={classNames(
          classes.buttonWrapper,
          "hfi-button-collection uk-width-expand",
          { [classes.mobile]: isMobile },
        )}
      >
        <Button
          type="primary"
          className="hfi-powertile-button uk-width-expand uk-margin-small-top"
          disabled={isOneClickTradingActive}
          active={isOneClickTradingActive}
          onClick={() => {
            setIsProcessingEnableCounter(c => c + 1);
            enableOneClickTrading()
              .then(didSucceed => {
                if (didSucceed) {
                  onClose?.();
                }
              })
              .finally(() => setIsProcessingEnableCounter(c => c - 1));
          }}
        >
          {oneClickTradingOnStatusToDisplay}
        </Button>
        <Button
          type="primary"
          disabled={!isOneClickTradingActive}
          active={!isOneClickTradingActive}
          className="hfi-powertile-button uk-width-expand uk-margin-small-top"
          onClick={() => {
            disableOneClickTrading();
            onClose?.();
          }}
        >
          {oneClickTradingOffStatusToDisplay}
        </Button>
      </div>
    </div>
  );
};

type CardProps = {
  title: string | JSX.Element;
  header: string | JSX.Element;
  items: string[];
  footerRightLabel: string;
  suggestion?: JSX.Element;
  isProcessing?: boolean;
  onClick?: () => void;
};

const Card = ({
  title,
  header,
  items,
  footerRightLabel,
  suggestion,
  isProcessing,
  onClick,
}: CardProps) => {
  const { activeTheme } = useUiStore();
  const footer = isProcessing ? (
    <Loader color={getThemeFile(activeTheme).backgroundColor} />
  ) : (
    <b>{footerRightLabel}</b>
  );
  return (
    <>
      <div className={classNames("uk-card", classes.card)} onClick={onClick}>
        {suggestion && <div className={classes.suggestion}>{suggestion}</div>}
        <div className={classes.content}>
          <div className={classes.title}>{title}</div>
          <div className={classes.header}>{header}</div>
          <ul className={classes.items}>
            {items.map(item => (
              <li key={item} className={classNames(classes.item)}>
                <span className="fa-li">
                  <i className="fas fa-check" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
};

const Suggestion = () => {
  const { t } = useLanguageStore();
  return (
    <div className="uk-flex uk-flex-right uk-width-expand">
      <div className={classNames(classes.suggestionWrapper)}>
        <FontAwesomeIcon icon={["fas", "check"]} />
        <span className="uk-margin-small-left">{t.suggested}</span>
      </div>
    </div>
  );
};
