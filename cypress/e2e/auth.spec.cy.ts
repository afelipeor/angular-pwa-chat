describe('Authentication Flow', () => {
  beforeEach(() => {
    // Clear any existing auth state
    cy.window().then((win) => {
      win.localStorage.clear();
      win.sessionStorage.clear();
    });
  });

  describe('Login', () => {
    it('should display login form', () => {
      cy.visit('/auth/login');

      // Wait for the page to load and check for various possible selectors
      cy.get('body').should('not.be.empty');

      // Try multiple selectors for the login form
      cy.get('[data-cy="login-form"], .login-form, form').should('be.visible');

      // Check for email and password inputs with flexible selectors
      cy.get(
        '[data-cy="email"], input[type="email"], input[name="email"]'
      ).should('be.visible');
      cy.get(
        '[data-cy="password"], input[type="password"], input[name="password"]'
      ).should('be.visible');
      cy.get(
        '[data-cy="login-submit"], button[type="submit"], .btn-primary'
      ).should('be.visible');
    });

    it('should login successfully with valid credentials', () => {
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

      // Wait for form to be visible
      cy.get('[data-cy="login-form"], .login-form, form', {
        timeout: 10000,
      }).should('be.visible');

      // Fill in the form with flexible selectors
      cy.get('[data-cy="email"], input[type="email"], input[name="email"]')
        .clear()
        .type('test@example.com');

      cy.get(
        '[data-cy="password"], input[type="password"], input[name="password"]'
      )
        .clear()
        .type('password123');

      cy.get(
        '[data-cy="login-submit"], button[type="submit"], .btn-primary'
      ).click();

      // Wait for login request and verify redirect
      cy.wait('@loginRequest');
      cy.url().should('not.include', '/auth/login');
    });

    it('should show error for invalid credentials', () => {
      cy.intercept('POST', '**/api/auth/login', {
        statusCode: 401,
        body: { message: 'Invalid credentials' },
      }).as('loginError');

      cy.visit('/auth/login');

      cy.get('[data-cy="email"], input[type="email"]').type(
        'invalid@example.com'
      );
      cy.get('[data-cy="password"], input[type="password"]').type(
        'wrongpassword'
      );
      cy.get('[data-cy="login-submit"], button[type="submit"]').click();

      cy.wait('@loginError');
      cy.get('[data-cy="error-message"], .alert-danger, .error').should(
        'be.visible'
      );
    });

    it('should show validation errors for empty fields', () => {
      cy.visit('/auth/login');

      // Try to submit empty form
      cy.get('[data-cy="login-submit"], button[type="submit"]').click();

      // Check for validation states (Angular adds these classes)
      cy.get('[data-cy="email"], input[type="email"]').should(
        'have.class',
        'ng-invalid'
      );
      cy.get('[data-cy="password"], input[type="password"]').should(
        'have.class',
        'ng-invalid'
      );

      // Check for error messages if they exist
      cy.get('body').then(($body) => {
        if (
          $body.find('[data-cy="email-error"], .invalid-feedback').length > 0
        ) {
          cy.get('[data-cy="email-error"], .invalid-feedback').should(
            'be.visible'
          );
        }
      });
    });
  });

  describe('Registration', () => {
    it('should display registration form', () => {
      cy.visit('/auth/register');

      cy.get('[data-cy="register-form"], .register-form, form').should(
        'be.visible'
      );
      cy.get('[data-cy="name"], input[name="name"]').should('be.visible');
      cy.get('[data-cy="email"], input[type="email"]').should('be.visible');
      cy.get('[data-cy="password"], input[type="password"]')
        .first()
        .should('be.visible');
      cy.get(
        '[data-cy="confirm-password"], input[name="confirmPassword"]'
      ).should('be.visible');
    });

    it('should register a new user successfully', () => {
      cy.intercept('POST', '**/api/auth/register', {
        statusCode: 201,
        body: {
          access_token: 'mock-jwt-token',
          user: {
            id: '2',
            name: 'New User',
            email: 'newuser@example.com',
            status: 'online',
          },
        },
      }).as('registerRequest');

      cy.visit('/auth/register');

      cy.get('[data-cy="name"], input[name="name"]').type('New User');
      cy.get('[data-cy="email"], input[type="email"]').type(
        'newuser@example.com'
      );
      cy.get('[data-cy="password"], input[type="password"]')
        .first()
        .type('password123');
      cy.get(
        '[data-cy="confirm-password"], input[name="confirmPassword"]'
      ).type('password123');
      cy.get('[data-cy="register-submit"], button[type="submit"]').click();

      cy.wait('@registerRequest');
      cy.url().should('not.include', '/auth/register');
    });

    it('should show error for password mismatch', () => {
      cy.visit('/auth/register');

      cy.get('[data-cy="name"], input[name="name"]').type('Test User');
      cy.get('[data-cy="email"], input[type="email"]').type('test@example.com');
      cy.get('[data-cy="password"], input[type="password"]')
        .first()
        .type('password123');
      cy.get(
        '[data-cy="confirm-password"], input[name="confirmPassword"]'
      ).type('differentpassword');
      cy.get('[data-cy="register-submit"], button[type="submit"]').click();

      cy.get('[data-cy="password-mismatch-error"], .invalid-feedback').should(
        'be.visible'
      );
    });
  });
});
