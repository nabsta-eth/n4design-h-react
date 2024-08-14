describe("Desktop check operation of send, convert & convert to hLP buttons for wallet asset", () => {
  it("should show the send tokens modal for fxUSD", () => {
    cy.setupDesktop();
    cy.connectTestWalletDesktop();

    // Click on dashboard in menu
    cy.get("#header-menu-dashboard").click();

    // Click the fxUSD send button
    cy.get("#fxUSD-send-button").click();

    // Check the modal
    cy.get(".fxUSD-send-modal")
      .should("contain", "send")
      .and("contain", "fxUSD");
  });

  it("should show convert for fxUSD", () => {
    cy.setupDesktop();
    cy.connectTestWalletDesktop();

    // Click on dashboard in menu
    cy.get("#header-menu-dashboard").click();

    // Click the fxUSD convert button
    cy.get("#fxUSD-convert-button").click();

    // Check from token
    cy.get("#select-convert-token-sell-wrapper .hfi-select input").should(
      "have.value",
      "fxUSD handleUSD",
    );
  });

  it("should show convert for fxUSD to hLP", () => {
    cy.setupDesktop();
    cy.connectTestWalletDesktop();

    // Click on dashboard in menu
    cy.get("#header-menu-dashboard").click();

    // Click the fxUSD convert button
    cy.get("#fxUSD-buy-hlp-button").click();

    // Check from token
    cy.get("#select-convert-token-sell-wrapper .hfi-select input").should(
      "have.value",
      "fxUSD handleUSD",
    );

    // Check to token
    cy.get("#select-convert-token-buy-wrapper .hfi-select input").should(
      "have.value",
      "hLP Handle Liquidity Pool",
    );
  });
});
