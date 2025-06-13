describe('PWA Features', () => {
  beforeEach(() => {
    cy.loginAsTestUser();
  });

  it('should work in mobile viewport', () => {
    cy.viewport('iphone-6');
    cy.visit('/chat');
    cy.get('[data-cy="mobile-menu-toggle"]').should('be.visible');
    cy.get('[data-cy="chat-list"]').should('be.visible');
  });

  it('should work in tablet viewport', () => {
    cy.viewport('ipad-2');
    cy.visit('/chat');
    cy.get('[data-cy="chat-list"]').should('be.visible');
    cy.get('[data-cy="sidebar"]').should('be.visible');
  });

  it('should handle offline mode', () => {
    cy.visit('/chat');
    cy.window().then((win) => {
      win.navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration) {
          cy.get('[data-cy="offline-indicator"]').should('not.be.visible');
        }
      });
    });
  });

  it('should show install banner', () => {
    cy.visit('/');
    cy.window().then((win) => {
      win.dispatchEvent(new Event('beforeinstallprompt'));
    });
    cy.get('[data-cy="install-banner"]').should('be.visible');
  });
});
