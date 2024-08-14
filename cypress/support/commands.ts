import { ContractTransaction, providers, Wallet } from "ethers";
import { MockToken__factory } from "../../src/contracts";
import { parseEther } from "ethers/lib/utils";
import { testTimeout } from "../e2e/utils";

/**
 * This is a testnet wallet only, it should never hold real funds.
 * It should always hold sufficient testnet ETH and token funds
 * so that it can perform the tests correctly.
 * This wallet is not used for testing directly: rather, it has
 * fxUSD minting rights on arbitrum-sepolia, and sufficient ETH.
 * During each E2E test run, a new random wallet is generated.
 * This wallet is responsible for funding that random wallet with fxUSD.
 * EOA Requirements:
 * 1. Hold enough ETH.
 * 2. Have (mock) fxUSD minting rights.
 *
 * The address for this key is 0xedE29e7690c3b555645e5F3DbB92f48EdbBE3C0e.
 */
const FUNDING_WALLET_KEY =
  "0x420420420420420420420420420420420420420420420420420420420420beef";
// Cypress ENV vars are set in the Cypress config file.
const RPC_URL = Cypress.env("RPC_URL");
const MOCK_USD_ADDRESS = Cypress.env("MOCK_USD_ADDRESS");
const PROVIDER = new providers.JsonRpcProvider(RPC_URL);
const USD_FUNDING_AMOUNT = parseEther("100");
// global timeout of 5 minutes per test for all tests
const GLOBAL_TEST_TIMEOUT_IN_MS = 5 * 60 * 1000;

Cypress.Commands.add("setupDesktop", () => {
  testTimeout(GLOBAL_TEST_TIMEOUT_IN_MS);
  cy.viewport(1920, 1080).wait(5000);
  cy.visit("/");
  cy.get("#header");
  cy.dismissInstallCta();
});

Cypress.Commands.add("setupMobile", () => {
  testTimeout(GLOBAL_TEST_TIMEOUT_IN_MS);
  cy.viewport("iphone-x").wait(5000);
  cy.visit("/");
  cy.get("#mobile-bottom-taskbar");
});

Cypress.Commands.add("connectTestWalletWithoutConfirming", () => {
  cy.wrap(generateAndFundTestingWallet()).then(wallet => {
    console.log("TEST WALLET PRIVATE KEY:", wallet.privateKey);
    cy.window().then(window => {
      window.connectPrivateKeyString(wallet.privateKey);
    });
  });
});

Cypress.Commands.add("connectTestWalletDesktop", () => {
  cy.connectTestWalletWithoutConfirming();
  cy.confirmWalletConnectionDesktop();
});

Cypress.Commands.add("connectTestWalletMobile", () => {
  cy.connectTestWalletWithoutConfirming();
  cy.confirmWalletConnectionMobile();
});

Cypress.Commands.add("confirmWalletConnectionDesktop", () => {
  cy.get("#header-wallet-button").should(element => {
    expect(element.text().startsWith("0x")).to.be.true;
  });
});

Cypress.Commands.add("confirmWalletConnectionMobile", () => {
  // Go to the assets tab.
  cy.get("[id^=taskbar-menu-dashboard-button]").click();
  // Check that the identicon is there.
  cy.get("canvas.identicon");
});

Cypress.Commands.add("handleSuccessNotification", () => {
  // Hide notifications if visible, but don't require them to be present.
  cy.document().then(document => {
    const elements = document.querySelectorAll(
      ".uk-notification-message-success",
    );
    if (elements.length === 0) {
      return;
    }
    elements.forEach(element => {
      element.click();
    });
  });
});

Cypress.Commands.add("clickDepositButton", (prefix, type) => {
  cy.get(`[id^=button-${prefix}]`)
    .should("have.class", type)
    .then($button => {
      cy.wrap($button).click();
    });
});

