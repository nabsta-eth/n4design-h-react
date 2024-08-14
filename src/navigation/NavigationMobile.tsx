import { Route, Navigate } from "react-router-dom";
import MobileWallet from "../components/Mobile/MobileWallet";
import MobileSettings from "../components/Mobile/MobileSettings";
import MobileSendTokens from "../components/Mobile/MobileSendTokens";
import MobileSharePosition from "../components/Mobile/MobileSharePosition";
import MobileClosePosition from "../components/Mobile/MobileClosePosition";
import MobileShowPosition from "../components/Mobile/MobileShowPosition";
import MobileChat from "../components/Mobile/MobileChat";
import MobileChooseWallet from "../components/Mobile/MobileChooseWallet";
import MobileLanguages from "../components/Mobile/MobileLanguages";
import SlideRoutes from "react-slide-routes";
import { mobileMenu } from "../components/Mobile/MobileMenu";
import "../assets/styles/slideroutes.scss";
import MobileTradeAccount from "../components/Mobile/MobileTradeAccount";
import Governance from "./Governance";
import MobileAssets from "../components/Mobile/MobileAssets";
import MobileTradingMode from "../components/Mobile/MobileTradingMode";
import { EnableDynamicSandbox } from "./EnableDynamicSandbox";
import React from "react";

// SlideRoutes is a package component that allows you to swipe between routes.
// mobileMenu contains the ones in the BottomTaskbar.
// The other routes are those that are not in the BottomTaskbar
// but are ancillary or subordinate routes reached through TopTaskbar
// or other action buttons.
export const NavigationMobile = () => {
  return (
    <SlideRoutes destroy={false}>
      <Route path="*" element={<Navigate to="/" />} />
      {/*
        these routes need to be rendered first because they are
        potentially used from all menu bar routes,
        otherwise the swiping to return from them does not work.
      */}
      <Route path="/chat" element={<MobileChat />} />
      <Route path="/choosewallet" element={<MobileChooseWallet />} />
      {mobileMenu.map(mobileMenuItem => (
        <Route
          path={`/${mobileMenuItem.title}`}
          key={mobileMenuItem.title}
          element={mobileMenuItem.component}
        />
      ))}
      <Route path="/settings" element={<MobileSettings />} />
      <Route path="/sendtokens" element={<MobileSendTokens />} />
      <Route path="/shareposition" element={<MobileSharePosition />} />
      <Route path="/closeposition" element={<MobileClosePosition />} />
      <Route path="/showposition" element={<MobileShowPosition />} />
      <Route path="/language" element={<MobileLanguages />} />
      <Route path="/oct" element={<MobileTradingMode />} />
      <Route path="/account" element={<MobileTradeAccount />} />
      <Route path="/assets" element={<MobileAssets />} />
      {/*
        This is necessary for the governance page
        to work for transferring out used test account
      */}
      <Route path="/gov" element={<Governance />} />
      <Route path="/dynamic-sandbox" element={<EnableDynamicSandbox />} />
    </SlideRoutes>
  );
};
