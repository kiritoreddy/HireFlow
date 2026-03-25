/// <reference types="cypress" />
import { seedHireFlowLoggedIn } from '../support/session';

describe('Candidates overview', () => {
  it('shows job cards from stubbed jobs API', () => {
    cy.intercept('GET', 'http://localhost:8080/jobs', { fixture: 'jobs.json' });
    cy.visit('/candidates', {
      onBeforeLoad: (win) => seedHireFlowLoggedIn(win),
    });

    cy.contains('h1.page-title', 'Candidates').should('be.visible');
    cy.contains('.candidate-card', 'Senior Software Engineer')
      .find('.stat-box')
      .contains('.label', 'Applied')
      .parent()
      .find('.value')
      .should('have.text', '1');
  });
});