Cypress.Commands.add("depositIntoAccount", (type, amount) => {
  const accountPrefix = `${type}-account`;
  // Click deposit button in account frame.
  cy.get(`[id^=${accountPrefix}-deposit-button]`).click();
  // Sset the id prefix for the trade form.
  const tradeDepositFormPrefix = "trade-deposit";
  // Check that the deposit form is visible.
  cy.get(`#${tradeDepositFormPrefix}-form`).should("be.visible");
  // Check balance in wallet.
  cy.get(`[id^=right-label-${tradeDepositFormPrefix}]`).should(
    "contain",
    "bal: 100.0000",
  );
  // Enter amount into deposit input.
  cy.get(
    `#trade-deposit-form [id^=${tradeDepositFormPrefix}][id$=amount]`,
  ).type(amount);
  // This should be the terms button since the account never signed the terms.
  cy.clickDepositButton(tradeDepositFormPrefix, "sign");
  cy.acceptTermsOfUse();
  // Actually deposit now since terms have been accepted.
  cy.clickDepositButton(tradeDepositFormPrefix, "ready");
  // if the success notification is visible then click it to close it
  cy.handleSuccessNotification();
});

Cypress.Commands.add("acceptTermsOfUse", () => {
  // Scroll to the end of the terms modal.
  cy.get(".tou-content").parent().scrollTo("bottom");
  // Accept terms by clicking consent button.
  cy.get(".tou-button").click();
});

Cypress.Commands.add("dismissInstallCta", () => {
  // close the install CTA modal
  cy.get(".install-cta-modal .uk-button.uk-modal-close-default").click();
});

Cypress.Commands.add("desktopWithdrawBalance", () => {
  // check account value and withdraw max
  cy.get(`#account-value-amount`).then($accountValueAmount => {
    const balanceString = $accountValueAmount.text().split(" ")[0];
    const isBalanceZero = balanceString === "0.00";
    if (isBalanceZero) {
      return;
    }
    // click withdraw button in account frame
    cy.get(`[id^=tab-account-withdraw-button]`).click();
    // set the id prefix for the trade form
    const tradeWithdrawFormPrefix = "trade-withdraw";
    const tradeWithdrawFormId = `#${tradeWithdrawFormPrefix}-form`;
    // check that the withdraw form is visible
    cy.get(tradeWithdrawFormId).should("be.visible");
    // click max withdraw button
    cy.get(`${tradeWithdrawFormId} [id$=amount-max]`).click();
    // check withdraw button is ready
    cy.get(`[id^=button-${tradeWithdrawFormPrefix}]`).should(
      "have.class",
      "ready",
    );
    // click it
    cy.get(`[id^=button-${tradeWithdrawFormPrefix}]`).click();
    // if the success notification is visible then click it to close it
    cy.handleSuccessNotification();
  });
});

Cypress.Commands.add("testTradeChartTabVisibility", (pair: string) => {
  const pairTabClassToTest = `.${pair.replace("/", "-").toLowerCase()}-tab`;
  cy.get(pairTabClassToTest)
    .should("be.visible")
    .should("have.class", "flexlayout__tab_button--selected");
});

Cypress.Commands.add(
  "testTradeFormInputValue",
  (pair: string, type: "tab" | "mobile") => {
    cy.get(`[id^=${type}-trade][id$=market-select-wrapper] input.market-select`)
      .should("have.prop", "value")
      .and("equal", pair);
  },
);

Cypress.Commands.add("ensurePositionSizeInputInUsd", prefix => {
  cy.get(`[id^=${prefix}][id$=position-size-input-type]`).then($inputType => {
    if ($inputType.text() === "lots") {
      cy.get(`[id^=${prefix}][id$=position-size-switch-input-type]`).click();
    }
  });
  cy.get(`[id^=${prefix}][id$=position-size-input-type]`).should(
    "contain",
    "USD",
  );
});

const generateAndFundTestingWallet = async (): Promise<Wallet> => {
  console.log("Provider:", PROVIDER);
  const fundingWallet = new Wallet(FUNDING_WALLET_KEY, PROVIDER);
  console.log("Funding wallet:", fundingWallet);
  const testWallet = new Wallet(Wallet.createRandom().privateKey, PROVIDER);
  console.log("Test wallet:", testWallet);
  const mockToken = MockToken__factory.connect(MOCK_USD_ADDRESS, fundingWallet);
  console.log("Mock token:", mockToken);
  console.log("Minting fxUSD to test wallet...");
  let mintTx: ContractTransaction | null = null;
  try {
    mintTx = await mockToken.mint(testWallet.address, USD_FUNDING_AMOUNT);
  } catch (e) {
    throw new Error("Failed to mint fxUSD to test wallet: " + e);
  } finally {
    await mintTx.wait(1);
  }
  return testWallet;
};
