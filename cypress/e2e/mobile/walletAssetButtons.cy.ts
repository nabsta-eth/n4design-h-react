describe("Mobile check operation of send and convert button for wallet asset", () => {
  it("should show the send tokens screen for fxUSD", () => {
    cy.setupMobile();
    cy.connectTestWalletMobile();

    // click dash button in bottom taskbar
    cy.get("[id^=taskbar-menu-dashboard-button]").click();

    // click the assets tile
    cy.get(".wallet-assets").click();

    // Click the fxUSD send button
    cy.get("#fxUSD-send-button").click();

    // Check send route header
    cy.get("#send-tokens-header")
      .should("contain", "send")
      .and("contain", "fxUSD");
  });

  it("should show the convert screen with fxUSD from token", () => {
    cy.setupMobile();
    cy.connectTestWalletMobile();

    // click dash button in bottom taskbar
    cy.get("[id^=taskbar-menu-dashboard-button]").click();

    // click the assets tile
    cy.get(".wallet-assets").click();

    // Click the fxUSD convert button
    cy.get("#fxUSD-convert-button").click();

    // Check from token
    cy.get("#select-convert-token-sell-wrapper .hfi-select input").should(
      "have.value",
      "fxUSD handleUSD",
    );
  });
});
