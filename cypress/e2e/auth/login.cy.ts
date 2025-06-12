describe('Login Functionality', () => {
    it('should log in successfully with valid credentials', () => {
        cy.fixture('users').then((users) => {
            const user = users.validUser;
            cy.visit('/login');
            cy.get('input[name="username"]').type(user.username);
            cy.get('input[name="password"]').type(user.password);
            cy.get('button[type="submit"]').click();
            cy.url().should('include', '/dashboard');
        });
    });

    it('should display an error message with invalid credentials', () => {
        cy.fixture('users').then((users) => {
            const user = users.invalidUser;
            cy.visit('/login');
            cy.get('input[name="username"]').type(user.username);
            cy.get('input[name="password"]').type(user.password);
            cy.get('button[type="submit"]').click();
            cy.get('.error-message').should('be.visible').and('contain', 'Invalid credentials');
        });
    });
});