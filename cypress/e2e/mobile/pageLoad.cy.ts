describe("Mobile page load", () => {
  it("should should show the taskbar after loading", () => {
    cy.setupMobile();
    cy.visit("/");
    cy.get("[class*='_taskbar_']").should("be.visible");
  });
});
