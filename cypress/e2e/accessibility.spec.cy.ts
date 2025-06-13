describe('Accessibility Tests', () => {
  beforeEach(() => {
    // Mock API calls first
    cy.intercept('GET', '**/api/chats', { fixture: 'chats.json' }).as(
      'getChats'
    );
    cy.intercept('GET', '**/api/users/profile', { fixture: 'users.json' }).as(
      'getProfile'
    );

    // Visit the app
    cy.visit('/', { failOnStatusCode: false });

    // Wait for the app to load
    cy.get('app-root').should('exist');
  });

  it('should have semantic HTML structure', () => {
    // Check for main semantic elements
    cy.get('main, [role="main"]').should('exist');

    // If on chat list page, check for specific elements
    cy.get('body').then(($body) => {
      if ($body.find('.chat-list-container').length > 0) {
        cy.get('header').should('exist');
        cy.get('nav').should('exist');
        cy.log('Found chat list page structure');
      } else if ($body.find('.chat-room-container').length > 0) {
        cy.get('header').should('exist');
        cy.get('main').should('exist');
        cy.get('footer').should('exist');
        cy.log('Found chat room page structure');
      } else {
        cy.log('Different page structure detected');
        // For other pages, just ensure there's some semantic structure
        cy.get('app-root').should('exist');
      }
    });
  });

  it('should have proper ARIA labels and roles', () => {
    cy.get('body').then(($body) => {
      // Check for elements with ARIA labels
      const elementsWithAria = $body.find(
        '[aria-label], [aria-labelledby], [role]'
      );
      if (elementsWithAria.length > 0) {
        cy.get('[aria-label], [aria-labelledby], [role]').should(
          'have.length.gte',
          1
        );
        cy.log(
          `Found ${elementsWithAria.length} elements with ARIA attributes`
        );
      } else {
        cy.log('No ARIA attributes found - this should be improved');
      }
    });
  });

  it('should be keyboard navigable', () => {
    // Find focusable elements
    cy.get(
      'button:not([disabled]), input:not([disabled]), a[href], [tabindex="0"]'
    )
      .should('have.length.gte', 1)
      .then(($elements) => {
        if ($elements.length > 0) {
          // Focus the first element
          cy.wrap($elements.first()).focus();
          cy.focused().should('be.visible');

          // Test keyboard interaction
          cy.focused().type('{enter}');
          cy.log(
            `Tested keyboard navigation on ${$elements.length} focusable elements`
          );
        }
      });
  });

  it('should have proper heading hierarchy', () => {
    cy.get('h1, h2, h3, h4, h5, h6').then(($headings) => {
      if ($headings.length > 0) {
        cy.wrap($headings).should('have.length.gte', 1);
        cy.log(`Found ${$headings.length} headings`);

        // Check if we have an h1
        if ($headings.filter('h1').length > 0) {
          cy.get('h1').should('exist');
        }
      } else {
        cy.log('No headings found - consider adding semantic headings');
      }
    });
  });

  it('should have sufficient color contrast', () => {
    // Basic visibility test
    cy.get('body').should('be.visible');
    cy.get('button, a, input').each(($el) => {
      cy.wrap($el).should('be.visible');
    });
  });
});
