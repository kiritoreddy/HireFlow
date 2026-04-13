package seeder

import (
	"backend/models"
	"log"

	"gorm.io/gorm"
)

// SeedDemoData inserts sample jobs, candidates, and applications when the jobs table is empty.
// Safe to run on every startup; skipped if any job rows already exist.
func SeedDemoData(db *gorm.DB) {
	var n int64
	if err := db.Model(&models.Job{}).Count(&n).Error; err != nil {
		log.Printf("demo seed: count jobs: %v", err)
		return
	}
	if n > 0 {
		log.Println("Demo data: jobs already present — skipping demo seed")
		return
	}

	jobRows := []models.Job{
		{
			Title:       "Senior Software Engineer",
			Description: "Design and build APIs and services; collaborate with product.",
			Department:  "Engineering",
			Location:    "Remote",
			Status:      "Open",
		},
		{
			Title:       "Product Designer",
			Description: "End-to-end UX, design systems, and prototyping.",
			Department:  "Design",
			Location:    "San Francisco",
			Status:      "Open",
		},
		{
			Title:       "Data Analyst",
			Description: "Analytics, reporting, and experimentation.",
			Department:  "Analytics",
			Location:    "New York",
			Status:      "Closed",
		},
		{
			Title:       "DevOps Engineer",
			Description: "CI/CD, cloud infra, observability, and on-call rotation.",
			Department:  "Engineering",
			Location:    "Austin",
			Status:      "Open",
		},
		{
			Title:       "HR Coordinator",
			Description: "Recruiting coordination, scheduling, and ATS hygiene.",
			Department:  "People",
			Location:    "Chicago",
			Status:      "Open",
		},
		{
			Title:       "Frontend Engineer",
			Description: "Angular/React, accessibility, and performance on the web app.",
			Department:  "Engineering",
			Location:    "Remote",
			Status:      "Open",
		},
	}

	for i := range jobRows {
		if err := db.Create(&jobRows[i]).Error; err != nil {
			log.Printf("demo seed: create job: %v", err)
			return
		}
	}

	candidateRows := []models.Candidate{
		{Name: "Harper Moore", Email: "harper.moore@example.com", ResumePath: "harper_moore_resume.pdf"},
		{Name: "Jordan Lee", Email: "jordan.lee@example.com", ResumePath: "jordan_lee_cv.pdf"},
		{Name: "Riley Chen", Email: "riley.chen@example.com", ResumePath: "riley_chen_resume.pdf"},
		{Name: "Quinn Patel", Email: "quinn.patel@example.com", ResumePath: "quinn_patel_cv.pdf"},
		{Name: "Alex Morgan", Email: "alex.morgan@example.com", ResumePath: "alex_morgan_resume.pdf"},
		{Name: "Sam Rivera", Email: "sam.rivera@example.com", ResumePath: "sam_rivera.pdf"},
		{Name: "Casey Nguyen", Email: "casey.nguyen@example.com", ResumePath: "casey_nguyen_cv.pdf"},
		{Name: "Taylor Brooks", Email: "taylor.brooks@example.com", ResumePath: "taylor_brooks_resume.pdf"},
	}

	for i := range candidateRows {
		if err := db.Create(&candidateRows[i]).Error; err != nil {
			log.Printf("demo seed: create candidate: %v", err)
			return
		}
	}

	// (candidate index, job index, status)
	appDefs := []struct {
		ci int
		ji int
		st string
	}{
		// Senior SWE — mix of pipeline stages
		{0, 0, "APPLIED"},
		{1, 0, "INTERVIEW"},
		{2, 0, "SELECTED"},
		{3, 0, "REJECTED"},
		{4, 0, "APPLIED"},
		{5, 0, "INTERVIEW"},
		// Product Designer
		{0, 1, "APPLIED"},
		{6, 1, "APPLIED"},
		{7, 1, "INTERVIEW"},
		{1, 1, "REJECTED"},
		// Data Analyst (closed job — still show historical applicants)
		{2, 2, "APPLIED"},
		{4, 2, "REJECTED"},
		{5, 2, "SELECTED"},
		// DevOps
		{4, 3, "APPLIED"},
		{5, 3, "APPLIED"},
		{6, 3, "INTERVIEW"},
		// HR Coordinator
		{7, 4, "APPLIED"},
		{0, 4, "INTERVIEW"},
		// Frontend
		{1, 5, "APPLIED"},
		{3, 5, "APPLIED"},
		{4, 5, "INTERVIEW"},
		{6, 5, "SELECTED"},
	}

	for _, d := range appDefs {
		app := models.Application{
			CandidateID: candidateRows[d.ci].ID,
			JobID:       jobRows[d.ji].ID,
			Status:      d.st,
		}
		if err := db.Create(&app).Error; err != nil {
			log.Printf("demo seed: create application: %v", err)
			return
		}
	}

	log.Println("✅ Demo data seeded (jobs, candidates, applications)")
}
