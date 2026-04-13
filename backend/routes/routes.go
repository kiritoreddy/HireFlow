package routes

import (
	"backend/handlers"
	"backend/middleware"
	"net/http"

	"github.com/gorilla/mux"
	"gorm.io/gorm"
)

func SetupRoutes(db *gorm.DB) http.Handler {
	router := mux.NewRouter()

	// Health check (public)
	router.HandleFunc("/health", handlers.HealthHandler).Methods("GET")

	// Auth (public)
	authHandler := &handlers.AuthHandler{DB: db}
	router.HandleFunc("/auth/register", authHandler.Register).Methods("POST")
	router.HandleFunc("/auth/login", authHandler.Login).Methods("POST")
	router.HandleFunc("/auth/forgot-password", authHandler.ForgotPassword).Methods("POST")
	router.HandleFunc("/auth/reset-password", authHandler.ResetPassword).Methods("POST")

	// User management (admin only)
	userHandler := &handlers.UserHandler{DB: db}
	router.HandleFunc("/users",
		middleware.RequireAuth(middleware.RequireAdmin(userHandler.ListUsers))).Methods("GET")
	router.HandleFunc("/users",
		middleware.RequireAuth(middleware.RequireAdmin(userHandler.CreateUser))).Methods("POST")
	router.HandleFunc("/users/{id}",
		middleware.RequireAuth(middleware.RequireAdmin(userHandler.SetUserActive))).Methods("PATCH")

	// Dashboard stats (admin, hiring_manager, interviewer only)
	dashboardHandler := &handlers.DashboardHandler{DB: db}
	router.HandleFunc("/dashboard/stats",
		middleware.RequireAuth(
			middleware.RequireRole("admin", "hiring_manager", "interviewer")(dashboardHandler.GetDashboardStats),
		),
	).Methods("GET")

	// Job endpoints
	jobHandler := &handlers.JobHandler{DB: db}
	router.HandleFunc("/jobs",
		middleware.RequireAuth(jobHandler.GetAllJobs)).Methods("GET")
	router.HandleFunc("/jobs/{id}",
		middleware.RequireAuth(jobHandler.GetJobByID)).Methods("GET")
	router.HandleFunc("/jobs",
		middleware.RequireAuth(middleware.RequireRole("hiring_manager", "admin")(jobHandler.CreateJob))).Methods("POST")
	router.HandleFunc("/jobs/{id}",
		middleware.RequireAuth(middleware.RequireRole("hiring_manager", "admin")(jobHandler.UpdateJob))).Methods("PUT")
	router.HandleFunc("/jobs/{id}",
		middleware.RequireAuth(middleware.RequireRole("hiring_manager", "admin")(jobHandler.DeleteJob))).Methods("DELETE")

	// Candidate API endpoints (BE2)
	candidateHandler := &handlers.CandidateHandler{DB: db}

	// Candidate submits application (candidate only)
	router.HandleFunc("/api/candidate/apply",
		middleware.RequireAuth(middleware.RequireRole("candidate")(candidateHandler.ApplyWithCandidate))).Methods("POST")

	// Hiring staff views applications for a job
	router.HandleFunc("/api/candidate/jobs/{jobId}/applications",
		middleware.RequireAuth(middleware.RequireRole("hiring_manager", "admin")(candidateHandler.ListApplicationsByJob))).Methods("GET")

	// Hiring staff updates application stage
	router.HandleFunc("/api/candidate/applications/{id}/stage",
		middleware.RequireAuth(middleware.RequireRole("hiring_manager", "admin")(candidateHandler.UpdateApplicationStage))).Methods("PATCH")

	// Candidate views their own applications
	router.HandleFunc("/api/candidate/applications",
		middleware.RequireAuth(middleware.RequireRole("candidate")(candidateHandler.ListMyApplications))).Methods("GET")

	// Candidate withdraws their own application
	router.HandleFunc("/api/candidate/applications/{id}/withdraw",
		middleware.RequireAuth(middleware.RequireRole("candidate")(candidateHandler.WithdrawApplication))).Methods("PATCH")

	// Delete application (candidate = own only, hiring_manager/admin = any)
	router.HandleFunc("/api/candidate/applications/{id}",
		middleware.RequireAuth(candidateHandler.DeleteApplication)).Methods("DELETE")

	// CORS
	corsHandler := middleware.SetupCORS()
	return corsHandler(router)
}
