/// <reference types="cypress" />
import { seedHireFlowLoggedIn } from '../support/session';

describe('Users page (admin)', () => {
  it('loads user list from stubbed API', () => {
    cy.intercept('GET', 'http://localhost:8080/users', { fixture: 'users.json' });
    cy.visit('/users', {
      onBeforeLoad: (win) => seedHireFlowLoggedIn(win, 'admin'),
    });

    cy.contains('h1.page-title', 'Users').should('be.visible');
    cy.contains('td', 'alice@hireflow.com').should('exist');
    cy.contains('td', 'bob@hireflow.com').should('exist');
  });
});
