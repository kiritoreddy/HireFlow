/// <reference types="cypress" />
import { seedHireFlowLoggedIn } from '../support/session';

describe('Candidate portal', () => {
  it('lists open jobs and links to apply', () => {
    cy.intercept('GET', 'http://localhost:8080/jobs', { fixture: 'jobs.json' }).as('jobsList');
    cy.intercept('GET', 'http://localhost:8080/jobs/1', { fixture: 'job-detail-1.json' }).as('job1');
    cy.intercept('GET', 'http://localhost:8080/api/candidate/me/applications', []).as('myAppsEmpty');
    cy.visit('/portal/jobs', {
      onBeforeLoad: (win) => seedHireFlowLoggedIn(win, 'candidate'),
    });
    cy.wait('@jobsList');
    cy.get('[data-cy="portal-jobs-title"]').should('contain.text', 'Open roles');
    cy.get('[data-cy="portal-job-list"]').should('exist');
    cy.contains('[data-cy="portal-view-job"]', 'View').first().click();
    cy.wait(['@job1', '@myAppsEmpty']);
    cy.location('pathname').should('match', /^\/portal\/jobs\/\d+$/);
    cy.get('[data-cy="portal-apply-form"]').should('exist');
  });

  it('shows already applied on job detail when a non-withdrawn application exists', () => {
    cy.intercept('GET', 'http://localhost:8080/jobs/1', { fixture: 'job-detail-1.json' }).as('job1');
    cy.intercept('GET', 'http://localhost:8080/api/candidate/me/applications', {
      fixture: 'my-applications.json',
    }).as('myApps');
    cy.visit('/portal/jobs/1', {
      onBeforeLoad: (win) => seedHireFlowLoggedIn(win, 'candidate'),
    });
    cy.wait(['@job1', '@myApps']);
    cy.get('[data-cy="portal-already-applied"]').should('exist');
    cy.get('[data-cy="portal-applied-status"]').should('contain.text', 'Applied');
  });

  it('loads my applications', () => {
    cy.intercept('GET', 'http://localhost:8080/api/candidate/me/applications', {
      fixture: 'my-applications.json',
    }).as('myApps');
    cy.visit('/portal/applications', {
      onBeforeLoad: (win) => seedHireFlowLoggedIn(win, 'candidate'),
    });
    cy.wait('@myApps');
    cy.get('[data-cy="portal-apps-title"]').should('contain.text', 'My applications');
    cy.contains('td', 'Senior Software Engineer').should('exist');
    cy.get('[data-cy="portal-app-status"]').first().should('contain.text', 'Applied');
  });
});
