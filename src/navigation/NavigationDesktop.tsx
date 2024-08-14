import { Routes, Route, Navigate } from "react-router-dom";
import DashboardPage from "./Dashboard";
import Vault from "./Vault";
import Governance from "./Governance";
import Bridge from "./Bridge";
import Convert from "./Convert";
import Earn from "./Earn";
import React from "react";
import ReferralLinkGenerator from "./ReferralLinkGenerator";
import DashboardData from "./DashboardData";
import TradeForm from "../components/Trade/TradeForm/TradeForm";
import PopoutChart from "../components/Popout/PopoutChart";
import PopoutMarkets from "../components/Popout/PopoutMarkets";
import PopoutTrades from "../components/Popout/PopoutTrades";
import PopoutPositions from "../components/Popout/PopoutPositions";
import Account from "../components/Trade/TradeAccount/TradeAccount";
import PopoutPortfolio from "../components/Popout/PopoutPortfolio";
import { TradeLeaderboard } from "./TradeLeaderboard";
import { EnableDynamicSandbox } from "./EnableDynamicSandbox";

export const NavigationDesktop = () => {
  return (
    <Routes>
      <Route path="*" element={<Navigate to="/trade" />} />
      <Route path="/trade" element={<></>} />
      <Route path="/trade/leaderboard" element={<TradeLeaderboard />} />
      <Route path="/vaults/multi/:fxToken/:account">
        <Route path="/vaults/multi/:fxToken/:account" element={<Vault />} />
        <Route
          path="/vaults/multi/:fxToken/:account/:action"
          element={<Vault />}
        />
      </Route>
      <Route path="/borrow/multi/:fxToken/:account" element={<Vault />} />
      <Route path="/gov">
        <Route path="/gov" element={<Governance />} />
        <Route path="/gov/:account" element={<Governance />} />
      </Route>
      <Route path="/earn" element={<Earn />} />
      <Route path="/bridge" element={<Bridge />} />
      <Route path="/dashboard-data" element={<DashboardData />} />
      <Route path="/dashboard">
        <Route path="/dashboard" element={<DashboardPage />} />
        <React.Fragment>
          <Route path="/dashboard/:action" element={<DashboardPage />} />
          <Route
            path="/dashboard/:action/:account"
            element={<DashboardPage />}
          />
        </React.Fragment>
      </Route>
      <Route path="/referral" element={<ReferralLinkGenerator />} />
      <Route path="/convert" element={<Convert />} />
      <Route path="/popout">
        <Route path="/popout/trade" element={<TradeForm />} />
        <Route path="/popout/markets" element={<PopoutMarkets />} />
        <Route path="/popout/charts" element={<PopoutChart />} />
        <Route path="/popout/positions" element={<PopoutPositions />} />
        <Route path="/popout/trades" element={<PopoutTrades />} />
        <Route path="/popout/account" element={<Account />} />
        <Route path="/popout/portfolio" element={<PopoutPortfolio />} />
      </Route>
      <Route path="/dynamic-sandbox" element={<EnableDynamicSandbox />} />
    </Routes>
  );
};
