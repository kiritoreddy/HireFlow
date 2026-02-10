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

	// Job CRUD API endpoints (BE-1: Complete Job CRUD implementation)
	jobHandler := &handlers.JobHandler{DB: db}
	router.HandleFunc("/jobs", jobHandler.CreateJob).Methods("POST")        // Commit 4
	router.HandleFunc("/jobs", jobHandler.GetAllJobs).Methods("GET")        // Commit 5
	router.HandleFunc("/jobs/{id}", jobHandler.GetJobByID).Methods("GET")   // Commit 6
	router.HandleFunc("/jobs/{id}", jobHandler.UpdateJob).Methods("PUT")    // Commit 7
	router.HandleFunc("/jobs/{id}", jobHandler.DeleteJob).Methods("DELETE") // Commit 8

	// Apply CORS middleware
	corsHandler := middleware.SetupCORS()
	return corsHandler(router)
}
