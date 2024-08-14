import { FC, Fragment } from "react";
import { BottomTaskbar, TopTaskbar } from ".";
import { ErrorBoundary } from "react-error-boundary";
import TermsAndConditionsModal from "./TermsAndConditionsModal";
import { AppError } from "./AppError";
import { useMathisStore } from "../context/Mathis";
import classNames from "classnames";
import { useUiMobileStore } from "../context/UserInterfaceMobile";
import { useLocation } from "react-router";

const LayoutMobile: FC = props => {
  const { isChatInputFocussed } = useMathisStore();
  const { verticalSwipeIndex } = useUiMobileStore();
  const activePath = useLocation().pathname;
  const isMobileHome = activePath === "/";
  const isChooseWallet = activePath.includes("choosewallet");
  const showTopTaskbar =
    !isChatInputFocussed &&
    (!isMobileHome || verticalSwipeIndex === 0) &&
    !isChooseWallet;
  const showBottomTaskbar = !isChatInputFocussed;
  return (
    <Fragment>
      {showTopTaskbar && <TopTaskbar />}
      <div
        className={classNames("mobile uk-overflow-hidden", {
          "show-top-taskbar": showTopTaskbar,
          "show-bottom-taskbar": showBottomTaskbar,
        })}
      >
        <TermsAndConditionsModal />
        <ErrorBoundary FallbackComponent={AppError}>
          {props.children}
        </ErrorBoundary>
      </div>
      {showBottomTaskbar && <BottomTaskbar />}
    </Fragment>
  );
};

export default LayoutMobile;
