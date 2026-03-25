/// <reference types="cypress" />
describe('Login page', () => {
  it('allows typing email and toggling password visibility', () => {
    cy.visit('/login');

    cy.contains('mat-card-title', 'Sign in').should('be.visible');

    cy.get('input[name="email"]').type('admin@example.com');
    cy.get('input[name="email"]').should('have.value', 'admin@example.com');

    cy.get('input[name="password"]').type('testpassword');
    cy.get('input[name="password"]').should('have.attr', 'type', 'password');

    cy.get('button[aria-label="Show password"]').click();
    cy.get('input[name="password"]').should('have.attr', 'type', 'text');

    cy.get('button[aria-label="Hide password"]').click();
    cy.get('input[name="password"]').should('have.attr', 'type', 'password');
  });

  it('navigates to dashboard after successful API login', () => {
    cy.intercept('POST', 'http://localhost:8080/auth/login', { fixture: 'login-success.json' }).as(
      'loginPost'
    );
    cy.visit('/login');
    cy.get('input[name="email"]').type('test@hireflow.com');
    cy.get('input[name="password"]').type('any-password');
    cy.contains('button.submit-btn', 'Sign in').click();
    cy.wait('@loginPost');
    cy.location('pathname').should('eq', '/');
  });
});