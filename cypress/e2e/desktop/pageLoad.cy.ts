describe("Desktop page load", () => {
  it("should should show the header after loading", () => {
    cy.setupDesktop();
    cy.get("#header").should("be.visible");
  });
});
