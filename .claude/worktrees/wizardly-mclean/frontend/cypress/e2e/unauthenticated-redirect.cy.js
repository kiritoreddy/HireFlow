describe('Unauthenticated navigation', () => {
  it('redirects /jobs to /login', () => {
    cy.visit('/jobs');
    cy.location('pathname').should('eq', '/login');
  });
});

