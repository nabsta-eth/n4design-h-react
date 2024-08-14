import { DashboardTilesProvider } from "../context/DashboardTiles";
import { EarnProvider } from "../context/Earn";
import { OpenModalsProvider } from "@handle-fi/react-components/dist/context/OpenModals";
import { ReferralProvider } from "../context/Referral";
import { TradeLayoutProvider } from "../context/TradeLayout";
import { VaultsProvider } from "../context/Vaults";
import { NavigationDesktop } from "../navigation/NavigationDesktop";
import LayoutDesktop from "./LayoutDesktop";

export const DesktopProviders = () => (
  <VaultsProvider>
    <TradeLayoutProvider>
      <LayoutDesktop>
        <OpenModalsProvider>
          <ReferralProvider>
            <EarnProvider>
              <DashboardTilesProvider>
                <NavigationDesktop />
              </DashboardTilesProvider>
            </EarnProvider>
          </ReferralProvider>
        </OpenModalsProvider>
      </LayoutDesktop>
    </TradeLayoutProvider>
  </VaultsProvider>
);
