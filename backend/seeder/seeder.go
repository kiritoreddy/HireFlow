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

// SeedCandidate creates a default candidate user for E2E testing.
// Safe to call on every startup - skips if candidate already exists.
func SeedCandidate(db *gorm.DB) {
    var count int64
    db.Model(&models.User{}).Where("email = ?", DefaultCandidateEmail).Count(&count)

    // Candidate already exists - skip seeding
    if count > 0 {
        log.Println("Test candidate user already exists - skipping seed")
        return
    }

    // Create default candidate user
    candidate := models.User{
        Name:     DefaultCandidateName,
        Email:    DefaultCandidateEmail,
        Role:     "candidate",
        IsActive: true,
    }

    // Hash default password
    if err := candidate.HashPassword(DefaultCandidatePassword); err != nil {
        log.Printf("Failed to hash candidate password: %v", err)
        return
    }

    // Save candidate to database
    if err := db.Create(&candidate).Error; err != nil {
        log.Printf("Failed to create candidate user: %v", err)
        return
    }

    log.Println("✅ Default candidate user created successfully")
    log.Printf("   Email:    %s", DefaultCandidateEmail)
    log.Printf("   Password: %s", DefaultCandidatePassword)
    log.Println("   ⚠️  For testing only - not for production use!")
}