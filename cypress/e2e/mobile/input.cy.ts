import {
  ensureVisibilityAndInputType,
  enterPositionSizeInputCharRemovalTest,
  enterPositionSizeInputDecimalsAndSeparatorTest,
  enterPositionSizeInputMarketChangeTest,
  enterPositionSizeInputOneAndTest,
  enterPositionSizeInputPointOneAndTest,
} from "../utils";

const TRADE_FORM_PREFIX_MOBILE = "mobile-trade";

describe("Mobile input validation, parsing and formatting", () => {
  it("should show exactly '1' (and not '1.0') when '1' is typed in", () => {
    cy.setupMobile();
    // goto trade form
    cy.get("[id^=taskbar-menu-trade-button]").click();
    ensureVisibilityAndInputType(TRADE_FORM_PREFIX_MOBILE);
    enterPositionSizeInputOneAndTest(TRADE_FORM_PREFIX_MOBILE);
  });
  it("should show value with thousands separator and no more than 2 decimals", () => {
    cy.setupMobile();
    // goto trade form
    cy.get("[id^=taskbar-menu-trade-button]").click();
    ensureVisibilityAndInputType(TRADE_FORM_PREFIX_MOBILE);
    enterPositionSizeInputDecimalsAndSeparatorTest(TRADE_FORM_PREFIX_MOBILE);
  });
  it("should allow '.' as first character and add the '0'", () => {
    cy.setupMobile();
    // goto trade form
    cy.get("[id^=taskbar-menu-trade-button]").click();
    ensureVisibilityAndInputType(TRADE_FORM_PREFIX_MOBILE);
    enterPositionSizeInputPointOneAndTest(TRADE_FORM_PREFIX_MOBILE);
  });
  it("should allow deletion of all chars from the input", () => {
    cy.setupMobile();
    // goto trade form
    cy.get("[id^=taskbar-menu-trade-button]").click();
    ensureVisibilityAndInputType(TRADE_FORM_PREFIX_MOBILE);
    enterPositionSizeInputCharRemovalTest(TRADE_FORM_PREFIX_MOBILE);
  });
  it("should not change the trade pair upon enter", () => {
    cy.setupMobile();
    // goto trade form
    cy.get("[id^=taskbar-menu-trade-button]").click();
    ensureVisibilityAndInputType(TRADE_FORM_PREFIX_MOBILE);
    enterPositionSizeInputMarketChangeTest(TRADE_FORM_PREFIX_MOBILE);
  });
});
