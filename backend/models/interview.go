package models

import "time"

type Interview struct {
	ID            uint        `gorm:"primaryKey" json:"id"`
	ApplicationID uint        `gorm:"not null;index;uniqueIndex:idx_app_interviewer" json:"application_id"`
	InterviewerID uint        `gorm:"not null;index;uniqueIndex:idx_app_interviewer" json:"interviewer_id"`
	ScheduledDate time.Time   `json:"scheduled_date"`
	InterviewType string      `gorm:"default:'TECHNICAL'" json:"interview_type"`
	Status        string      `gorm:"default:'SCHEDULED'" json:"status"`
	Application   Application `gorm:"foreignKey:ApplicationID" json:"application,omitempty"`
	Interviewer   User        `gorm:"foreignKey:InterviewerID" json:"interviewer,omitempty"`
	CreatedAt     time.Time   `json:"created_at"`
	UpdatedAt     time.Time   `json:"updated_at"`

	// Populated for JSON responses (not stored on interviews table).
	CandidateName  string `json:"candidate_name,omitempty" gorm:"-"`
	CandidateEmail string `json:"candidate_email,omitempty" gorm:"-"`
	JobTitle       string `json:"job_title,omitempty" gorm:"-"`
	HasResume      bool   `json:"has_resume,omitempty" gorm:"-"`
}
