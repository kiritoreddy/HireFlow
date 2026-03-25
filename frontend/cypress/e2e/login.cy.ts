/// <reference types="cypress" />
describe('Login page', () => {
  it('allows typing email and toggling password visibility', () => {
    cy.visit('http://localhost:4200/login');

    cy.contains('Sign in to HireFlow').should('be.visible');

    cy.get('input[name="email"]').type('admin@example.com');
    cy.get('input[name="email"]').should('have.value', 'admin@example.com');

    cy.get('input[name="password"]').type('testpassword');
    cy.get('input[name="password"]').should('have.attr', 'type', 'password');

    cy.get('button[aria-label="Show password"]').click();
    cy.get('input[name="password"]').should('have.attr', 'type', 'text');

    cy.get('button[aria-label="Hide password"]').click();
    cy.get('input[name="password"]').should('have.attr', 'type', 'password');
  });
});