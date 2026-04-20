package main

import (
	"backend/config"
	"backend/models"
	"backend/routes"
	"backend/seeder"
	"log"
	"net/http"
)

// Main entry point for the HireFlow backend application
func main() {
	// Initialize database connection
	db := config.InitDB()

	// Auto-migrate database schema
	if err := db.AutoMigrate(
		&models.User{},
		&models.PasswordResetToken{},
		&models.Job{},
		&models.Candidate{},
		&models.Application{},
		&models.Interview{},
		&models.InterviewFeedback{},
	); err != nil {
		log.Fatal("failed to migrate database:", err)
	}

	// Seed default users if they don't exist
	seeder.SeedAdmin(db)
	seeder.SeedCandidate(db)
	seeder.SeedHiringManager(db) // ← ADDED: Test hiring manager for E2E testing

	// Setup routes with CORS middleware
	handler := routes.SetupRoutes(db)

	// Start server
	log.Println("HireFlow backend running on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", handler))
}
