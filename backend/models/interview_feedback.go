package models

import "time"

type InterviewFeedback struct {
	ID             uint      `gorm:"primaryKey" json:"id"`
	InterviewID    uint      `gorm:"not null;uniqueIndex" json:"interview_id"`
	InterviewerID  uint      `gorm:"not null;index" json:"interviewer_id"`
	Rating         int       `gorm:"not null" json:"rating"`
	TechnicalScore int       `gorm:"not null" json:"technical_score"`
	Communication  int       `gorm:"not null" json:"communication"`
	Comments       string    `json:"comments"`
	Recommendation string    `gorm:"not null" json:"recommendation"`
	Interview      Interview `gorm:"foreignKey:InterviewID" json:"interview,omitempty"`
	SubmittedAt    time.Time `json:"submitted_at"`
	CreatedAt      time.Time `json:"created_at"`
}
