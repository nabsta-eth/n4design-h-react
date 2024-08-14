export const ensureVisibilityAndInputType = prefix => {
  // check that the position size input is loaded
  cy.get(`[id^=${prefix}][id$=position-size]`).should("be.visible");
  cy.ensurePositionSizeInputInUsd(prefix);
};

export const enterPositionSizeInputOneAndTest = prefix => {
  // enter 1 for the position lot size
  cy.get(`[id^=${prefix}][id$=position-size]`).type("1");
  cy.get(`[id^=${prefix}][id$=position-size]`).should("have.value", "1");
};

export const enterPositionSizeInputDecimalsAndSeparatorTest = prefix => {
  // enter a value large enough to warrant thousand separator and truncation @ 2 decimals
  cy.get(`[id^=${prefix}][id$=position-size]`).type("12345.678");
  cy.get(`[id^=${prefix}][id$=position-size]`).should(
    "have.value",
    "12,345.67",
  );
  // click the switch button to change into lots mode
  cy.get(`[id^=${prefix}][id$=switch-input-type]`).click();
  // enter the same value large enough to warrant thousand separator but should not be truncated
  cy.get(`[id^=${prefix}][id$=position-size]`).clear();
  cy.get(`[id^=${prefix}][id$=position-size]`).type("12345.6789");
  cy.get(`[id^=${prefix}][id$=position-size]`).should(
    "have.value",
    "12,345.6789",
  );
};

export const enterPositionSizeInputCharRemovalTest = prefix => {
  // enter a value then remove it via backspace
  cy.get(`[id^=${prefix}][id$=position-size]`).type("12");
  cy.get(`[id^=${prefix}][id$=position-size]`).should("have.value", "12");
  cy.get(`[id^=${prefix}][id$=position-size]`).type(
    "{end}{backspace}{backspace}",
  );
  cy.get(`[id^=${prefix}][id$=position-size]`).should("have.value", "");
};

export const enterPositionSizeInputMarketChangeTest = prefix => {
  // Change the trade pair to BTC/USD
  cy.get(
    `[id^=${prefix}][id$=market-select-wrapper] input.market-select`,
  ).click();
  cy.get(`[id^=${prefix}][id$=market-select-dropdown] button.BTC-USD`).click();

  // enter a value then remove it via backspace
  cy.get(`[id^=${prefix}][id$=position-size]`).type("1");
  cy.get(`[id^=${prefix}][id$=position-size]`).should("have.value", "1");
  cy.get(
    `[id^=${prefix}][id$=market-select-wrapper] input.market-select`,
  ).should("have.value", "BTC/USD");
};

export const enterPositionSizeInputPointOneAndTest = prefix => {
  // enter 1 for the position lot size
  cy.get(`[id^=${prefix}][id$=position-size]`).type(".1");
  cy.get(`[id^=${prefix}][id$=position-size]`).should("have.value", "0.1");
};

export const enterPositionSizeInputAndCheckFees = prefix => {
  ensureVisibilityAndInputType(prefix);
  // enter 100 for the position size
  cy.get(`[id^=${prefix}][id$=position-size]`).type("100");
  cy.get(`[id^=${prefix}][id$=position-size]`).should("have.value", "100");
  // Click the details toggle to open
  cy.get(`[id^=${prefix}][id$=toggle-details]`).click();
  // Check the fees row is visible
  cy.get(`[id^=${prefix}][id$=fees-row]`).should("be.visible");
  // The values below will need to change if the fee values/percentages change.
  // Check the fees row value is correct
  cy.get(`[id^=${prefix}][id$=fees-row] .uk-tooltip-content`).contains(
    "0.13 USD",
  );
  // Click to show tooltip
  cy.get(`[id^=${prefix}][id$=fees-row] [uk-tooltip]`).click();
  // Check tooltip is visible and contains the correct values.
  cy.get(".uk-tooltip")
    .should("be.visible")
    .contains("trade fee of 0.080 USD")
    .contains("sequencer fee of 0.050 USD");
};

// Keep an object with timers for tests where we set
// the timeout to avoid setting multiple timers.
global.timers = new Map();

/**
 * Stops the current Cypress test if it takes longer than the provided timeout.
 * @param {number} testTimeoutInMs - test timeout in milliseconds
 **/

export const testTimeout = (testTimeoutInMs: number, test?: string) => {
  // Get the current test reference
  const currentTest = cy.state("runnable") ?? test;

  if (!currentTest) {
    throw new Error("Could not determine current test");
  }

  if (global.timers.has(currentTest)) {
    console.log("[testTimeout] removing existing timer for test", currentTest);
    clearTimeout(global.timers.get(currentTest));
    global.timers.delete(currentTest);
  }

  const startedAt = +new Date();

  const timer = setTimeout(() => {
    const testNow = cy.state("runnable");

    console.log("[testTimeout] test started", currentTest);
    console.log("[testTimeout] test now", testNow);

    if (currentTest !== testNow) {
      // If the test name has changed then skip
      return;
    }

    console.log("[testTimeout] test now state", testNow.state);
    if (testNow.state) {
      // If the test has finished then skip
      if (testNow.state === "failed") {
        throw new Error(`test failed, aborting`);
      }
      return;
    }

    const timeNow = Date.now();

    console.log(
      "[testTimeout] elapsed %d limit %d",
      timeNow - startedAt,
      testTimeoutInMs,
    );
    if (timeNow - startedAt >= testTimeoutInMs) {
      // If the timeout has expired then fail the test
      console.log(
        `[testTimeout] terminating test after ${testTimeoutInMs}ms`,
        currentTest,
      );
      throw new Error(`test ran longer than ${testTimeoutInMs}ms`);
    }
  }, testTimeoutInMs);

  global.timers.set(currentTest, timer);
};
