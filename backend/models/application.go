package models

import "gorm.io/gorm"

type Application struct {
	gorm.Model
	CandidateID uint   `json:"candidate_id"`
	JobID       uint   `json:"job_id"`
	Status      string `json:"status"` // APPLIED, INTERVIEW, SELECTED, REJECTED, WITHDRAWN
}
