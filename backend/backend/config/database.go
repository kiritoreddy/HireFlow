package config

import (
	"log"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

// InitDB initializes and returns database connection
func InitDB() *gorm.DB {
	// Initialize SQLite DB with Pure Go driver (no CGO required)
	database, err := gorm.Open(sqlite.Open("hireflow.db"), &gorm.Config{})
	if err != nil {
		log.Fatal("failed to connect database")
	}
	return database
}
