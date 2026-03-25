package models

import "time"

// Job model for HireFlow ATS job postings (BE-1 requirement)
type Job struct {
	ID          uint      `gorm:"primaryKey" json:"id"`         // Auto-incrementing unique identifier
	Title       string    `gorm:"not null" json:"title"`        // Job title (required field)
	Description string    `json:"description"`                  // Job responsibilities and requirements
	Department  string    `json:"department"`                   // Department name
	Location    string    `json:"location"`                     // Job location
	Status      string    `gorm:"default:'Open'" json:"status"` // Job posting status (defaults to "Open")
	CreatedAt   time.Time `json:"created_at"`                   // Timestamp when job was created (auto-managed by GORM)
	UpdatedAt   time.Time `json:"updated_at"`                   // Timestamp when job was last updated (auto-managed by GORM)
}
