describe('User Registration', () => {
    beforeEach(() => {
        cy.visit('/register');
    });

    it('should register a new user successfully', () => {
        cy.get('input[name="username"]').type('newuser');
        cy.get('input[name="email"]').type('newuser@example.com');
        cy.get('input[name="password"]').type('password123');
        cy.get('input[name="confirmPassword"]').type('password123');
        cy.get('button[type="submit"]').click();
        cy.url().should('include', '/welcome');
        cy.contains('Welcome, newuser!');
    });

    it('should show validation messages for invalid input', () => {
        cy.get('input[name="username"]').type(''); // empty username
        cy.get('button[type="submit"]').click();
        cy.contains('Username is required');

        cy.get('input[name="email"]').type('invalid-email'); // invalid email
        cy.get('button[type="submit"]').click();
        cy.contains('Email is invalid');

        cy.get('input[name="password"]').type('short'); // short password
        cy.get('button[type="submit"]').click();
        cy.contains('Password must be at least 8 characters');

        cy.get('input[name="confirmPassword"]').type('differentpassword'); // passwords do not match
        cy.get('button[type="submit"]').click();
        cy.contains('Passwords do not match');
    });
});