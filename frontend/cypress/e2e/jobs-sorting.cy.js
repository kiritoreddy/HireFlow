function seedLoggedInSession(win) {
  win.sessionStorage.setItem('hireflow_logged_in', 'true');
  win.sessionStorage.setItem('hireflow_access_token', 'dummy-token');
  win.sessionStorage.setItem(
    'hireflow_user',
    JSON.stringify({ name: 'Admin', email: 'admin@hireflow.com', role: 'admin' })
  );
}

describe('Jobs page sorting', () => {
  beforeEach(() => {
    cy.intercept('GET', 'http://localhost:8080/jobs', { fixture: 'jobs-list.json' }).as('jobsList');
  });

  it('sorts by Title (ascending then descending)', () => {
    cy.visit('/jobs', {
      onBeforeLoad: (win) => seedLoggedInSession(win),
    });
    cy.wait('@jobsList');

    const getFirstJobTitle = () =>
      cy
        .get('table.jobs-table tr.mat-row .cell-title')
        .first()
        .invoke('text')
        .then((t) => t.trim());

    getFirstJobTitle().should('eq', 'Senior Software Engineer');

    cy.contains('table.jobs-table th[mat-sort-header]', 'Title').click();
    getFirstJobTitle().should('eq', 'Data Analyst');

    cy.contains('table.jobs-table th[mat-sort-header]', 'Title').click();
    getFirstJobTitle().should('eq', 'Senior Software Engineer');
  });
});
