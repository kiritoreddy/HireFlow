function seedLoggedInSession(win) {
  win.sessionStorage.setItem('hireflow_logged_in', 'true');
  win.sessionStorage.setItem('hireflow_access_token', 'dummy-token');
  win.sessionStorage.setItem(
    'hireflow_user',
    JSON.stringify({ name: 'Admin', email: 'admin@hireflow.com', role: 'admin' })
  );
}

describe('Jobs page clear filters', () => {
  it('clears search and shows all jobs', () => {
    cy.visit('/jobs', {
      onBeforeLoad: (win) => seedLoggedInSession(win),
    });

    cy.get('[data-cy="jobs-search-input"]').clear().type('Designer');
    cy.get('table.jobs-table tr.mat-row').should('have.length', 1);

    cy.get('[data-cy="jobs-clear-filters-btn"]').click();

    cy.get('table.jobs-table tr.mat-row').should('have.length', 3);
    cy.get('[data-cy="jobs-search-input"]').should('have.value', '');
  });
});

