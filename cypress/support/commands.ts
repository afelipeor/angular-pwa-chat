// ***********************************************
// This example namespace declaration will help
// with Intellisense and code completion in your
// IDE or Text Editor.
// ***********************************************
// declare namespace Cypress {
//   interface Chainable<Subject = any> {
//     customCommand(param: any): typeof customCommand;
//   }
// }
//
// function customCommand(param: any): void {
//   console.warn(param);
// }
//
// NOTE: You can use it like so:
// Cypress.Commands.add('customCommand', customCommand);
//
// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })
/// <reference types="cypress" />

import 'cypress-real-events/support';

// Custom commands for authentication
declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
      logout(): Chainable<void>;
      register(userData: {
        name: string;
        email: string;
        password: string;
      }): Chainable<void>;
      loginAsTestUser(): Chainable<void>;
      createTestChat(participants: string[]): Chainable<void>;
      sendMessage(chatId: string, message: string): Chainable<void>;
      interceptChatAPI(): Chainable<void>;
      setupTestUser(): Chainable<void>;
      mockAuth(): Chainable<void>;
      tabThroughElements(): Chainable<void>;
      checkKeyboardNavigation(): Chainable<void>;
      mockAuthenticatedUser(user?: any): Chainable<void>;
      clearAuth(): Chainable<void>;
    }
  }
}

// Setup test user data
Cypress.Commands.add('setupTestUser', () => {
  cy.window().then((win) => {
    const testUser = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      status: 'online',
      avatar: 'https://ui-avatars.com/api/?name=Test+User',
    };

    const token = 'mock-jwt-token';

    win.localStorage.setItem('auth_token', token);
    win.localStorage.setItem('current_user', JSON.stringify(testUser));
  });
});

// Mock authentication API calls
Cypress.Commands.add('mockAuth', () => {
  cy.intercept('POST', '**/api/auth/login', {
    statusCode: 200,
    body: {
      access_token: 'mock-jwt-token',
      user: {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        status: 'online',
        avatar: 'https://ui-avatars.com/api/?name=Test+User',
      },
    },
  }).as('loginRequest');

  cy.intercept('POST', '**/api/auth/logout', {
    statusCode: 200,
    body: { message: 'Logged out successfully' },
  }).as('logoutRequest');

  cy.intercept('GET', '**/api/users/profile', {
    statusCode: 200,
    body: {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      status: 'online',
      avatar: 'https://ui-avatars.com/api/?name=Test+User',
    },
  }).as('getProfile');
});

// Login command
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.mockAuth();
  cy.visit('/auth/login');

  // Wait for the page to load
  cy.get('[data-cy="login-form"]', { timeout: 10000 }).should('be.visible');

  cy.get('input[data-cy="email"]').clear().type(email);
  cy.get('input[data-cy="password"]').clear().type(password);
  cy.get('button[data-cy="login-submit"]').click();

  // Wait for login to complete
  cy.wait('@loginRequest');
  cy.url().should('not.include', '/auth/login');
});

// Logout command
Cypress.Commands.add('logout', () => {
  cy.get('[data-cy="user-menu"]').click();
  cy.get('[data-cy="logout-button"]').click();
  cy.wait('@logoutRequest');
  cy.url().should('include', '/auth/login');
});

// Register command
Cypress.Commands.add('register', (userData) => {
  cy.intercept('POST', '**/api/auth/register', {
    statusCode: 201,
    body: {
      access_token: 'mock-jwt-token',
      user: {
        id: '2',
        name: userData.name,
        email: userData.email,
        status: 'online',
      },
    },
  }).as('registerRequest');

  cy.visit('/auth/register');
  cy.get('input[data-cy="name"]').type(userData.name);
  cy.get('input[data-cy="email"]').type(userData.email);
  cy.get('input[data-cy="password"]').type(userData.password);
  cy.get('input[data-cy="confirm-password"]').type(userData.password);
  cy.get('button[data-cy="register-submit"]').click();

  cy.wait('@registerRequest');
});

