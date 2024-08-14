describe("Desktop connect test wallet", () => {
  it("should connect test wallet via private key for desktop", () => {
    cy.setupDesktop();
    cy.connectTestWalletDesktop();
  });
});
