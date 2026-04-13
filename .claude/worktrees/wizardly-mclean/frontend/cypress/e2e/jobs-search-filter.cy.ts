/// <reference types="cypress" />
import { seedHireFlowLoggedIn, jobsTableDataRows, fillJobsSearch } from '../support/session';

describe('Jobs page search', () => {
  it('filters rows when typing in search box', () => {
    cy.intercept('GET', 'http://localhost:8080/jobs', { fixture: 'jobs.json' }).as('jobsList');
    cy.visit('/jobs', {
      onBeforeLoad: (win) => seedHireFlowLoggedIn(win),
    });
    cy.wait('@jobsList');

    fillJobsSearch('Designer');

    cy.get(jobsTableDataRows).should('have.length', 1);
    cy.contains('.cell-title', 'Product Designer').should('exist');
    cy.contains('.cell-title', 'Senior Software Engineer').should('not.exist');
    cy.contains('.cell-title', 'Data Analyst').should('not.exist');
  });
});
