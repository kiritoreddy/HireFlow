function seedLoggedInSession(win) {
  win.sessionStorage.setItem('hireflow_logged_in', 'true');
  win.sessionStorage.setItem('hireflow_access_token', 'dummy-token');
  win.sessionStorage.setItem(
    'hireflow_user',
    JSON.stringify({ name: 'Admin', email: 'admin@hireflow.com', role: 'admin' })
  );
}

describe('Jobs page status filter', () => {
  it('filters rows when selecting Closed', () => {
    cy.visit('/jobs', {
      onBeforeLoad: (win) => seedLoggedInSession(win),
    });

    cy.get('[data-cy="jobs-status-select"]').click();
    cy.contains('mat-option', 'Closed').click();

    cy.get('table.jobs-table tr.mat-row').should('have.length', 1);
    cy.contains('.cell-title', 'Data Analyst').should('exist');
    cy.contains('.cell-title', 'Senior Software Engineer').should('not.exist');
    cy.contains('.cell-title', 'Product Designer').should('not.exist');
  });
});

