// ***********************************************************
// This example support/component.ts is processed and
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
import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

import { mount } from 'cypress/angular';

// Augment the Cypress namespace to include type definitions for
// your custom command.
// Alternatively, can be defined in cypress/support/component.d.ts
// with a <reference path="./component" /> at the top of your spec.
declare global {
  namespace Cypress {
    interface Chainable {
      mount: typeof mount;
    }
  }
}

Cypress.Commands.add('mount', mount);

// Example use:
// cy.mount(MyComponent)

// Add global error handling
Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from failing the test
  if (err.message.includes('Script error')) {
    return false;
  }
  return true;
});

// Add custom assertions
chai.use((chai, utils) => {
  chai.Assertion.addMethod('haveValidationError', function (expected) {
    const obj = this._obj;
    const hasError =
      obj.hasClass('ng-invalid') && obj.siblings('.error-message').length > 0;

    this.assert(
      hasError,
      'expected #{this} to have validation error',
      'expected #{this} not to have validation error'
    );
  });
});

// Set up global test data
beforeEach(() => {
  cy.window().then((win) => {
    win.localStorage.clear();
    win.sessionStorage.clear();
  });
});
