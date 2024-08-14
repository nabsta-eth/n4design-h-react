describe("Desktop check bridge network selects", () => {
  it("should only show mainnet networks in from network select", () => {
    cy.setupDesktop();
    gotoBridgeAndCheckNetworkDropdown("from");
  });
  it("should only show mainnet networks in to network select", () => {
    cy.setupDesktop();
    gotoBridgeAndCheckNetworkDropdown("to");
  });
});

const BRIDGE_NETWORKS = ["arbitrum", "ethereum", "polygon"];

const gotoBridgeAndCheckNetworkDropdown = (fromTo: "from" | "to") => {
  // Open more menu
  cy.get("#header-menu-more").click().get("#header-menu-more-bridge").click();
  // Close more menu
  cy.get("#header-menu-more").click();
  // Check if bridge from network select is visible
  cy.get(`#bridge-${fromTo}-network-wrapper`)
    .should("be.visible")
    .trigger("mouseover");
  // Click it
  cy.get(`#bridge-${fromTo}-network-wrapper`).click();
  // Check all options are valid
  cy.get(`#bridge-${fromTo}-network-dropdown button`).each($dropdownButton => {
    const validBridgeNetworkOptionFound = BRIDGE_NETWORKS.findIndex(network =>
      $dropdownButton.hasClass(network),
    );
    expect(validBridgeNetworkOptionFound).to.be.greaterThan(-1);
  });
};
