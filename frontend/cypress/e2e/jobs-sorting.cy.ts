/// <reference types="cypress" />
import { seedHireFlowLoggedIn } from '../support/session';

describe('Jobs page sorting', () => {
  it('sorts by Title (ascending then descending)', () => {
    cy.intercept('GET', 'http://localhost:8080/jobs', { fixture: 'jobs.json' });
    cy.visit('/jobs', {
      onBeforeLoad: (win) => seedHireFlowLoggedIn(win),
    });

    const getFirstJobTitle = () =>
      cy
        .get('table.jobs-table tr.mat-row .cell-title')
        .first()
        .invoke('text')
        .then((t) => t.trim());

    // Fixture order: Senior SE, Product Designer, Data Analyst
    getFirstJobTitle().should('eq', 'Senior Software Engineer');

    cy.contains('table.jobs-table th[mat-sort-header]', 'Title').click();
    getFirstJobTitle().should('eq', 'Data Analyst');

    cy.contains('table.jobs-table th[mat-sort-header]', 'Title').click();
    getFirstJobTitle().should('eq', 'Senior Software Engineer');
  });
});
