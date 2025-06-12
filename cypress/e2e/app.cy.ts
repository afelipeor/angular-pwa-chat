describe('Application End-to-End Tests', () => {
    beforeEach(() => {
        cy.visit('/');
    });

    it('should load the application successfully', () => {
        cy.url().should('include', '/');
    });

    it('should navigate to the login page', () => {
        cy.get('a[href="/login"]').click();
        cy.url().should('include', '/login');
    });

    it('should navigate to the registration page', () => {
        cy.get('a[href="/register"]').click();
        cy.url().should('include', '/register');
    });

    it('should navigate to the chat list', () => {
        cy.get('a[href="/chat"]').click();
        cy.url().should('include', '/chat');
    });

    it('should display the header menu', () => {
        cy.get('header').should('be.visible');
    });
});