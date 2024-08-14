import { enterPositionSizeInputAndCheckFees } from "../utils";

const TRADE_FORM_PREFIX_MOBILE = "mobile-trade";

describe("Mobile test trade fees display", () => {
  it("should show 0.13 USD fees made up of 0.080 USD trade fee and 0.050 USD sequencer fee", () => {
    cy.setupMobile();
    // goto trade form
    cy.get("[id^=taskbar-menu-trade-button]").click();
    enterPositionSizeInputAndCheckFees(TRADE_FORM_PREFIX_MOBILE);
  });
});
