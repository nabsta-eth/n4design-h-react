describe("Mobile open and close ETH/USD long trade", () => {
  it("should successfully submit an ETH/USD long trade and close it", () => {
    cy.setupMobile();
    cy.connectTestWalletMobile();
    // set the id prefix for the trade form
    const tradeFormPrefix = "mobile-trade";

    // goto trade form
    cy.get("[id^=taskbar-menu-trade-button]").click();

    // click account button in top taskbar
    cy.get(`[id^=trade-taskbar-account-button]`).click();

    // make sure there is no account open
    cy.get("#mobile-account-id-empty");

    // deposit into and create account
    cy.depositIntoAccount("mobile", "100");

    // return to trade form
    cy.get("#back-button").click();
    // check that the position size input is loaded
    cy.get(`[id^=${tradeFormPrefix}][id$=position-size]`).should("be.visible");
    // check the market select input/button
    cy.get(
      `[id^=${tradeFormPrefix}][id$=market-select-wrapper] input.market-select`,
    ).should("have.value", "ETH/USD");
    // check that the buy button is active
    cy.get(`[id^=${tradeFormPrefix}][id$=buy-button]`).should(
      "have.class",
      "uk-active",
    );

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

    // goto positions
    cy.get("[id^=taskbar-menu-positions-button]").click();
    // check that the position and therefore close button is visible
    cy.get("#mobile-position-eth-usd-close-button")
      .should("be.visible")
      .click();
    // click the close position button
    cy.get("#mobile-position-close-button").click();

    cy.get("#mobile-transactions").contains("no open positions");

    // click account button in top taskbar
    cy.get(`[id^=positions-taskbar-account-button]`).click();

    // click withdraw button in account frame
    cy.get(`[id^=mobile-account-withdraw-button]`).click();
    // set the id prefix for the trade form
    const tradeWithdrawFormPrefix = "trade-withdraw";
    // check that the withdraw form is visible
    cy.get(`#mobile-account #${tradeWithdrawFormPrefix}-form`).should(
      "be.visible",
    );

    // click max withdraw button
    cy.get(
      `#mobile-account #trade-withdraw-form [id^=${tradeWithdrawFormPrefix}][id$=amount-max]`,
    ).click();
    // check withdraw button is ready
    cy.get(`[id^=button-${tradeWithdrawFormPrefix}]`).should(
      "have.class",
      "ready",
    );

    // click it
    cy.get(`[id^=button-${tradeWithdrawFormPrefix}]`).click();

    // if the success notification is visible then click it to close it
    cy.handleSuccessNotification();

    // if mobile ensure clicked any back button
    cy.get("#back-button").click();
  });
});
