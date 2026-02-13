package main

import (
	"backend/config"
	"backend/models"
	"backend/routes"
	"log"
	"net/http"  
) 

func main() {
	// Initialize database connection
	db := config.InitDB()

	// Auto-migrate database schema
	if err := db.AutoMigrate(&models.User{}, &models.Job{}); err != nil {
		log.Fatal("failed to migrate database:", err)
	}

	// Setup routes with CORS middleware
	handler := routes.SetupRoutes(db)

	// Start server
	log.Println("HireFlow backend running on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", handler))
}
