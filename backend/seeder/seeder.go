package seeder

import (
	"backend/models"
	"log"

	"gorm.io/gorm"
)

// DefaultAdminEmail is the default admin credentials for development/testing
// IMPORTANT: Change these credentials in production!
const (
	DefaultAdminEmail    = "admin@hireflow.com"
	DefaultAdminPassword = "Admin@1234"
	DefaultAdminName     = "System Admin"
)

// SeedAdmin creates a default admin user if none exists.
// Safe to call on every startup - skips if admin already exists.
func SeedAdmin(db *gorm.DB) {
	var count int64
	db.Model(&models.User{}).Where("role = ?", "admin").Count(&count)

	// Admin already exists - skip seeding
	if count > 0 {
		log.Println("Admin user already exists - skipping seed")
		return
	}

	// Create default admin user
	admin := models.User{
		Name:     DefaultAdminName,
		Email:    DefaultAdminEmail,
		Role:     "admin",
		IsActive: true,
	}

	// Hash default password
	if err := admin.HashPassword(DefaultAdminPassword); err != nil {
		log.Printf("Failed to hash admin password: %v", err)
		return
	}

	// Save admin to database
	if err := db.Create(&admin).Error; err != nil {
		log.Printf("Failed to create admin user: %v", err)
		return
	}

	log.Println("✅ Default admin user created successfully")
	log.Printf("   Email:    %s", DefaultAdminEmail)
	log.Printf("   Password: %s", DefaultAdminPassword)
	log.Println("   ⚠️  Change these credentials in production!")
}