// More robust login command that adapts to your app structure
Cypress.Commands.add('loginAsTestUser', () => {
  cy.intercept('POST', '**/api/auth/login', {
    statusCode: 200,
    body: {
      access_token: 'mock-jwt-token',
      user: {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        status: 'online',
      },
    },
  }).as('loginRequest');

  cy.visit('/auth/login');

  // Wait for any of these elements to appear
  cy.get('[data-cy="login-form"], .login-form, form', {
    timeout: 10000,
  }).should('be.visible');

  // Fill in credentials with flexible selectors
  cy.get('[data-cy="email"], input[type="email"], input[name="email"]')
    .should('be.visible')
    .clear()
    .type('test@example.com');

  cy.get('[data-cy="password"], input[type="password"], input[name="password"]')
    .should('be.visible')
    .clear()
    .type('password123');

  cy.get('[data-cy="login-submit"], button[type="submit"], .btn-primary')
    .should('be.visible')
    .should('not.be.disabled')
    .click();

  cy.wait('@loginRequest');

  // Verify we're no longer on the login page
  cy.url().should('not.include', '/auth/login');
});

// Alternative: API-based authentication
Cypress.Commands.add('loginViaAPI', () => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/login`,
    body: {
      email: 'test@example.com',
      password: 'password123',
    },
    failOnStatusCode: false,
  }).then((response) => {
    if (response.status === 200 && response.body.access_token) {
      window.localStorage.setItem('auth_token', response.body.access_token);
      window.localStorage.setItem(
        'current_user',
        JSON.stringify(response.body.user)
      );
    }
  });
});

// Create test chat
Cypress.Commands.add('createTestChat', (participants) => {
  cy.get('[data-cy="new-chat-button"]').click();
  participants.forEach((participant) => {
    cy.get('input[data-cy="participant-search"]').type(participant);
    cy.get(`[data-cy="user-${participant}"]`).click();
  });
  cy.get('button[data-cy="create-chat"]').click();
});

// Send message
Cypress.Commands.add('sendMessage', (chatId: string, message: string) => {
  cy.get(`[data-cy="chat-${chatId}"]`).click();
  cy.get('input[data-cy="message-input"]').type(message);
  cy.get('button[data-cy="send-message"]').click();
});

// Intercept chat API calls
Cypress.Commands.add('interceptChatAPI', () => {
  cy.intercept('GET', '**/api/chats', { fixture: 'chats.json' }).as('getChats');
  cy.intercept('POST', '**/api/chats', { fixture: 'newChat.json' }).as(
    'createChat'
  );
  cy.intercept('GET', '**/api/messages/chat/*', {
    fixture: 'messages.json',
  }).as('getMessages');
  cy.intercept('POST', '**/api/messages', { fixture: 'newMessage.json' }).as(
    'sendMessage'
  );
  cy.intercept('GET', '**/api/users', { fixture: 'users.json' }).as('getUsers');
});

// Custom command for tabbing through elements
Cypress.Commands.add('tabThroughElements', () => {
  // Get all focusable elements
  cy.get(
    'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'
  ).then(($elements) => {
    if ($elements.length > 0) {
      // Focus first element
      cy.wrap($elements.first()).focus();

      // Tab through each element
      for (let i = 0; i < Math.min($elements.length - 1, 5); i++) {
        cy.focused().realPress('Tab');
        cy.focused().should('be.visible');
      }
    }
  });
});

// Command to check keyboard navigation patterns
Cypress.Commands.add('checkKeyboardNavigation', () => {
  cy.get('body').then(($body) => {
    const focusableElements = $body.find(
      'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length > 0) {
      // Start from first focusable element
      cy.wrap(focusableElements.first()).focus();
      cy.focused().should('be.visible');

      // Test Tab navigation
      if (focusableElements.length > 1) {
        cy.focused().realPress('Tab');
        cy.focused().should('be.visible');

        // Test Shift+Tab navigation
        cy.focused().realPress(['Shift', 'Tab']);
        cy.focused().should('be.visible');
      }
    } else {
      cy.log('No focusable elements found for keyboard navigation test');
    }
  });
});

export {};
