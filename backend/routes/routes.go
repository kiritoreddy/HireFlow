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

	// Authentication endpoints (public)
	authHandler := &handlers.AuthHandler{DB: db}
	router.HandleFunc("/auth/register", authHandler.Register).Methods("POST")
	router.HandleFunc("/auth/login", authHandler.Login).Methods("POST")
	router.HandleFunc("/auth/forgot-password", authHandler.ForgotPassword).Methods("POST")
	router.HandleFunc("/auth/reset-password", authHandler.ResetPassword).Methods("POST")

	// ---------------------------
	// Admin user management (BE1)
	// ---------------------------
	userHandler := &handlers.UserHandler{DB: db}
	router.HandleFunc("/users",
		middleware.RequireAuth(middleware.RequireAdmin(userHandler.ListUsers))).Methods("GET")

	router.HandleFunc("/users",
		middleware.RequireAuth(middleware.RequireAdmin(userHandler.CreateUser))).Methods("POST")

	router.HandleFunc("/users/{id}",
		middleware.RequireAuth(middleware.RequireAdmin(userHandler.SetUserActive))).Methods("PATCH")

	// ---------------------------
	// Job endpoints (BE1)
	// ---------------------------
	jobHandler := &handlers.JobHandler{DB: db}

	// Public job viewing (auth required)
	router.HandleFunc("/jobs",
		middleware.RequireAuth(jobHandler.GetAllJobs)).Methods("GET")

	router.HandleFunc("/jobs/{id}",
		middleware.RequireAuth(jobHandler.GetJobByID)).Methods("GET")

	// Protected job management
	router.HandleFunc("/jobs",
		middleware.RequireAuth(middleware.RequireRole("hiring_manager", "admin")(jobHandler.CreateJob))).Methods("POST")

	router.HandleFunc("/jobs/{id}",
		middleware.RequireAuth(middleware.RequireRole("hiring_manager", "admin")(jobHandler.UpdateJob))).Methods("PUT")

	router.HandleFunc("/jobs/{id}",
		middleware.RequireAuth(middleware.RequireRole("hiring_manager", "admin")(jobHandler.DeleteJob))).Methods("DELETE")

	// ---------------------------
	// Candidate API endpoints (BE2 - YOU)
	// ---------------------------
	candidateHandler := &handlers.CandidateHandler{DB: db}

	// ✅ Apply (candidate only)
	router.HandleFunc("/api/candidate/apply",
		middleware.RequireAuth(middleware.RequireRole("candidate")(candidateHandler.ApplyWithCandidate))).Methods("POST")

	// ✅ List applications by job (hiring_manager/admin only)
	router.HandleFunc("/api/candidate/jobs/{jobId}/applications",
		middleware.RequireAuth(middleware.RequireRole("hiring_manager", "admin")(candidateHandler.ListApplicationsByJob))).Methods("GET")

	// ✅ Update stage (hiring_manager/admin only)
	router.HandleFunc("/api/candidate/applications/{id}/stage",
		middleware.RequireAuth(middleware.RequireRole("hiring_manager", "admin")(candidateHandler.UpdateApplicationStage))).Methods("PATCH")

	// ❌ REMOVED INSECURE ROUTE
	// router.HandleFunc("/api/candidate/applications", candidateHandler.GetApplications).Methods("GET")

	// ✅ Candidate's own applications
	router.HandleFunc("/api/candidate/applications",
		middleware.RequireAuth(middleware.RequireRole("candidate")(candidateHandler.ListMyApplications))).Methods("GET")

	// ✅ Withdraw application (candidate only)
	router.HandleFunc("/api/candidate/applications/{id}/withdraw",
		middleware.RequireAuth(middleware.RequireRole("candidate")(candidateHandler.WithdrawApplication))).Methods("PATCH")

	// ---------------------------
	// CORS
	// ---------------------------
	corsHandler := middleware.SetupCORS()
	return corsHandler(router)
}
