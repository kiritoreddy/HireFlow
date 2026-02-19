# HireFlow — Sprint 1

---

# Presentation video links

---

# 1. Finalized User Stories (21)

## 🔐 Admin

1. **Create users and assign roles**  
   As an Admin, I can create internal users and assign roles so access to the system is controlled.

2. **Deactivate users**  
   As an Admin, I can deactivate users so former employees lose access without deleting historical data.

---

## 🧑‍💼 Hiring Manager

3. **Login to portal**  
   As a Hiring Manager, I can log in so I can access hiring features securely.

4. **Create job posting**  
   As a Hiring Manager, I can create job postings so candidates can apply to open roles.

5. **Edit and close jobs**  
   As a Hiring Manager, I can update or close job postings so job status remains accurate.

6. **View job dashboard**  
   As a Hiring Manager, I can view a dashboard of my jobs and candidate counts so I can track hiring progress.

7. **View candidates per job**  
   As a Hiring Manager, I can view candidates associated with a specific job so I can manage that pipeline.

8. **Move candidates across stages**  
   As a Hiring Manager, I can move candidates through hiring stages so their progress is tracked.

9. **Assign interviews**  
   As a Hiring Manager, I can assign interviewers to candidates so evaluations can take place.

10. **View interview feedback**  
    As a Hiring Manager, I can view interviewer feedback so I can make informed hiring decisions.

11. **Search candidates by name or email**  
    As a Hiring Manager, I can search candidates by name or email so I can quickly find specific applicants.

12. **Filter candidates by hiring stage**  
    As a Hiring Manager, I can filter candidates by stage so I can focus on specific parts of the pipeline.

---

## 🎯 Interviewer

13. **View assigned interviews**  
    As an Interviewer, I can see candidates assigned to me so I know whom to evaluate.

14. **View candidate profile**  
    As an Interviewer, I can view candidate details so I can prepare for interviews.

15. **Submit interview feedback**  
    As an Interviewer, I can submit structured feedback so hiring managers can review evaluations.

16. **View submitted feedback**  
    As an Interviewer, I can view my submitted feedback so I can reference past evaluations.

---

## 👤 Candidate

17. **View job listings**  
    As a Candidate, I can view open job listings so I can find relevant opportunities.

18. **Apply to job**  
    As a Candidate, I can apply to a job so my application enters the system.

19. **Track application status**  
    As a Candidate, I can track my application status so I know my progress in the hiring process.

20. **Withdraw application**  
    As a Candidate, I can withdraw my application so I am no longer considered for a role.

---

## 🔐 Cross-Role

21. **Reset password**  
    As a user, I can reset my password so I can regain access if I forget it.

---

# 2. Sprint 1 Selected Scope

For Sprint 1, the team intentionally focused on establishing a stable architectural foundation before implementing complete hiring workflows.

The selected focus areas were:

- Authentication (Login + JWT handling)
- Reset password functionality
- Role-based access control (frontend guards)
- Admin user management (create + deactivate users)
- Base application layout and navigation
- Backend Job entity and CRUD APIs
- Jobs table UI implementation
- Candidates UI structure
- Shared static data architecture for frontend state management

The primary objective of Sprint 1 was to establish secure access control and core system structure.

---

# 3. Fully Implemented in Sprint 1

The following user stories were completed end-to-end:

- Login to portal  
- Reset password  
- Create users and assign roles  
- Deactivate users  
- Jobs backend CRUD APIs  
- Jobs page table UI  
- Role-based navigation and route guards  

These features were successfully demonstrated during the sprint review.

---

# 4. Partial Implementation

During Sprint 1, the team identified several areas requiring further development and refinement:

## Frontend–Backend Integration
Some job and candidate-related features currently rely on shared static frontend data.  
Complete API integration between frontend and backend is planned for Sprint 2.

## Reset Password Enhancement
Currently, the reset password flow generates a demo token.  
In future sprints, this will be enhanced to send a secure reset link via email.

## Performance & UI Refinements
- Certain frontend interactions can be optimized for improved responsiveness.
- Minor UI inconsistencies and styling issues remain.
- Overall user flow can be refined for a smoother experience.

## Automated Testing
- Backend unit tests were not implemented during this sprint.
- Frontend component and integration tests are pending.
- Proper test coverage will be introduced in upcoming sprints.

---

# 5. Reasons for Partial Implementation

Several factors contributed to incomplete integration during Sprint 1:

- This was the team’s first experience working together in a structured frontend–backend split model.
- Coordinating API contracts required multiple iterations and adjustments.
- Some features required back-and-forth refinement between frontend and backend implementations.
- Initial time was spent learning new frameworks, tools, and architectural patterns.
- Debugging JWT authentication and role-based access control required additional effort.
- Environment setup and dependency configuration introduced delays.

From this sprint, the team learned:

- The importance of defining API contracts early in development.
- The need for better estimation and task breakdown.
- The value of early integration between frontend and backend teams.

---

# 6. Sprint 1 Summary

Sprint 1 successfully established:

- Secure authentication system  
- Role-based access control  
- Admin user lifecycle management  
- Backend job module foundation  
- Shared frontend data architecture  
- Structured UI for jobs and candidates  


# 7. Video Links 

Hireflow front end and backend combined full video (24mins duration)
- https://drive.google.com/file/d/1TxRakOSzujsTO2_-v5ZDjrOAllbaQbiQ/view?usp=sharing

Frontend only video (duration 5 min)
- https://drive.google.com/file/d/1bPWgNo_UMw51gcnkcmc0RgQnTQ5F0ADc/view?usp=sharing

