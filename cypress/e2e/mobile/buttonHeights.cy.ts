describe("Mobile dash button heights", () => {
  it("should confirm dashboard buttons do not wrap text for mobile", () => {
    cy.setupMobile();

    // Goto dashboard
    cy.get("[id^=taskbar-menu-dashboard-button]").click();

    // Get the wallet assets connect button.
    // Normally the button is 30px high.
    // Allowing for tolerance,
    // check that the button is less than 35px high.
    cy.get("#dashboard-assets-tile-connect-wallet-button")
      .should("be.visible")
      .should("not.be.disabled")
      .then($button => {
        expect($button.height()).to.be.lessThan(35);
      });

    cy.connectTestWalletMobile();

    // Get the open account button.
    // Normally the button is 20px high.
    // Allowing for tolerance,
    // check that the button is less than 25px high.
    cy.get("#dashboard-trade-account-tile-open-account-button")
      .should("be.visible")
      .should("not.be.disabled")
      .then($button => {
        expect($button.height()).to.be.lessThan(25);
      });
  });
});
