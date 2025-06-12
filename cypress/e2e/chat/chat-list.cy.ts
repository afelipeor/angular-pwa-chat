describe('Chat List', () => {
    beforeEach(() => {
        cy.visit('/chat');
    });

    it('should display the chat list', () => {
        cy.get('.chat-list').should('be.visible');
    });

    it('should load chats correctly', () => {
        cy.fixture('chats').then((chats) => {
            cy.intercept('GET', '/api/chats', chats).as('getChats');
            cy.wait('@getChats');
            cy.get('.chat-item').should('have.length', chats.length);
        });
    });

    it('should handle empty state', () => {
        cy.intercept('GET', '/api/chats', []).as('getEmptyChats');
        cy.wait('@getEmptyChats');
        cy.get('.empty-state').should('be.visible');
    });
});