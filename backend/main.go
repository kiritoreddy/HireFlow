package main

import (
	"log"
	"net/http"
	"time" // ← ADDED: Required for CreatedAt/UpdatedAt timestamp fields in Job model

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

// ← ADDED: Job model for HireFlow ATS job postings (BE-1 requirement)
// This struct defines the database schema and JSON structure for job postings
type Job struct {
	ID          uint      `gorm:"primaryKey" json:"id"`         // Auto-incrementing unique identifier
	Title       string    `gorm:"not null" json:"title"`        // Job title (required field, e.g., "Senior Software Engineer")
	Description string    `json:"description"`                  // Job responsibilities and requirements
	Department  string    `json:"department"`                   // Department name (e.g., "Engineering", "Sales")
	Location    string    `json:"location"`                     // Job location (e.g., "Remote", "New York")
	Status      string    `gorm:"default:'Open'" json:"status"` // Job posting status (defaults to "Open")
	CreatedAt   time.Time `json:"created_at"`                   // Timestamp when job was created (auto-managed by GORM)
	UpdatedAt   time.Time `json:"updated_at"`                   // Timestamp when job was last updated (auto-managed by GORM)
}

func main() {
	// Initialize SQLite DB
	database, err := gorm.Open(sqlite.Open("hireflow.db"), &gorm.Config{})
	if err != nil {
		log.Fatal("failed to connect database")
	}
	db = database

	// Auto-migrate schema (creates/updates database tables based on models)
	if err := db.AutoMigrate(&User{}, &Job{}); err != nil { // ← MODIFIED: Added &Job{} for jobs table creation
		log.Fatal("failed to migrate database")
	}

	// Setup router
	router := mux.NewRouter()
	router.HandleFunc("/health", healthHandler).Methods("GET")

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
