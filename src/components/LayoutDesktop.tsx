import React from "react";
import { Header, Footer } from ".";
import DevPanel from "./DevPanel/DevPanel";
import { ErrorBoundary } from "react-error-boundary";
import classNames from "classnames";
import ColouredScrollbars from "./ColouredScrollbars";
import TermsAndConditionsModal from "./TermsAndConditionsModal";
import Trade from "../navigation/Trade";
import { AppError } from "./AppError";
import { useAccountChangeClearVaults } from "../hooks/useAccountChangeClearVaults";
import { useLocation } from "react-router-dom";

const LayoutDesktop: React.FC = props => {
  useAccountChangeClearVaults();
  const isTradePopout = useLocation().pathname.includes("popout");

  return (
    <ColouredScrollbars universal style={{ height: "100vh" }}>
      <div
        className={classNames("uk-height-viewport uk-overflow-hidden", {
          "show-header show-footer": !isTradePopout,
        })}
      >
        {!isTradePopout && <Header />}
        <DevPanel />
        <TermsAndConditionsModal />
        <ErrorBoundary FallbackComponent={AppError}>
          {props.children}
          {!isTradePopout && <Trade />}
        </ErrorBoundary>
        {!isTradePopout && <Footer />}
      </div>
    </ColouredScrollbars>
  );
};

export default LayoutDesktop;
