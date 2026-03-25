/// <reference types="cypress" />
import { seedHireFlowLoggedIn } from '../support/session';

describe('Job candidates page', () => {
  it('lists applications for a job from stubbed API', () => {
    cy.intercept('GET', 'http://localhost:8080/jobs/1', { fixture: 'job-detail-1.json' });
    cy.intercept('GET', 'http://localhost:8080/api/candidate/jobs/1/applications', {
      fixture: 'candidates-job-1.json',
    });
    cy.visit('/jobs/1/candidates', {
      onBeforeLoad: (win) => seedHireFlowLoggedIn(win),
    });

    cy.contains('h1.page-title', 'Candidates for Senior Software Engineer').should('be.visible');
    cy.contains('td', 'Harper Moore').should('exist');
    cy.contains('td', 'harper@email.com').should('exist');
  });
});
