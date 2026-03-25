/// <reference types="cypress" />

/** Pretend the user is signed in before the Angular app bootstraps. */
export function seedHireFlowLoggedIn(win: Cypress.AUTWindow, role = 'admin'): void {
  win.sessionStorage.setItem('hireflow_logged_in', 'true');
  win.sessionStorage.setItem('hireflow_access_token', 'dummy-token');
  win.sessionStorage.setItem(
    'hireflow_user',
    JSON.stringify({ name: 'Admin', email: 'admin@hireflow.com', role })
  );
}
