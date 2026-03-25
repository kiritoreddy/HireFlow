/// <reference types="cypress" />
import { seedHireFlowLoggedIn, jobsTableDataRows } from '../support/session';

describe('Jobs page sorting', () => {
  it('sorts by Title (ascending then descending)', () => {
    cy.intercept('GET', 'http://localhost:8080/jobs', { fixture: 'jobs.json' }).as('jobsList');
    cy.visit('/jobs', {
      onBeforeLoad: (win) => seedHireFlowLoggedIn(win),
    });
    cy.wait('@jobsList');

    const getFirstJobTitle = () =>
      cy.get(jobsTableDataRows).first().find('.cell-title').invoke('text').then((t) => t.trim());

    // Fixture order: Senior SE, Product Designer, Data Analyst
    getFirstJobTitle().should('eq', 'Senior Software Engineer');

    cy.get('[data-cy="jobs-sort-title"]').click();
    cy.get('[data-cy="jobs-sort-title"]').then(($th) => {
      const aria = ($th.attr('aria-sort') || '').toLowerCase();
      if (aria !== 'ascending') cy.wrap($th).click();
    });
    getFirstJobTitle().should('eq', 'Data Analyst');

    cy.get('[data-cy="jobs-sort-title"]').click();
    getFirstJobTitle().should('eq', 'Senior Software Engineer');
  });
});
