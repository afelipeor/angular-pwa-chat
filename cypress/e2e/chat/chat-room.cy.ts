describe('Chat Room Functionality', () => {
    beforeEach(() => {
        cy.visit('/chat-room');
    });

    it('should send a message successfully', () => {
        cy.get('input[name="message"]').type('Hello, World!');
        cy.get('button[type="submit"]').click();
        cy.get('.message-list').should('contain', 'Hello, World!');
    });

    it('should display incoming messages', () => {
        cy.get('.message-list').should('be.visible');
        cy.intercept('POST', '/api/messages', {
            statusCode: 200,
            body: { message: 'New message received' }
        }).as('newMessage');
        cy.wait('@newMessage');
        cy.get('.message-list').should('contain', 'New message received');
    });

    it('should handle empty message input', () => {
        cy.get('button[type="submit"]').click();
        cy.get('.error-message').should('contain', 'Message cannot be empty');
    });
});