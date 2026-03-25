/// <reference types="cypress" />

/**
 * Angular Material 15+ table rows use `mat-mdc-row` on `tr[mat-row]` — there is no `.mat-row` class,
 * so selectors like `tr.mat-row` never match.
 */
export const jobsTableDataRows = 'table.jobs-table tr.mat-mdc-row';

/**
 * Type into the jobs search field. Outline `mat-label` often sits above the native input in headless
 * runs, so normal clicks fail — use force for click/clear/type.
 */
export function fillJobsSearch(text: string): Cypress.Chainable {
  return cy
    .get('[data-cy="jobs-search-input"]')
    .should('exist')
    .focus({ force: true })
    .clear({ force: true })
    .type(text, { force: true });
}
/** Pretend the user is signed in before the Angular app bootstraps. */
export function seedHireFlowLoggedIn(win: Cypress.AUTWindow, role = 'admin'): void {
  win.sessionStorage.setItem('hireflow_logged_in', 'true');
  win.sessionStorage.setItem('hireflow_access_token', 'dummy-token');
  win.sessionStorage.setItem(
    'hireflow_user',
    JSON.stringify({ name: 'Admin', email: 'admin@hireflow.com', role })
  );
}
