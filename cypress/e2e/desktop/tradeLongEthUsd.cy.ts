describe("Desktop open and close ETH/USD long trade", () => {
  it("should successfully submit an ETH/USD long trade and close it", () => {
    // set the id prefix for the trade form
    const tradeFormPrefix = "tab-trade";

    cy.setupDesktop();
    // check that the form has loaded
    cy.get(`[id^=${tradeFormPrefix}][id$=position-size]`).should("be.visible");

    // connect test wallet
    cy.connectTestWalletDesktop();

    // make sure there is no account open
    cy.get("[id^=tab-account-id-empty]");
    // deposit into and create account
    cy.depositIntoAccount("tab", "100");

    // check that the position size input is loaded
    cy.get(`[id^=${tradeFormPrefix}][id$=position-size]`).should("be.visible");
    // check the market select input/button
    cy.get(
      `[id^=${tradeFormPrefix}][id$=market-select-wrapper] input.market-select`,
    ).should("have.value", "ETH/USD");

    // Ensure the input unit is in USD
    cy.ensurePositionSizeInputInUsd(tradeFormPrefix);
    // enter 100 for the position size
    cy.get(`[id^=${tradeFormPrefix}][id$=position-size]`).type("100");
    // click the buy button
    cy.get(`[id^=${tradeFormPrefix}][id$=execute-button]`)
      .should("not.be.disabled")
      .click();

    // confirm trade
    cy.get(`[id^=${tradeFormPrefix}-confirm][id$=execute-button]`).click();

    // check that it has return to the form
    cy.get(`[id^=${tradeFormPrefix}][id$=position-size]`).should("be.visible");

    // if the success notification is visible then click it to close it
    cy.handleSuccessNotification();

    // check that the position close button is visible and click it
    cy.get("[id^=eth-usd-close-button]").should("be.visible").click();

    // check that the position modal close button is visible and click it
    cy.get("#position-close-button").should("be.visible").click();

    // if the success notification is visible then click it to close it
    cy.handleSuccessNotification();

    // Withdraw all funds and transfer account out
    cy.desktopWithdrawBalance();
  });
});
