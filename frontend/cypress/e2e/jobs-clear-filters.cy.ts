/// <reference types="cypress" />
import { seedHireFlowLoggedIn } from '../support/session';

describe('Jobs page clear filters', () => {
  it('clears search and shows all jobs', () => {
    cy.intercept('GET', 'http://localhost:8080/jobs', { fixture: 'jobs.json' });
    cy.visit('/jobs', {
      onBeforeLoad: (win) => seedHireFlowLoggedIn(win),
    });

    cy.get('[data-cy="jobs-search-input"]').clear().type('Designer');
    cy.get('table.jobs-table tr.mat-row').should('have.length', 1);

    cy.get('[data-cy="jobs-clear-filters-btn"]').click();

    cy.get('table.jobs-table tr.mat-row').should('have.length', 3);
    cy.get('[data-cy="jobs-search-input"]').should('have.value', '');
  });
});
