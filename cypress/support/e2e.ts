// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import 'cypress-real-events/support';
import './commands';

// Add global error handling
Cypress.on('uncaught:exception', (err, runnable) => {
  // Don't fail tests on uncaught exceptions from the app
  if (
    err.message.includes('Script error') ||
    err.message.includes('Non-Error promise rejection captured') ||
    err.message.includes('ResizeObserver loop limit exceeded')
  ) {
    return false;
  }
  return true;
});

// Global before hook
beforeEach(() => {
  // Clear storage before each test
  cy.window().then((win) => {
    win.localStorage.clear();
    win.sessionStorage.clear();
  });

  // Set up default viewport
  cy.viewport(1280, 720);
});

// Add custom chai assertions
declare global {
  namespace Chai {
    interface Assertion {
      haveValidationError(): Assertion;
    }
  }
}

// Extend chai with custom assertions
chai.use((chai, utils) => {
  chai.Assertion.addMethod('haveValidationError', function () {
    const obj = this._obj;
    const subject = cy.wrap(obj);

    subject.should('have.class', 'ng-invalid');
    subject.siblings('.error-message').should('exist');
  });
});
