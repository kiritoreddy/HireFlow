/// <reference types="cypress" />
import { seedHireFlowLoggedIn } from '../support/session';

describe('Job candidates page', () => {
  it('lists applications for a job from stubbed API', () => {
    cy.intercept('GET', 'http://localhost:8080/jobs/1', { fixture: 'job-detail-1.json' }).as('jobById');
    cy.intercept('GET', 'http://localhost:8080/api/jobs/1/applications', {
      fixture: 'candidates-job-1.json',
    }).as('jobApps');
    cy.visit('/jobs/1/candidates', {
      onBeforeLoad: (win) => seedHireFlowLoggedIn(win),
    });
    cy.wait('@jobById');
    cy.wait('@jobApps');

    cy.contains('h1.page-title', /^Candidates for /).should('be.visible');
    cy.contains('td', 'Harper Moore').should('exist');
    cy.contains('td', 'harper@email.com').should('exist');
  });
});
