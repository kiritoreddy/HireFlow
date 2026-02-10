package main

import (
	"encoding/json" // ← ADDED: Required for encoding/decoding JSON request/response
	"log"
	"net/http"
	"time"

	"github.com/glebarez/sqlite" // Pure Go SQLite driver (no CGO required)
	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	"gorm.io/gorm"
)

var db *gorm.DB

// Simple model (starter)
type User struct {
	ID    uint `gorm:"primaryKey"`
	Name  string
	Email string `gorm:"unique"`
}

// Job model for HireFlow ATS job postings (BE-1 requirement)
type Job struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Title       string    `gorm:"not null" json:"title"`
	Description string    `json:"description"`
	Department  string    `json:"department"`
	Location    string    `json:"location"`
	Status      string    `gorm:"default:'Open'" json:"status"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func main() {
	// Initialize SQLite DB
	database, err := gorm.Open(sqlite.Open("hireflow.db"), &gorm.Config{})
	if err != nil {
		log.Fatal("failed to connect database")
	}
	db = database

	// Auto-migrate schema (creates/updates database tables based on models)
	if err := db.AutoMigrate(&User{}, &Job{}); err != nil {
		log.Fatal("failed to migrate database")
	}

	// Setup router
	router := mux.NewRouter()
	router.HandleFunc("/health", healthHandler).Methods("GET")

	// ← ADDED: Register Create Job API endpoint (BE-1: Implement Job CRUD APIs)
	router.HandleFunc("/jobs", createJobHandler).Methods("POST")

	// Configure CORS for frontend access (allows Angular frontend on port 4200 to call backend APIs)
	corsHandler := handlers.CORS(
		handlers.AllowedOrigins([]string{"http://localhost:4200"}),
		handlers.AllowedMethods([]string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}),
		handlers.AllowedHeaders([]string{"Content-Type", "Authorization"}),
	)

	log.Println("HireFlow backend running on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", corsHandler(router)))
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"ok","db":"sqlite","service":"hireflow-backend"}`))
}

// ← ADDED: Create Job API handler (POST /jobs)
// Accepts JSON job data, creates new job in database, returns created job with ID and timestamps
func createJobHandler(w http.ResponseWriter, r *http.Request) {
	var job Job

	// Decode JSON request body into Job struct
	if err := json.NewDecoder(r.Body).Decode(&job); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest) // 400 error if JSON is invalid
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid request body"})
		return
	}

	// Create job record in database (GORM auto-generates ID, CreatedAt, UpdatedAt, and default Status)
	if err := db.Create(&job).Error; err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError) // 500 error if database operation fails
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to create job"})
		return
	}

	// Return created job as JSON with 201 Created status
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated) // 201 status code indicates successful resource creation
	json.NewEncoder(w).Encode(job)    // Returns job with auto-generated ID and timestamps
}
