import SafeProvider from "@gnosis.pm/safe-apps-react-sdk";
import { UserBalancesProvider } from "./context/UserBalances";
import { ProtocolProvider } from "./context/Protocol";
import { AccountProvider } from "./context/Account";
import { PricesProvider } from "./context/Prices";
import { TokenManagerProvider } from "./context/TokenManager";
import { TheController } from "./components";
import { UiProvider } from "./context/UserInterface";
import { TradeProvider } from "./context/Trade";
import { PositionsProvider } from "./context/Positions";
import { LoaderProvider } from "./context/Loader";
import { TranslationProvider } from "./context/Translation";
import { TermsAndConditionsProvider } from "./context/TermsAndCondtions";
import { BrowserRouter } from "react-router-dom";
import { TradePricesProvider } from "./context/TradePrices";
import { OrderProvider } from "./context/Orders";
import { DesktopOrMobile } from "./components/DesktopOrMobile";
import { MathisProvider } from "./context/Mathis";
import { ReferralProvider } from "./context/Referral";
import { TradeSizeProvider } from "./context/TradeSize";
import { PriceChartDataProvider } from "./context/PriceChartData";
import { HlpVaultBalanceProvider } from "./context/HlpVaultBalance";
import { FocusProvider } from "./context/Focus";
import { LocalStorageProvider } from "./context/LocalStorage";
import { TradeAccountDisplayProvider } from "./context/TradeAccountDisplay";
import { IncentivesProvider } from "./context/Incentives/Incentives";
import { PriceFeedProvider } from "./context/PriceFeed";
import { SpritesheetProvider } from "@handle-fi/react-components/dist/context/SpritesheetProvider";
import { DynamicUserWallet } from "@handle-fi/react-components/dist/context/DynamicUserWallet";

const App = () => (
  <LocalStorageProvider>
    <FocusProvider>
      <UiProvider>
        <SpritesheetProvider>
          <LoaderProvider>
            <TranslationProvider>
              <SafeProvider>
                <DynamicUserWallet>
                  <BrowserRouter>
                    <ReferralProvider>
                      <AccountProvider>
                        <TermsAndConditionsProvider>
                          <TokenManagerProvider>
                            <UserBalancesProvider>
                              <ProtocolProvider>
                                <PriceFeedProvider>
                                  <PricesProvider>
                                    <TradeProvider>
                                      <OrderProvider>
                                        <TradePricesProvider>
                                          <TheController>
                                            <PositionsProvider>
                                              <MathisProvider>
                                                <TradeSizeProvider>
                                                  <TradeAccountDisplayProvider>
                                                    <PriceChartDataProvider>
                                                      <HlpVaultBalanceProvider>
                                                        <IncentivesProvider>
                                                          <DesktopOrMobile />
                                                        </IncentivesProvider>
                                                      </HlpVaultBalanceProvider>
                                                    </PriceChartDataProvider>
                                                  </TradeAccountDisplayProvider>
                                                </TradeSizeProvider>
                                              </MathisProvider>
                                            </PositionsProvider>
                                          </TheController>
                                        </TradePricesProvider>
                                      </OrderProvider>
                                    </TradeProvider>
                                  </PricesProvider>
                                </PriceFeedProvider>
                              </ProtocolProvider>
                            </UserBalancesProvider>
                          </TokenManagerProvider>
                        </TermsAndConditionsProvider>
                      </AccountProvider>
                    </ReferralProvider>
                  </BrowserRouter>
                </DynamicUserWallet>
              </SafeProvider>
            </TranslationProvider>
          </LoaderProvider>
        </SpritesheetProvider>
      </UiProvider>
    </FocusProvider>
  </LocalStorageProvider>
);

export default App;
