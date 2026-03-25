/// <reference types="cypress" />
import { seedHireFlowLoggedIn, jobsTableDataRows, fillJobsSearch } from '../support/session';

describe('Jobs page clear filters', () => {
  it('clears search and shows all jobs', () => {
    cy.intercept('GET', 'http://localhost:8080/jobs', { fixture: 'jobs.json' }).as('jobsList');
    cy.visit('/jobs', {
      onBeforeLoad: (win) => seedHireFlowLoggedIn(win),
    });
    cy.wait('@jobsList');

    fillJobsSearch('Designer');
    cy.get(jobsTableDataRows).should('have.length', 1);

    cy.get('[data-cy="jobs-clear-filters-btn"]').click();

    cy.get(jobsTableDataRows).should('have.length', 3);
    cy.get('[data-cy="jobs-search-input"]').should('have.value', '');
  });
});
