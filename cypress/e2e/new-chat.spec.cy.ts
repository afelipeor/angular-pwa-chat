describe('New Chat', () => {
  beforeEach(() => {
    cy.intercept('GET', '/api/users', { fixture: 'users.json' }).as('getUsers');
    cy.interceptChatAPI();
    cy.loginAsTestUser();
    cy.visit('/chat/new');
  });

  it('should display new chat form', () => {
    cy.get('[data-cy="new-chat-form"]').should('be.visible');
    cy.get('[data-cy="chat-name-input"]').should('be.visible');
    cy.get('[data-cy="participant-search"]').should('be.visible');
    cy.get('[data-cy="create-chat-button"]').should('be.visible');
  });

  it('should search and add participants', () => {
    cy.wait('@getUsers');
    cy.get('[data-cy="participant-search"]').type('Jane');
    cy.get('[data-cy="user-suggestion"]').should('contain', 'Jane Smith');
    cy.get('[data-cy="user-suggestion"]').first().click();

    cy.get('[data-cy="selected-participant"]').should('contain', 'Jane Smith');
    cy.get('[data-cy="remove-participant"]').should('be.visible');
  });

  it('should remove selected participants', () => {
    cy.wait('@getUsers');
    cy.get('[data-cy="participant-search"]').type('Jane');
    cy.get('[data-cy="user-suggestion"]').first().click();
    cy.get('[data-cy="remove-participant"]').click();

    cy.get('[data-cy="selected-participant"]').should('not.exist');
  });

  it('should create a new chat successfully', () => {
    cy.wait('@getUsers');
    cy.get('[data-cy="chat-name-input"]').type('Test Chat');
    cy.get('[data-cy="participant-search"]').type('Jane');
    cy.get('[data-cy="user-suggestion"]').first().click();
    cy.get('[data-cy="create-chat-button"]').click();

    cy.wait('@createChat');
    cy.url().should('match', /\/chat\/\w+/);
  });

  it('should show validation errors', () => {
    cy.get('[data-cy="create-chat-button"]').click();
    cy.get('[data-cy="chat-name-error"]').should('be.visible');
    cy.get('[data-cy="participants-error"]').should('be.visible');
  });

  it('should handle create chat error', () => {
    cy.intercept('POST', '/api/chats', {
      statusCode: 500,
      body: { message: 'Server error' },
    }).as('createChatError');

    cy.get('[data-cy="chat-name-input"]').type('Test Chat');
    cy.get('[data-cy="participant-search"]').type('Jane');
    cy.get('[data-cy="user-suggestion"]').first().click();
    cy.get('[data-cy="create-chat-button"]').click();

    cy.wait('@createChatError');
    cy.get('[data-cy="error-message"]').should('be.visible');
  });
});
