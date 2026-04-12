package models

import "gorm.io/gorm"

// Application links a Candidate to a Job. Status values: APPLIED, INTERVIEW, SELECTED, REJECTED, WITHDRAWN.
type Application struct {
	gorm.Model
	CandidateID uint      `json:"candidate_id"`
	Candidate   Candidate `json:"candidate,omitempty" gorm:"foreignKey:CandidateID"`
	JobID       uint      `json:"job_id"`
	Job         Job       `json:"job,omitempty" gorm:"foreignKey:JobID"`
	Status      string    `json:"status"`
}
