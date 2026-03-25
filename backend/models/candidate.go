package models

import "gorm.io/gorm"

type Candidate struct {
	gorm.Model
	Name       string `json:"name"`
	Email      string `json:"email" gorm:"unique"`
	ResumePath string `json:"resume_path"`
}
