package seeder

import (
	"backend/models"
	"log"

	"gorm.io/gorm"
)

// Default credentials for development/testing
// IMPORTANT: Change these credentials in production!
const (
	DefaultAdminEmail    = "admin@hireflow.com"
	DefaultAdminPassword = "Admin@1234"
	DefaultAdminName     = "System Admin"

	DefaultCandidateEmail    = "candidate@hireflow.com"
	DefaultCandidatePassword = "Candidate@1234"
	DefaultCandidateName     = "Test Candidate"

	DefaultHiringManagerEmail    = "manager@hireflow.com"
	DefaultHiringManagerPassword = "Manager@1234"
	DefaultHiringManagerName     = "Test Hiring Manager"
)

// SeedAdmin creates a default admin user if none exists.
// Safe to call on every startup - skips if admin already exists.
func SeedAdmin(db *gorm.DB) {
	var count int64
	db.Model(&models.User{}).Where("role = ?", "admin").Count(&count)

	if count > 0 {
		log.Println("Admin user already exists - skipping seed")
		return
	}

	admin := models.User{
		Name:     DefaultAdminName,
		Email:    DefaultAdminEmail,
		Role:     "admin",
		IsActive: true,
	}

	if err := admin.HashPassword(DefaultAdminPassword); err != nil {
		log.Printf("Failed to hash admin password: %v", err)
		return
	}

	if err := db.Create(&admin).Error; err != nil {
		log.Printf("Failed to create admin user: %v", err)
		return
	}

	log.Println("✅ Default admin user created successfully")
	log.Printf("   Email:    %s", DefaultAdminEmail)
	log.Printf("   Password: %s", DefaultAdminPassword)
	log.Println("   ⚠️  Change these credentials in production!")
}

// SeedCandidate creates a default candidate user for E2E testing.
// Safe to call on every startup - skips if candidate already exists.
func SeedCandidate(db *gorm.DB) {
	var count int64
	db.Model(&models.User{}).Where("email = ?", DefaultCandidateEmail).Count(&count)

	if count > 0 {
		log.Println("Test candidate user already exists - skipping seed")
		return
	}

	candidate := models.User{
		Name:     DefaultCandidateName,
		Email:    DefaultCandidateEmail,
		Role:     "candidate",
		IsActive: true,
	}

	if err := candidate.HashPassword(DefaultCandidatePassword); err != nil {
		log.Printf("Failed to hash candidate password: %v", err)
		return
	}

	if err := db.Create(&candidate).Error; err != nil {
		log.Printf("Failed to create candidate user: %v", err)
		return
	}

	log.Println("✅ Default candidate user created successfully")
	log.Printf("   Email:    %s", DefaultCandidateEmail)
	log.Printf("   Password: %s", DefaultCandidatePassword)
	log.Println("   ⚠️  For testing only - not for production use!")
}

// SeedHiringManager creates a default hiring manager user for E2E testing.
// Safe to call on every startup - skips if hiring manager already exists.
func SeedHiringManager(db *gorm.DB) {
	var count int64
	db.Model(&models.User{}).Where("email = ?", DefaultHiringManagerEmail).Count(&count)

	if count > 0 {
		log.Println("Test hiring manager user already exists - skipping seed")
		return
	}

	manager := models.User{
		Name:     DefaultHiringManagerName,
		Email:    DefaultHiringManagerEmail,
		Role:     "hiring_manager",
		IsActive: true,
	}

	if err := manager.HashPassword(DefaultHiringManagerPassword); err != nil {
		log.Printf("Failed to hash hiring manager password: %v", err)
		return
	}

	if err := db.Create(&manager).Error; err != nil {
		log.Printf("Failed to create hiring manager user: %v", err)
		return
	}

	log.Println("✅ Default hiring manager user created successfully")
	log.Printf("   Email:    %s", DefaultHiringManagerEmail)
	log.Printf("   Password: %s", DefaultHiringManagerPassword)
	log.Println("   ⚠️  For testing only - not for production use!")
}
