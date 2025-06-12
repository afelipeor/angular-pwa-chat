describe('Header Menu Navigation', () => {
    beforeEach(() => {
        cy.visit('/');
    });

    it('should navigate to the home page', () => {
        cy.get('nav').contains('Home').click();
        cy.url().should('include', '/home');
    });

    it('should navigate to the about page', () => {
        cy.get('nav').contains('About').click();
        cy.url().should('include', '/about');
    });

    it('should navigate to the contact page', () => {
        cy.get('nav').contains('Contact').click();
        cy.url().should('include', '/contact');
    });

    it('should navigate to the login page', () => {
        cy.get('nav').contains('Login').click();
        cy.url().should('include', '/login');
    });

    it('should navigate to the register page', () => {
        cy.get('nav').contains('Register').click();
        cy.url().should('include', '/register');
    });
});