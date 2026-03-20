function seedLoggedInSession(win) {
  win.sessionStorage.setItem('hireflow_logged_in', 'true');
  win.sessionStorage.setItem('hireflow_access_token', 'dummy-token');
  win.sessionStorage.setItem(
    'hireflow_user',
    JSON.stringify({ name: 'Admin', email: 'admin@hireflow.com', role: 'admin' })
  );
}

describe('Jobs page search', () => {
  it('filters rows when typing in search box', () => {
    cy.visit('/jobs', {
      onBeforeLoad: (win) => seedLoggedInSession(win),
    });

    cy.get('[data-cy="jobs-search-input"]')
      .should('exist')
      .clear()
      .type('Designer');

    cy.get('table.jobs-table tr.mat-row').should('have.length', 1);
    cy.contains('.cell-title', 'Product Designer').should('exist');
    cy.contains('.cell-title', 'Senior Software Engineer').should('not.exist');
    cy.contains('.cell-title', 'Data Analyst').should('not.exist');
  });
});

