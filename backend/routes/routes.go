package routes

import (
	"backend/handlers"
	"backend/middleware"
	"net/http"

	"github.com/gorilla/mux"
	"gorm.io/gorm"
)

// SetupRoutes configures all application routes
func SetupRoutes(db *gorm.DB) http.Handler {
	router := mux.NewRouter()

	// Health check endpoint (public)
	router.HandleFunc("/health", handlers.HealthHandler).Methods("GET")

	// Authentication endpoints (public - no auth required)
	authHandler := &handlers.AuthHandler{DB: db}
	router.HandleFunc("/auth/register", authHandler.Register).Methods("POST")
	router.HandleFunc("/auth/login", authHandler.Login).Methods("POST")
	router.HandleFunc("/auth/forgot-password", authHandler.ForgotPassword).Methods("POST")
	router.HandleFunc("/auth/reset-password", authHandler.ResetPassword).Methods("POST")

	// Sprint 4: Google OAuth endpoint (public - no auth required)
	// Accepts Google ID token from frontend, verifies server-side, returns JWT
	googleAuthHandler := &handlers.GoogleAuthHandler{DB: db}
	router.HandleFunc("/auth/google", googleAuthHandler.GoogleAuth).Methods("POST")

	// Admin user management (JWT + admin role required)
	userHandler := &handlers.UserHandler{DB: db}
	router.HandleFunc("/users", middleware.RequireAuth(middleware.RequireAdmin(userHandler.ListUsers))).Methods("GET")
	router.HandleFunc("/users", middleware.RequireAuth(middleware.RequireAdmin(userHandler.CreateUser))).Methods("POST")
	router.HandleFunc("/users/{id}", middleware.RequireAuth(middleware.RequireAdmin(userHandler.SetUserActive))).Methods("PATCH")

	// Dashboard stats endpoint (JWT required, all roles except candidate)
	dashboardHandler := &handlers.DashboardHandler{DB: db}
	router.HandleFunc("/dashboard/stats",
		middleware.RequireAuth(
			middleware.RequireRole("admin", "hiring_manager", "interviewer")(dashboardHandler.GetDashboardStats),
		),
	).Methods("GET")

	// Job endpoints
	jobHandler := &handlers.JobHandler{DB: db}

	// Job viewing (auth required, any role)
	router.HandleFunc("/jobs", middleware.RequireAuth(jobHandler.GetAllJobs)).Methods("GET")
	router.HandleFunc("/jobs/{id}", middleware.RequireAuth(jobHandler.GetJobByID)).Methods("GET")

	// Job management (hiring_manager or admin only)
	router.HandleFunc("/jobs", middleware.RequireAuth(middleware.RequireRole("hiring_manager", "admin")(jobHandler.CreateJob))).Methods("POST")
	router.HandleFunc("/jobs/{id}", middleware.RequireAuth(middleware.RequireRole("hiring_manager", "admin")(jobHandler.UpdateJob))).Methods("PUT")
	router.HandleFunc("/jobs/{id}", middleware.RequireAuth(middleware.RequireRole("hiring_manager", "admin")(jobHandler.DeleteJob))).Methods("DELETE")

	// ---------------------------
	// Candidate API endpoints (BE-2)
	// Updated Sprint 4: Removed GetApplications (deleted by BE2), added DeleteApplication
	// ---------------------------
	candidateHandler := &handlers.CandidateHandler{DB: db}

	// Apply to job (candidate only - creates or reuses candidate by email; JWT required)
	router.HandleFunc("/api/candidate/apply", middleware.RequireAuth(candidateHandler.ApplyWithCandidate)).Methods("POST")

	// List applications for a specific job (hiring pipeline view - hiring_manager/admin)
	router.HandleFunc("/api/jobs/{jobId}/applications", candidateHandler.ListApplicationsByJob).Methods("GET")

	// Update application stage (hiring_manager/admin only)
	router.HandleFunc("/api/applications/{id}/stage", candidateHandler.UpdateApplicationStage).Methods("PATCH")

	// Candidate portal: list my applications (JWT required - candidate only)
	router.HandleFunc("/api/candidate/my-applications", middleware.RequireAuth(candidateHandler.ListMyApplications)).Methods("GET")

	// Candidate portal: withdraw application (JWT required, must own application)
	router.HandleFunc("/api/candidate/applications/{id}/withdraw", middleware.RequireAuth(candidateHandler.WithdrawApplication)).Methods("PATCH")

	// Delete application (candidate owns it or admin)
	router.HandleFunc("/api/candidate/applications/{id}", middleware.RequireAuth(candidateHandler.DeleteApplication)).Methods("DELETE")

	// ---------------------------
	// Interview API endpoints (BE-2)
	// Sprint 4: Interview assignment, listing, update, cancellation
	// ---------------------------
	interviewHandler := &handlers.InterviewHandler{DB: db}

	// Create interview assignment (hiring_manager/admin only)
	router.HandleFunc("/interviews",
		middleware.RequireAuth(middleware.RequireRole("hiring_manager", "admin")(interviewHandler.CreateInterview)),
	).Methods("POST")

	// List interviews — hiring_manager/admin see all (optional ?application_id filter); interviewer sees own
	router.HandleFunc("/interviews",
		middleware.RequireAuth(middleware.RequireRole("hiring_manager", "admin", "interviewer")(interviewHandler.ListInterviews)),
	).Methods("GET")

	// Cancel interview — must be registered BEFORE /{id} to avoid path conflict
	router.HandleFunc("/interviews/{id}/cancel",
		middleware.RequireAuth(middleware.RequireRole("hiring_manager", "admin")(interviewHandler.CancelInterview)),
	).Methods("PATCH")

	// Get single interview (hiring_manager/admin/assigned interviewer)
	router.HandleFunc("/interviews/{id}",
		middleware.RequireAuth(middleware.RequireRole("hiring_manager", "admin", "interviewer")(interviewHandler.GetInterview)),
	).Methods("GET")

	// Update interview — reschedule, change type or status (hiring_manager/admin only)
	router.HandleFunc("/interviews/{id}",
		middleware.RequireAuth(middleware.RequireRole("hiring_manager", "admin")(interviewHandler.UpdateInterview)),
	).Methods("PATCH")

	// ---------------------------
	// Interview Feedback API endpoints (BE-2)
	// Sprint 4: Feedback submit/read with role and ownership checks
	// ---------------------------
	feedbackHandler := &handlers.InterviewFeedbackHandler{DB: db}

	// Submit feedback — interviewer only, must be the assigned interviewer, write-once
	router.HandleFunc("/interviews/{id}/feedback",
		middleware.RequireAuth(middleware.RequireRole("interviewer")(feedbackHandler.SubmitFeedback)),
	).Methods("POST")

	// Get interview feedback — hiring_manager/admin (read-only) or the assigned interviewer
	router.HandleFunc("/interviews/{id}/feedback",
		middleware.RequireAuth(middleware.RequireRole("hiring_manager", "admin", "interviewer")(feedbackHandler.GetInterviewFeedback)),
	).Methods("GET")

	// Get all feedback for an application (consolidated view — hiring_manager/admin)
	router.HandleFunc("/api/applications/{id}/feedback",
		middleware.RequireAuth(middleware.RequireRole("hiring_manager", "admin")(feedbackHandler.GetApplicationFeedback)),
	).Methods("GET")

	// Apply CORS middleware
	corsHandler := middleware.SetupCORS()
	return corsHandler(router)
}
