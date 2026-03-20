function seedLoggedInSession(win) {
  win.sessionStorage.setItem('hireflow_logged_in', 'true');
  win.sessionStorage.setItem('hireflow_access_token', 'dummy-token');
  win.sessionStorage.setItem(
    'hireflow_user',
    JSON.stringify({ name: 'Admin', email: 'admin@hireflow.com', role: 'admin' })
  );
}

describe('Jobs page (logged-in)', () => {
  it('renders jobs table with seeded sessionStorage', () => {
    cy.visit('/jobs', {
      onBeforeLoad: (win) => seedLoggedInSession(win),
    });

    cy.get('.page-title').should('contain.text', 'Jobs');
    cy.get('table.jobs-table').should('exist');

    cy.get('table.jobs-table tr.mat-row').should('have.length.at.least', 1);
    cy.contains('.cell-title', 'Senior Software Engineer').should('exist');
    cy.contains('.cell-title', 'Product Designer').should('exist');
    cy.contains('.cell-title', 'Data Analyst').should('exist');
  });
});

