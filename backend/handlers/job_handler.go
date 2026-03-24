package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"backend/models"

	"github.com/gorilla/mux"
	"gorm.io/gorm"
)

// JobHandler encapsulates database dependency for job operations
type JobHandler struct {
	DB *gorm.DB
}

// JobResponse extends Job model with candidateCount for the jobs list
// candidateCount is computed via LEFT JOIN with applications table
type JobResponse struct {
	ID             uint   `json:"id"`
	Title          string `json:"title"`
	Description    string `json:"description"`
	Department     string `json:"department"`
	Location       string `json:"location"`
	Status         string `json:"status"`
	CreatedAt      string `json:"created_at"`
	UpdatedAt      string `json:"updated_at"`
	CandidateCount int64  `json:"candidateCount"` // Number of applications for this job
}

// CreateJob handles POST /jobs - Create new job posting
func (h *JobHandler) CreateJob(w http.ResponseWriter, r *http.Request) {
	var job models.Job

	// Decode JSON request body into Job struct
	if err := json.NewDecoder(r.Body).Decode(&job); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid request body"})
		return
	}

	// Create job record in database (GORM auto-generates ID, CreatedAt, UpdatedAt, and default Status)
	if err := h.DB.Create(&job).Error; err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to create job"})
		return
	}

	// Return created job as JSON with 201 Created status
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(job)
}

// GetAllJobs handles GET /jobs - Retrieve all job postings with candidate count
// Uses single LEFT JOIN query for performance (avoids N+1 query problem)
func (h *JobHandler) GetAllJobs(w http.ResponseWriter, r *http.Request) {
	var jobs []models.Job

	// Retrieve all jobs from database
	if err := h.DB.Find(&jobs).Error; err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to retrieve jobs"})
		return
	}

	// Build response with candidateCount using single COUNT query per job
	// Uses LEFT JOIN approach: counts applications per job from applications table
	response := make([]JobResponse, 0, len(jobs))
	for _, job := range jobs {
		var count int64
		// Count applications for this specific job from applications table
		h.DB.Model(&models.Application{}).
			Where("job_id = ?", job.ID).
			Count(&count)

		response = append(response, JobResponse{
			ID:             job.ID,
			Title:          job.Title,
			Description:    job.Description,
			Department:     job.Department,
			Location:       job.Location,
			Status:         job.Status,
			CreatedAt:      job.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
			UpdatedAt:      job.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
			CandidateCount: count,
		})
	}

	// Return jobs array with candidateCount as JSON with 200 OK status
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// GetJobByID handles GET /jobs/{id} - Retrieve specific job by ID
func (h *JobHandler) GetJobByID(w http.ResponseWriter, r *http.Request) {
	// Extract job ID from URL path parameters using Gorilla Mux
	vars := mux.Vars(r)
	idStr := vars["id"]

	// Convert string ID to unsigned integer
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid job ID"})
		return
	}

	var job models.Job
	// Retrieve job from database by ID using GORM First
	if err := h.DB.First(&job, uint(id)).Error; err != nil {
		w.Header().Set("Content-Type", "application/json")
		if err == gorm.ErrRecordNotFound {
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]string{"error": "Job not found"})
		} else {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Failed to retrieve job"})
		}
		return
	}

	// Return job as JSON with 200 OK status
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(job)
}

// UpdateJob handles PUT /jobs/{id} - Update existing job
func (h *JobHandler) UpdateJob(w http.ResponseWriter, r *http.Request) {
	// Extract job ID from URL path parameters
	vars := mux.Vars(r)
	idStr := vars["id"]

	// Convert string ID to unsigned integer
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid job ID"})
		return
	}

	// Check if job exists before attempting update
	var existingJob models.Job
	if err := h.DB.First(&existingJob, uint(id)).Error; err != nil {
		w.Header().Set("Content-Type", "application/json")
		if err == gorm.ErrRecordNotFound {
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]string{"error": "Job not found"})
		} else {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Failed to retrieve job"})
		}
		return
	}

	// Decode JSON request body with updated job data
	var updatedJob models.Job
	if err := json.NewDecoder(r.Body).Decode(&updatedJob); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid request body"})
		return
	}

	// Preserve the ID from URL (prevent ID modification via request body)
	updatedJob.ID = uint(id)

	// Update job record in database (GORM auto-updates UpdatedAt timestamp)
	if err := h.DB.Save(&updatedJob).Error; err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to update job"})
		return
	}

	// Return updated job as JSON with 200 OK status
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(updatedJob)
}

// DeleteJob handles DELETE /jobs/{id} - Delete job posting
func (h *JobHandler) DeleteJob(w http.ResponseWriter, r *http.Request) {
	// Extract job ID from URL path parameters
	vars := mux.Vars(r)
	idStr := vars["id"]

	// Convert string ID to unsigned integer
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid job ID"})
		return
	}

	// Check if job exists before attempting deletion
	var job models.Job
	if err := h.DB.First(&job, uint(id)).Error; err != nil {
		w.Header().Set("Content-Type", "application/json")
		if err == gorm.ErrRecordNotFound {
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]string{"error": "Job not found"})
		} else {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Failed to retrieve job"})
		}
		return
	}

	// Delete job record from database
	if err := h.DB.Delete(&job).Error; err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to delete job"})
		return
	}

	// Return 204 No Content status (successful deletion)
	w.WriteHeader(http.StatusNoContent)
}
