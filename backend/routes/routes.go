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

	// Admin user management (JWT + admin role required)
	userHandler := &handlers.UserHandler{DB: db}
	router.HandleFunc("/users", middleware.RequireAuth(middleware.RequireAdmin(userHandler.ListUsers))).Methods("GET")
	router.HandleFunc("/users", middleware.RequireAuth(middleware.RequireAdmin(userHandler.CreateUser))).Methods("POST")
	router.HandleFunc("/users/{id}", middleware.RequireAuth(middleware.RequireAdmin(userHandler.SetUserActive))).Methods("PATCH")

	// Job endpoints
	jobHandler := &handlers.JobHandler{DB: db}

	// Public job viewing (auth required, any role)
	router.HandleFunc("/jobs", middleware.RequireAuth(jobHandler.GetAllJobs)).Methods("GET")
	router.HandleFunc("/jobs/{id}", middleware.RequireAuth(jobHandler.GetJobByID)).Methods("GET")

	// Protected job management (hiring_manager or admin only)
	router.HandleFunc("/jobs", middleware.RequireAuth(middleware.RequireRole("hiring_manager", "admin")(jobHandler.CreateJob))).Methods("POST")
	router.HandleFunc("/jobs/{id}", middleware.RequireAuth(middleware.RequireRole("hiring_manager", "admin")(jobHandler.UpdateJob))).Methods("PUT")
	router.HandleFunc("/jobs/{id}", middleware.RequireAuth(middleware.RequireRole("hiring_manager", "admin")(jobHandler.DeleteJob))).Methods("DELETE")

	// ---------------------------
	// Candidate API endpoints (BE-2)
	// ---------------------------
	candidateHandler := &handlers.CandidateHandler{DB: db}
	router.HandleFunc("/api/candidate/apply", candidateHandler.ApplyToJob).Methods("POST")
	router.HandleFunc("/api/candidate/applications", candidateHandler.GetApplications).Methods("GET")
	router.HandleFunc("/api/candidate/applications/{id}/withdraw", candidateHandler.WithdrawApplication).Methods("PATCH")

	// Apply CORS middleware
	corsHandler := middleware.SetupCORS()
	return corsHandler(router)
}
