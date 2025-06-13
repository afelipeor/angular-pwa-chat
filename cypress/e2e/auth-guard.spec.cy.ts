describe('Auth Guard', () => {
  beforeEach(() => {
    // Clear auth state
    cy.window().then((win) => {
      win.localStorage.clear();
      win.sessionStorage.clear();
    });
  });

  describe('Protected Routes', () => {
    it('should redirect to login when accessing chat without authentication', () => {
      cy.visit('/chat');
      cy.url().should('include', '/auth/login');
    });

    it('should redirect to login when accessing new chat without authentication', () => {
      cy.visit('/chat/new');
      cy.url().should('include', '/auth/login');
    });

    it('should allow access to chat when authenticated', () => {
      // Mock authentication
      cy.window().then((win) => {
        win.localStorage.setItem('auth_token', 'mock-token');
        win.localStorage.setItem('current_user', JSON.stringify({
          id: '1',
          name: 'Test User',
          email: 'test@example.com'
        }));
      });

      cy.intercept('GET', '**/api/chats', []).as('getChats');
      cy.visit('/chat');
      cy.url().should('include', '/chat');
      cy.url().should('not.include', '/auth/login');
    });
  });

  describe('Guest Routes', () => {
    it('should allow access to login when not authenticated', () => {
      cy.visit('/auth/login');
      cy.url().should('include', '/auth/login');
    });

    it('should redirect authenticated users away from login', () => {
      // Mock authentication
      cy.window().then((win) => {
        win.localStorage.setItem('auth_token', 'mock-token');
        win.localStorage.setItem('current_user', JSON.stringify({
          id: '1',
          name: 'Test User',
          email: 'test@example.com'
        }));
      });

      cy.visit('/auth/login');
      cy.url().should('not.include', '/auth/login');
      cy.url().should('include', '/chat');
    });
  });

  describe('Token Expiration', () => {
    it('should redirect to login when token is expired', () => {
      // Create expired token (simplified - in real app this would be a proper JWT)
      const expiredToken = btoa(JSON.stringify({
        exp: Math.floor(Date.now() / 1000) - 3600 // Expired 1 hour ago
      }));

      cy.window().then((win) => {
        win.localStorage.setItem('auth_token', `header.${expiredToken}.signature`);
        win.localStorage.setItem('current_user', JSON.stringify({
          id: '1',
          name: 'Test User',
          email: 'test@example.com'
        }));
      });

      cy.visit('/chat');
      cy.url().should('include', '/auth/login');
    });
  });
});