// ***********************************************************
// This file is processed and loaded
// automatically before test files.
//
// Read more here:
// https://on.cypress.io/configuration
// ***********************************************************

import "./commands";

Cypress.on("uncaught:exception", (error, runnable) => {
  // Ignoring global errors, as long as the individual tests pass.
  return false;
});
