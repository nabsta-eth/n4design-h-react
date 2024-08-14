describe("Desktop market list & charts integration", () => {
  it("should show chart, form and browser tab title for BTC/USD, then switch to chart, form and browser tab title for ETH/USD", () => {
    // run as desktop
    cy.setupDesktop();
    // select default tab
    cy.get(".eth-usd-tab").click();
    // click BTC/USD pair in markets list
    cy.get(".market-pair-btc-usd").click();

    // check if tab visible and selected
    cy.testTradeChartTabVisibility("BTC/USD");
    // check if form has BTC/USD selected
    cy.testTradeFormInputValue("BTC/USD", "tab");
    // check if browser tab has BTC/USD displayed
    cy.title().should("include", "BTCUSD");

    // click ETH/USD tab
    cy.get(".eth-usd-tab").click();

    cy.testTradeChartTabVisibility("ETH/USD");
    // check if form has ETH/USD selected
    cy.testTradeFormInputValue("ETH/USD", "tab");
    // check if browser tab has ETH/USD displayed
    cy.title().should("include", "ETHUSD");
  });
});
