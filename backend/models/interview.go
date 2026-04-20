package models

import "time"

type Interview struct {
	ID            uint        `gorm:"primaryKey" json:"id"`
	ApplicationID uint        `gorm:"not null;index" json:"application_id"`
	InterviewerID uint        `gorm:"not null;index" json:"interviewer_id"`
	ScheduledDate time.Time   `json:"scheduled_date"`
	InterviewType string      `gorm:"default:'TECHNICAL'" json:"interview_type"`
	Status        string      `gorm:"default:'SCHEDULED'" json:"status"`
	Application   Application `gorm:"foreignKey:ApplicationID" json:"application,omitempty"`
	Interviewer   User        `gorm:"foreignKey:InterviewerID" json:"interviewer,omitempty"`
	CreatedAt     time.Time   `json:"created_at"`
	UpdatedAt     time.Time   `json:"updated_at"`
}
