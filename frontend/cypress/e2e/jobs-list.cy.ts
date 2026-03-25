/// <reference types="cypress" />

function seedLoggedInSession(win: Window) {
  win.sessionStorage.setItem('hireflow_logged_in', 'true');
  win.sessionStorage.setItem('hireflow_access_token', 'dummy-token');
  win.sessionStorage.setItem(
    'hireflow_user',
    JSON.stringify({ name: 'Test', email: 't@hireflow.com', role: 'hiring_manager' })
  );
}

describe('Jobs list (API stubbed)', () => {
  it('shows jobs from intercepted GET /jobs', () => {
    cy.intercept('GET', 'http://localhost:8080/jobs', { fixture: 'jobs-list.json' }).as('jobsList');

    cy.visit('/jobs', {
      onBeforeLoad: (win) => seedLoggedInSession(win),
    });
    cy.wait('@jobsList');

    cy.contains('table.jobs-table', 'Senior Software Engineer').should('be.visible');
    cy.contains('table.jobs-table', 'Data Analyst').should('be.visible');
  });
});
