/// <reference types="cypress" />
import { seedHireFlowLoggedIn, jobsTableDataRows } from '../support/session';

describe('Jobs page (logged-in)', () => {
  it('renders jobs table with stubbed jobs API', () => {
    cy.intercept('GET', 'http://localhost:8080/jobs', { fixture: 'jobs.json' }).as('jobsList');
    cy.visit('/jobs', {
      onBeforeLoad: (win) => seedHireFlowLoggedIn(win),
    });
    cy.wait('@jobsList');

    cy.get('[data-cy="jobs-title"]').should('contain.text', 'Jobs');
    cy.get('table.jobs-table').should('exist');

    cy.get(jobsTableDataRows).should('have.length.at.least', 1);
    cy.contains('.cell-title', 'Senior Software Engineer').should('exist');
    cy.contains('.cell-title', 'Product Designer').should('exist');
    cy.contains('.cell-title', 'Data Analyst').should('exist');

    cy.get('[data-cy="jobs-stat-total-value"]').should(($el) => {
      expect($el.text().trim()).to.eq('3');
    });
    cy.get('[data-cy="jobs-stat-open-value"]').should(($el) => {
      expect($el.text().trim()).to.eq('2');
    });
    cy.get('[data-cy="jobs-stat-closed-value"]').should(($el) => {
      expect($el.text().trim()).to.eq('1');
    });
  });
});
