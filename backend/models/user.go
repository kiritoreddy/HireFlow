package models

import (
	"regexp"
	"time"

	"golang.org/x/crypto/bcrypt"
)

// User model for all system users (Admin, Hiring Manager, Interviewer, Candidate)
type User struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	Email        string    `gorm:"unique;not null;index" json:"email"`
	PasswordHash string    `gorm:"not null" json:"-"` // Never return in JSON
	Name         string    `gorm:"not null" json:"name"`
	Role         string    `gorm:"not null;default:'candidate'" json:"role"` // admin, hiring_manager, interviewer, candidate
	IsActive     bool      `gorm:"default:true" json:"is_active"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// HashPassword hashes the plain password using bcrypt
func (u *User) HashPassword(password string) error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), 12)
	if err != nil {
		return err
	}
	u.PasswordHash = string(hashedPassword)
	return nil
}

// CheckPassword verifies if provided password matches the hash
func (u *User) CheckPassword(password string) error {
	return bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password))
}

// ValidatePassword checks password strength requirements
func ValidatePassword(password string) bool {
	// Minimum 8 characters, at least one uppercase, one lowercase, one number, one special char
	if len(password) < 8 {
		return false
	}
	hasUpper := regexp.MustCompile(`[A-Z]`).MatchString(password)
	hasLower := regexp.MustCompile(`[a-z]`).MatchString(password)
	hasNumber := regexp.MustCompile(`[0-9]`).MatchString(password)
	hasSpecial := regexp.MustCompile(`[!@#$%^&*(),.?":{}|<>]`).MatchString(password)

	return hasUpper && hasLower && hasNumber && hasSpecial
}

// ValidateEmail checks email format
func ValidateEmail(email string) bool {
	emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
	return emailRegex.MatchString(email)
}
