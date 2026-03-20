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

    cy.get('[data-cy="jobs-title"]').should('contain.text', 'Jobs');
    cy.get('table.jobs-table').should('exist');

    cy.get('table.jobs-table tr.mat-row').should('have.length.at.least', 1);
    cy.contains('.cell-title', 'Senior Software Engineer').should('exist');
    cy.contains('.cell-title', 'Product Designer').should('exist');
    cy.contains('.cell-title', 'Data Analyst').should('exist');

    cy.get('[data-cy="jobs-stat-total-value"]').should(($el) => {
      expect($el.text().trim()).to.eq('3');
    });
    cy.get('[data-cy="jobs-stat-open-value"]').should(($el) => {
      expect($el.text().trim()).to.eq('2');
    });
    cy.get('[data-cy="jobs-stat-closed-value"]').should(($el) => {
      expect($el.text().trim()).to.eq('1');
    });
  });
});

