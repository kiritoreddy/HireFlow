/// <reference types="cypress" />
describe('Login page', () => {
  it('allows typing email and toggling password visibility', () => {
    cy.visit('/login');

    cy.contains('mat-card-title', 'Sign in').should('be.visible');

    cy.get('input[name="email"]').type('admin@example.com');
    cy.get('input[name="email"]').should('have.value', 'admin@example.com');

    cy.get('input[name="password"]').type('testpassword');
    cy.get('input[name="password"]').should('have.attr', 'type', 'password');

    cy.get('button[aria-label="Show password"]').click();
    cy.get('input[name="password"]').should('have.attr', 'type', 'text');

    cy.get('button[aria-label="Hide password"]').click();
    cy.get('input[name="password"]').should('have.attr', 'type', 'password');
  });

  it('navigates to dashboard after successful API login', () => {
    const loginBody = {
      user: {
        id: 1,
        name: 'Test User',
        email: 'test@hireflow.com',
        role: 'admin',
        is_active: true,
      },
      access_token: 'e2e-test-token',
      expires_in: 3600,
    };

    // Cross-origin POST may issue a CORS preflight first; stub it so a stopped backend does not block login.
    cy.intercept({ method: 'OPTIONS', pathname: '/auth/login' }, {
      statusCode: 204,
      headers: {
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'POST, OPTIONS',
        'access-control-allow-headers': '*',
      },
    });
    // Match by pathname so host (localhost vs 127.0.0.1) cannot break the stub.
    cy.intercept({ method: 'POST', pathname: '/auth/login' }, { statusCode: 200, body: loginBody }).as(
      'loginPost'
    );

    // Stubbed login uses a non-JWT string (`e2e-test-token`). The real API would 401 and the
    // auth interceptor would logout — breaking this test. Stub dashboard data so navigation sticks.
    cy.intercept({ method: 'GET', pathname: '/dashboard/stats' }, {
      statusCode: 200,
      body: {
        totalJobs: 3,
        openJobs: 2,
        closedJobs: 1,
        totalCandidates: 2,
        totalUsers: 5,
        departmentSummary: [{ department: 'Engineering', openCount: 2, closedCount: 0 }],
      },
    }).as('dashboardStats');
    cy.intercept({ method: 'GET', pathname: '/jobs' }, { fixture: 'jobs.json' }).as('jobsList');

    cy.visit('/login', {
      onBeforeLoad(win) {
        win.sessionStorage.clear();
      },
    });

    cy.get('input[name="email"]').should('be.visible').clear().type('test@hireflow.com').blur();
    cy.get('input[name="password"]').should('be.visible').clear().type('any-password').blur();
    // Material overlay can steal clicks in headless runs; force avoids flaky submit.
    cy.get('button[type="submit"].submit-btn').should('contain', 'Sign in').click({ force: true });

    cy.wait('@loginPost').then((i) => {
      expect(i.response?.statusCode).to.eq(200);
    });

    cy.get('.login-page p.error').should('not.exist');

    // Storage keys are not Cypress `its()` paths — use getItem. Retry until Angular tap() runs.
    cy.window().should((win) => {
      expect(win.sessionStorage.getItem('hireflow_logged_in')).to.eq('true');
      expect(win.sessionStorage.getItem('hireflow_access_token')).to.be.a('string').and.not.be.empty;
    });

    // Login navigates to `/` first; HomeRedirect then sends admin users to `/dashboard`.
    cy.location('pathname', { timeout: 10000 }).should('eq', '/dashboard');
  });
});