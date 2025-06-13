describe('Chat Room', () => {
  beforeEach(() => {
    cy.interceptChatAPI();
    cy.loginAsTestUser();
    cy.visit('/chat/1');
  });

  it('should display chat header with correct information', () => {
    cy.get('[data-cy="chat-header"]').should('be.visible');
    cy.get('[data-cy="chat-name"]').should('contain', 'General Chat');
    cy.get('[data-cy="participant-count"]').should('be.visible');
    cy.get('[data-cy="back-button"]').should('be.visible');
  });

  it('should load and display messages', () => {
    cy.wait('@getMessages');
    cy.get('[data-cy="message-list"]').should('be.visible');
    cy.get('[data-cy="message-item"]').should('have.length.greaterThan', 0);
  });

  it('should display message details correctly', () => {
    cy.wait('@getMessages');
    cy.get('[data-cy="message-item"]')
      .first()
      .within(() => {
        cy.get('[data-cy="message-content"]').should('be.visible');
        cy.get('[data-cy="sender-name"]').should('be.visible');
        cy.get('[data-cy="message-timestamp"]').should('be.visible');
      });
  });

  it('should send a message successfully', () => {
    cy.wait('@getMessages');
    const testMessage = 'Hello, this is a test message!';

    cy.get('[data-cy="message-input"]').type(testMessage);
    cy.get('[data-cy="send-button"]').should('not.be.disabled');
    cy.get('[data-cy="send-button"]').click();

    cy.wait('@sendMessage');
    cy.get('[data-cy="message-input"]').should('have.value', '');
    cy.get('[data-cy="message-item"]').last().should('contain', testMessage);
  });

  it('should disable send button for empty messages', () => {
    cy.get('[data-cy="send-button"]').should('be.disabled');
    cy.get('[data-cy="message-input"]').type('test');
    cy.get('[data-cy="send-button"]').should('not.be.disabled');
    cy.get('[data-cy="message-input"]').clear();
    cy.get('[data-cy="send-button"]').should('be.disabled');
  });

  it('should show typing indicator', () => {
    cy.get('[data-cy="message-input"]').type('typing...');
    cy.get('[data-cy="typing-indicator"]').should('be.visible');
    cy.get('[data-cy="typing-indicator"]').should('contain', 'is typing');
  });

  it('should handle message sending error', () => {
    cy.intercept('POST', '/api/messages', {
      statusCode: 500,
      body: { message: 'Server error' },
    }).as('sendMessageError');

    cy.get('[data-cy="message-input"]').type('test message');
    cy.get('[data-cy="send-button"]').click();

    cy.wait('@sendMessageError');
    cy.get('[data-cy="error-toast"]').should('be.visible');
    cy.get('[data-cy="error-toast"]').should(
      'contain',
      'Failed to send message'
    );
  });

  it('should navigate back to chat list', () => {
    cy.get('[data-cy="back-button"]').click();
    cy.url().should('include', '/chat');
  });
});
