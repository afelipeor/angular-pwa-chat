describe('New Chat Functionality', () => {
    beforeEach(() => {
        cy.visit('/chat');
    });

    it('should allow users to initiate a new chat', () => {
        cy.get('button.new-chat').click();
        cy.get('input.chat-participant').type('User123');
        cy.get('button.start-chat').click();
        cy.get('.chat-room').should('exist');
    });

    it('should display an error message for invalid participants', () => {
        cy.get('button.new-chat').click();
        cy.get('input.chat-participant').type('InvalidUser');
        cy.get('button.start-chat').click();
        cy.get('.error-message').should('contain', 'User not found');
    });

    it('should handle empty participant input', () => {
        cy.get('button.new-chat').click();
        cy.get('button.start-chat').click();
        cy.get('.error-message').should('contain', 'Participant is required');
    });
});