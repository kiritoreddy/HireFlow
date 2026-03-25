package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"backend/models"

	"github.com/gorilla/mux"
	"gorm.io/gorm"
)

type CandidateHandler struct {
	DB *gorm.DB
}

// JobApplicationResponse is returned for hiring UI (matches frontend stage labels).
type JobApplicationResponse struct {
	ID        string `json:"id"`
	JobID     uint   `json:"jobId"`
	Name      string `json:"name"`
	Email     string `json:"email"`
	Resume    string `json:"resume"`
	Stage     string `json:"stage"` // Applied, Interview, Selected, Rejected
	UpdatedAt string `json:"updated_at"`
}

func mapStatusToStage(status string) string {
	switch strings.ToUpper(strings.TrimSpace(status)) {
	case "APPLIED":
		return "Applied"
	case "INTERVIEW":
		return "Interview"
	case "SELECTED":
		return "Selected"
	case "REJECTED":
		return "Rejected"
	case "WITHDRAWN":
		return "Rejected"
	default:
		return "Applied"
	}
}

func mapStageToStatus(stage string) string {
	switch strings.TrimSpace(stage) {
	case "Applied":
		return "APPLIED"
	case "Interview":
		return "INTERVIEW"
	case "Selected":
		return "SELECTED"
	case "Rejected":
		return "REJECTED"
	default:
		return ""
	}
}

func allowedPipelineStatus(s string) bool {
	switch strings.ToUpper(s) {
	case "APPLIED", "INTERVIEW", "SELECTED", "REJECTED":
		return true
	default:
		return false
	}
}

// ApplyToJob legacy public apply (expects candidate_id + job_id in body).
func (h *CandidateHandler) ApplyToJob(w http.ResponseWriter, r *http.Request) {
	var application models.Application

	if err := json.NewDecoder(r.Body).Decode(&application); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	application.Status = "APPLIED"

	if err := h.DB.Create(&application).Error; err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(application)
}

// GetApplications lists applications for a candidate_id query param.
func (h *CandidateHandler) GetApplications(w http.ResponseWriter, r *http.Request) {
	candidateID := r.URL.Query().Get("candidate_id")

	var applications []models.Application
	h.DB.Where("candidate_id = ?", candidateID).Find(&applications)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(applications)
}

// WithdrawApplication sets status to WITHDRAWN.
func (h *CandidateHandler) WithdrawApplication(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	id := params["id"]

	appID, _ := strconv.Atoi(id)

	var application models.Application

	if err := h.DB.First(&application, appID).Error; err != nil {
		http.Error(w, "Application not found", http.StatusNotFound)
		return
	}

	application.Status = "WITHDRAWN"
	h.DB.Save(&application)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(application)
}

// ListApplicationsForJob returns non-withdrawn applications for a job with candidate details.
func (h *CandidateHandler) ListApplicationsForJob(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	idStr := vars["id"]
	jobID64, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid job ID"})
		return
	}
	jobID := uint(jobID64)

	var job models.Job
	if err := h.DB.First(&job, jobID).Error; err != nil {
		w.Header().Set("Content-Type", "application/json")
		if err == gorm.ErrRecordNotFound {
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]string{"error": "Job not found"})
		} else {
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Failed to load job"})
		}
		return
	}

	var apps []models.Application
	if err := h.DB.Where("job_id = ? AND status != ?", jobID, "WITHDRAWN").Find(&apps).Error; err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to list applications"})
		return
	}

	out := make([]JobApplicationResponse, 0, len(apps))
	for _, app := range apps {
		var c models.Candidate
		if err := h.DB.First(&c, app.CandidateID).Error; err != nil {
			continue
		}
		resume := c.ResumePath
		if resume == "" {
			resume = "—"
		}
		out = append(out, JobApplicationResponse{
			ID:        strconv.FormatUint(uint64(app.ID), 10),
			JobID:     app.JobID,
			Name:      c.Name,
			Email:     c.Email,
			Resume:    resume,
			Stage:     mapStatusToStage(app.Status),
			UpdatedAt: app.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
		})
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(out)
}

type createApplicationBody struct {
	Name   string `json:"name"`
	Email  string `json:"email"`
	Resume string `json:"resume"`
}

// CreateApplicationForJob creates or reuses a candidate and adds an application.
func (h *CandidateHandler) CreateApplicationForJob(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	idStr := vars["id"]
	jobID64, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid job ID"})
		return
	}
	jobID := uint(jobID64)

	var job models.Job
	if err := h.DB.First(&job, jobID).Error; err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "Job not found"})
		return
	}

	var body createApplicationBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid request body"})
		return
	}
	body.Name = strings.TrimSpace(body.Name)
	body.Email = strings.TrimSpace(strings.ToLower(body.Email))
	body.Resume = strings.TrimSpace(body.Resume)
	if body.Name == "" || body.Email == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Name and email are required"})
		return
	}
	if body.Resume == "" {
		body.Resume = "—"
	}

	var cand models.Candidate
	err = h.DB.Where("LOWER(email) = ?", body.Email).First(&cand).Error
	if err == gorm.ErrRecordNotFound {
		cand = models.Candidate{Name: body.Name, Email: body.Email, ResumePath: body.Resume}
		if err := h.DB.Create(&cand).Error; err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Failed to create candidate"})
			return
		}
	} else if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to look up candidate"})
		return
	}

	var existing int64
	h.DB.Model(&models.Application{}).
		Where("job_id = ? AND candidate_id = ? AND status != ?", jobID, cand.ID, "WITHDRAWN").
		Count(&existing)
	if existing > 0 {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusConflict)
		json.NewEncoder(w).Encode(map[string]string{"error": "Candidate already applied to this job"})
		return
	}

	app := models.Application{
		CandidateID: cand.ID,
		JobID:       jobID,
		Status:      "APPLIED",
	}
	if err := h.DB.Create(&app).Error; err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to create application"})
		return
	}

	resp := JobApplicationResponse{
		ID:        strconv.FormatUint(uint64(app.ID), 10),
		JobID:     app.JobID,
		Name:      cand.Name,
		Email:     cand.Email,
		Resume:    body.Resume,
		Stage:     "Applied",
		UpdatedAt: app.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(resp)
}

type patchApplicationBody struct {
	Status string `json:"status"` // APPLIED, INTERVIEW, SELECTED, REJECTED or frontend stage
	Stage  string `json:"stage"`  // optional alias
}

// UpdateApplicationStatus updates pipeline status for an application.
func (h *CandidateHandler) UpdateApplicationStatus(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	idStr := params["id"]
	appID64, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid application ID"})
		return
	}

	var app models.Application
	if err := h.DB.First(&app, uint(appID64)).Error; err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "Application not found"})
		return
	}

	var body patchApplicationBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid request body"})
		return
	}

	next := strings.TrimSpace(body.Status)
	if next == "" && body.Stage != "" {
		next = mapStageToStatus(body.Stage)
	}
	next = strings.ToUpper(next)
	if !allowedPipelineStatus(next) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid status"})
		return
	}

	app.Status = next
	if err := h.DB.Save(&app).Error; err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to update application"})
		return
	}

	var c models.Candidate
	_ = h.DB.First(&c, app.CandidateID).Error
	resume := c.ResumePath
	if resume == "" {
		resume = "—"
	}

	resp := JobApplicationResponse{
		ID:        strconv.FormatUint(uint64(app.ID), 10),
		JobID:     app.JobID,
		Name:      c.Name,
		Email:     c.Email,
		Resume:    resume,
		Stage:     mapStatusToStage(app.Status),
		UpdatedAt: app.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(resp)
}
