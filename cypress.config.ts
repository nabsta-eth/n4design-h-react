import { defineConfig } from "cypress";

export default defineConfig({
  projectId: "8fmz83",
  experimentalMemoryManagement: true,
  screenshotOnRunFailure: false,
  defaultCommandTimeout: 5 * 60_000,
  e2e: {
    baseUrl: "http://localhost:3000",
    setupNodeEvents(on, config) {
      // implement node event listeners here
      on("before:browser:launch", (browser, launchOptions) => {
        if (browser.family === "chromium" && browser.name !== "electron") {
          launchOptions.args.push("--disable-gpu");
        }
        console.log("config", config);
        console.log("browser", browser);
        console.log("launchOptions", launchOptions);
        return launchOptions;
      });
    },
  },
  env: {
    RPC_URL:
      "https://arb-sepolia.g.alchemy.com/v2/6VWMGS0uDkY1P5MzVtHNL8PgFCvjme6Q",
    MOCK_USD_ADDRESS: "0xe5B75EcA86d4E855a65Af3D95A3aCe1679f2850d",
  },
});
