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

    cy.get('input[placeholder="Title, description, department..."]').clear().type('Designer');
    cy.get('table.jobs-table tr.mat-row').should('have.length', 1);

    cy.get('button.clear-btn').click();

    cy.get('table.jobs-table tr.mat-row').should('have.length', 3);
    cy.get('input[placeholder="Title, description, department..."]').should('have.value', '');
  });
});

