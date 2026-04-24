/// <reference types="cypress" />
import { seedHireFlowLoggedIn } from '../support/session';

describe('Interviewer portal', () => {
  beforeEach(() => {
    cy.intercept('GET', 'http://localhost:8080/interviews/my', {
      body: [
        {
          id: 1,
          application_id: 10,
          interviewer_id: 3,
          scheduled_date: '2026-05-01T10:00:00Z',
          interview_type: 'TECHNICAL',
          status: 'SCHEDULED',
          candidate_name: 'Jane Doe',
          job_title: 'Frontend Engineer',
        },
        {
          id: 2,
          application_id: 11,
          interviewer_id: 3,
          scheduled_date: '2026-04-20T14:00:00Z',
          interview_type: 'BEHAVIORAL',
          status: 'COMPLETED',
          candidate_name: 'John Smith',
          job_title: 'Backend Engineer',
          feedback: {
            id: 1,
            interview_id: 2,
            interviewer_id: 3,
            rating: 4,
            technical_score: 4,
            communication: 3,
            recommendation: 'HIRE',
            submitted_at: '2026-04-20T16:00:00Z',
          },
        },
      ],
    }).as('myInterviews');
  });

  it('redirects non-interviewer to /dashboard', () => {
    cy.visit('/interviewer/interviews', {
      onBeforeLoad(win) {
        seedHireFlowLoggedIn(win, 'admin');
      },
    });
    cy.location('pathname').should('eq', '/dashboard');
  });

  it('shows assigned interviews for interviewer', () => {
    cy.visit('/interviewer/interviews', {
      onBeforeLoad(win) {
        seedHireFlowLoggedIn(win, 'interviewer');
      },
    });
    cy.wait('@myInterviews');
    cy.contains('Jane Doe').should('be.visible');
    cy.contains('John Smith').should('be.visible');
  });

  it('shows stat cards with correct counts', () => {
    cy.visit('/interviewer/interviews', {
      onBeforeLoad(win) {
        seedHireFlowLoggedIn(win, 'interviewer');
      },
    });
    cy.wait('@myInterviews');
    cy.contains('1').should('be.visible'); // 1 upcoming
    cy.contains('Upcoming').should('be.visible');
    cy.contains('Completed').should('be.visible');
  });

  it('navigates to feedback form on Submit Feedback click', () => {
    cy.intercept('GET', 'http://localhost:8080/interviews/1', {
      body: {
        id: 1,
        application_id: 10,
        interviewer_id: 3,
        scheduled_date: '2026-05-01T10:00:00Z',
        interview_type: 'TECHNICAL',
        status: 'SCHEDULED',
        candidate_name: 'Jane Doe',
        job_title: 'Frontend Engineer',
      },
    }).as('getInterview');

    cy.visit('/interviewer/interviews', {
      onBeforeLoad(win) {
        seedHireFlowLoggedIn(win, 'interviewer');
      },
    });
    cy.wait('@myInterviews');
    cy.contains('button', 'Submit Feedback').first().click();
    cy.location('pathname').should('include', '/interviewer/interviews/');
    cy.location('pathname').should('include', '/feedback');
  });
});
