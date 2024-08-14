describe("Mobile connect test wallet", () => {
  it("should connect test wallet via private key for mobile", () => {
    cy.setupMobile();
    cy.connectTestWalletMobile();
  });
});
