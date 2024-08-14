import { Button } from "@handle-fi/react-components/dist/components/handle_uikit/components/Button";
import { useConnectedAccount } from "@handle-fi/react-components/dist/context/UserWallet";
import classNames from "classnames";
import classes from "./OctButton.module.scss";
import { useLanguageStore } from "../../context/Translation";
import { useOneClickTrading } from "../../hooks/useOneClickTrading";
import FontAwesomeIcon from "@handle-fi/react-components/dist/components/FontAwesomeIcon";
import { useTrade } from "../../context/Trade";
import { useUiStore } from "../../context/UserInterface";

export const OctButton = ({
  show,
  onClick,
}: {
  show?: boolean;
  onClick: (show: boolean) => void;
}) => {
  const { isMobile } = useUiStore();
  const connectedAccount = useConnectedAccount();
  const { account: tradeAccount } = useTrade();
  const { t } = useLanguageStore();
  const shouldShowOneClickTradingButton = !!connectedAccount;
  const { isOneClickTradingActive } = useOneClickTrading();
  const onOrOffText = isOneClickTradingActive
    ? t.on.toLocaleUpperCase()
    : t.off.toLocaleUpperCase();
  return (
    <Button
      icon
      type={show ? "primary" : "secondary"}
      disabled={
        !connectedAccount ||
        !shouldShowOneClickTradingButton ||
        !tradeAccount?.id
      }
      className={classNames(
        "hfi-powertile-button",
        classes.topRightLabelWrapper,
      )}
      onClick={onClick}
      tooltip={
        isMobile
          ? undefined
          : {
              text: show
                ? t.toggleShowConfigureOct
                : t.configureOneClickTradingTooltip.replace(
                    "#octStatus#",
                    onOrOffText,
                  ),
              position: "bottom-right",
              classes: isOneClickTradingActive && !show ? "hfi-yellow" : "",
            }
      }
    >
      <DynamicOneClickTradingIcon hasLabelWrapper />
    </Button>
  );
};

export type DynamicOneClickTradingIconProps = {
  hasLabelWrapper?: boolean;
  className?: string;
  isMobile?: boolean;
};

export const DynamicOneClickTradingIcon = ({
  hasLabelWrapper,
  className,
  isMobile,
}: DynamicOneClickTradingIconProps) => {
  const { isOneClickTradingActive } = useOneClickTrading();
  const { t } = useLanguageStore();
  const icon = (
    <>
      <FontAwesomeIcon
        className={classNames(classes.solidFa, className)}
        icon={["fas", "bolt"]}
      />
      {isOneClickTradingActive ? (
        <div className={classes.label}>{t.on.toLocaleUpperCase()}</div>
      ) : (
        <></>
      )}
    </>
  );
  if (hasLabelWrapper) {
    return icon;
  }
  return (
    <div
      className={classNames(classes.topRightLabelWrapper, {
        [classes.mobile]: isMobile,
      })}
    >
      {icon}
    </div>
  );
};
