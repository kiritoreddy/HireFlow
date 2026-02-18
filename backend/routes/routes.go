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

	// Health check endpoint
	router.HandleFunc("/health", handlers.HealthHandler).Methods("GET")

	// ---------------------------
	// Job CRUD API endpoints (BE-1)
	// ---------------------------
	jobHandler := &handlers.JobHandler{DB: db}

	router.HandleFunc("/jobs", jobHandler.CreateJob).Methods("POST")
	router.HandleFunc("/jobs", jobHandler.GetAllJobs).Methods("GET")
	router.HandleFunc("/jobs/{id}", jobHandler.GetJobByID).Methods("GET")
	router.HandleFunc("/jobs/{id}", jobHandler.UpdateJob).Methods("PUT")
	router.HandleFunc("/jobs/{id}", jobHandler.DeleteJob).Methods("DELETE")

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
