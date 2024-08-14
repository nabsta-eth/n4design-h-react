import { enterPositionSizeInputAndCheckFees } from "../utils";

const TRADE_FORM_PREFIX_DESKTOP = "tab-trade";

describe("Desktop test trade fees display", () => {
  it("should show 0.13 USD fees made up of 0.080 USD trade fee and 0.050 USD sequencer fee", () => {
    cy.setupDesktop();
    enterPositionSizeInputAndCheckFees(TRADE_FORM_PREFIX_DESKTOP);
  });
});
