import * as React from "react";
import { Footer } from "../components";
import useSetAccount from "../hooks/useSetAccount";
import { Container } from "@handle-fi/react-components/dist/components/handle_uikit/components/Container";
import { useReducer } from "react";
import Navbar from "../components/Governance/Navbar";
import LPStakingPoolManagement from "../components/Governance/LPStakingPoolManagement";
import SingleCollateralVaultManagement from "../components/Governance/SingleCollateralVaultManagement";
import RewardBoosts from "../components/Governance/RewardBoosts";
import FeeTracker from "../components/Governance/FeeTracker";
import HlpConfig from "../components/Governance/HlpConfig";
import FundMonitor from "../components/Governance/FundMonitor";
import RewardPools from "../components/Governance/RewardPools";
import Tokens from "../components/Governance/Tokens";
import HlpLoanCalculator from "../components/Governance/HlpLoanCalculator";
import PortfolioViewer from "../components/Governance/PortfolioViewer";
import TradeAccounts from "../components/Governance/TradeAccounts";
import { useUiStore } from "../context/UserInterface";

export type GovernanceRoute = {
  component: React.FC;
  name: string;
};

const setRoute = (route: string | undefined) => {
  window.location.hash = route ? encodeURI(route) : "";
  return route;
};

const DEFAULT_INITIAL_ROUTE = RewardPools.name;

const routes = [
  RewardPools,
  RewardBoosts,
  HlpConfig,
  FundMonitor,
  FeeTracker,
  LPStakingPoolManagement,
  SingleCollateralVaultManagement,
  Tokens,
  HlpLoanCalculator,
  PortfolioViewer,
  TradeAccounts,
];
const mobileRoutes = [TradeAccounts];

const getInitialRoute = (routes: string[]) => {
  const hash = decodeURI(window.location.hash);
  // The value of `hash` must start with # if not empty.
  const route = hash.length > 1 ? hash.substring(1) : "";
  const isRouteValid =
    route.length > 0 &&
    window.location.hash.length > 0 &&
    routes.includes(route);
  if (isRouteValid) return route;
  return DEFAULT_INITIAL_ROUTE;
};

const Governance: React.FC = () => {
  useSetAccount();
  const { isMobile } = useUiStore();
  const routeNames = (isMobile ? mobileRoutes : routes).map(
    route => route.name,
  );
  const [routeName, setRouteName] = useReducer(
    (_?: string, route?: string) => setRoute(route),
    getInitialRoute(routeNames),
    setRoute,
  );
  const RouteComponent = (() => {
    const Component = routes.find(route => route.name === routeName)?.component;
    return Component ? <Component /> : <></>;
  })();
  return (
    <div>
      <Container size="small">
        <Navbar
          className={`${
            isMobile ? "uk-margin-top uk-margin-small-bottom" : undefined
          }`}
          onNavigate={setRouteName}
          routes={routeNames}
          selectedRoute={routeName}
        />
        {RouteComponent}
      </Container>
      {!isMobile && <Footer />}
    </div>
  );
};

export default Governance;
