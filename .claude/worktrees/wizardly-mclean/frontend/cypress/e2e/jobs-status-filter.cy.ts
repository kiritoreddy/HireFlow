/// <reference types="cypress" />
import { seedHireFlowLoggedIn, jobsTableDataRows } from '../support/session';

describe('Jobs page status filter', () => {
  it('filters rows when selecting Closed', () => {
    cy.intercept('GET', 'http://localhost:8080/jobs', { fixture: 'jobs.json' }).as('jobsList');
    cy.visit('/jobs', {
      onBeforeLoad: (win) => seedHireFlowLoggedIn(win),
    });
    cy.wait('@jobsList');

    cy.get('[data-cy="jobs-status-select"]').click();
    cy.contains('mat-option', 'Closed').click();

    cy.get(jobsTableDataRows).should('have.length', 1);
    cy.contains('.cell-title', 'Data Analyst').should('exist');
    cy.contains('.cell-title', 'Senior Software Engineer').should('not.exist');
    cy.contains('.cell-title', 'Product Designer').should('not.exist');
  });
});
