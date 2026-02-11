package main

import (
	"log"
	"net/http"

	"github.com/gorilla/mux"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var db *gorm.DB

// Simple model (starter)
type User struct {
	ID    uint   `gorm:"primaryKey"`
	Name  string
	Email string `gorm:"unique"`
}

func main() {
	// Initialize SQLite DB
	database, err := gorm.Open(sqlite.Open("hireflow.db"), &gorm.Config{})
	if err != nil {
		log.Fatal("failed to connect database")
	}
	db = database

	// Auto-migrate schema
	if err := db.AutoMigrate(&User{}); err != nil {
	log.Fatal("failed to migrate database")
	}
	// Setup router
	router := mux.NewRouter()

	router.HandleFunc("/health", healthHandler).Methods("GET")

	log.Println("HireFlow backend running on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", router))
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"ok","db":"sqlite","service":"hireflow-backend"}`))
}
