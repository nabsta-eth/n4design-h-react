import {
  ensureVisibilityAndInputType,
  enterPositionSizeInputCharRemovalTest,
  enterPositionSizeInputDecimalsAndSeparatorTest,
  enterPositionSizeInputMarketChangeTest,
  enterPositionSizeInputOneAndTest,
  enterPositionSizeInputPointOneAndTest,
} from "../utils";

const TRADE_FORM_PREFIX_DESKTOP = "tab-trade";

describe("Desktop input validation, parsing and formatting", () => {
  it("should show exactly '1' (and not '1.0') when '1' is typed in", () => {
    cy.setupDesktop();
    ensureVisibilityAndInputType(TRADE_FORM_PREFIX_DESKTOP);
    enterPositionSizeInputOneAndTest(TRADE_FORM_PREFIX_DESKTOP);
  });
  it("should show value with thousands separator and no more than 2 decimals", () => {
    cy.setupDesktop();
    ensureVisibilityAndInputType(TRADE_FORM_PREFIX_DESKTOP);
    enterPositionSizeInputDecimalsAndSeparatorTest(TRADE_FORM_PREFIX_DESKTOP);
  });
  it("should allow '.' as first character and add the '0'", () => {
    cy.setupDesktop();
    ensureVisibilityAndInputType(TRADE_FORM_PREFIX_DESKTOP);
    enterPositionSizeInputPointOneAndTest(TRADE_FORM_PREFIX_DESKTOP);
  });
  it("should allow deletion of all chars from the input", () => {
    cy.setupDesktop();
    ensureVisibilityAndInputType(TRADE_FORM_PREFIX_DESKTOP);
    enterPositionSizeInputCharRemovalTest(TRADE_FORM_PREFIX_DESKTOP);
  });
  it("should not change the trade pair upon enter", () => {
    cy.setupDesktop();
    ensureVisibilityAndInputType(TRADE_FORM_PREFIX_DESKTOP);
    enterPositionSizeInputMarketChangeTest(TRADE_FORM_PREFIX_DESKTOP);
  });
});
