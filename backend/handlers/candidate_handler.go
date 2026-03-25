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

type applyWithCandidateRequest struct {
	JobID      uint   `json:"job_id"`
	Name       string `json:"name"`
	Email      string `json:"email"`
	ResumePath string `json:"resume_path"`
}

type applicationListItem struct {
	ID       string `json:"id"`
	JobID    uint   `json:"job_id"`
	Name     string `json:"name"`
	Email    string `json:"email"`
	Resume   string `json:"resume"`
	Stage    string `json:"stage"`
	RawStage string `json:"raw_status,omitempty"`
}

type stageUpdateRequest struct {
	Stage string `json:"stage"`
}

var allowedStages = map[string]bool{
	"APPLIED": true, "INTERVIEW": true, "SELECTED": true, "REJECTED": true, "WITHDRAWN": true,
}

func normalizeStageInput(s string) (string, bool) {
	s = strings.TrimSpace(s)
	if s == "" {
		return "", false
	}
	lower := strings.ToLower(s)
	switch lower {
	case "applied":
		return "APPLIED", true
	case "interview":
		return "INTERVIEW", true
	case "selected":
		return "SELECTED", true
	case "rejected":
		return "REJECTED", true
	case "withdrawn":
		return "WITHDRAWN", true
	}
	upper := strings.ToUpper(s)
	if allowedStages[upper] {
		return upper, true
	}
	return "", false
}

func statusToUIStage(status string) string {
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

// ApplyWithCandidate creates or reuses a candidate by email and adds an application (APPLIED).
func (h *CandidateHandler) ApplyWithCandidate(w http.ResponseWriter, r *http.Request) {
	var req applyWithCandidateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid request body"})
		return
	}
	if req.JobID == 0 || strings.TrimSpace(req.Name) == "" || strings.TrimSpace(req.Email) == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "job_id, name, and email are required"})
		return
	}
	var job models.Job
	if err := h.DB.First(&job, req.JobID).Error; err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "Job not found"})
		return
	}
	email := strings.ToLower(strings.TrimSpace(req.Email))
	var cand models.Candidate
	err := h.DB.Where("LOWER(email) = ?", email).First(&cand).Error
	if err == gorm.ErrRecordNotFound {
		cand = models.Candidate{
			Name:       strings.TrimSpace(req.Name),
			Email:      email,
			ResumePath: strings.TrimSpace(req.ResumePath),
		}
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
	app := models.Application{
		CandidateID: cand.ID,
		JobID:       req.JobID,
		Status:      "APPLIED",
	}
	if err := h.DB.Create(&app).Error; err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to create application"})
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(app)
}

// ListApplicationsByJob returns applications for a job with candidate details (authenticated).
func (h *CandidateHandler) ListApplicationsByJob(w http.ResponseWriter, r *http.Request) {
	jobIDStr := mux.Vars(r)["jobId"]
	jobID, err := strconv.ParseUint(jobIDStr, 10, 32)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid job ID"})
		return
	}
	var job models.Job
	if err := h.DB.First(&job, uint(jobID)).Error; err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "Job not found"})
		return
	}
	var apps []models.Application
	if err := h.DB.Preload("Candidate").Where("job_id = ?", uint(jobID)).Order("id asc").Find(&apps).Error; err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to list applications"})
		return
	}
	out := make([]applicationListItem, 0, len(apps))
	for _, a := range apps {
		resume := a.Candidate.ResumePath
		if resume == "" {
			resume = "—"
		}
		out = append(out, applicationListItem{
			ID:       strconv.FormatUint(uint64(a.ID), 10),
			JobID:    a.JobID,
			Name:     a.Candidate.Name,
			Email:    a.Candidate.Email,
			Resume:   resume,
			Stage:    statusToUIStage(a.Status),
			RawStage: a.Status,
		})
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(out)
}

// UpdateApplicationStage updates pipeline status for an application.
func (h *CandidateHandler) UpdateApplicationStage(w http.ResponseWriter, r *http.Request) {
	idStr := mux.Vars(r)["id"]
	appID, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid application ID"})
		return
	}
	var body stageUpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid request body"})
		return
	}
	norm, ok := normalizeStageInput(body.Stage)
	if !ok {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid stage"})
		return
	}
	var app models.Application
	if err := h.DB.First(&app, uint(appID)).Error; err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "Application not found"})
		return
	}
	app.Status = norm
	if err := h.DB.Save(&app).Error; err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to update stage"})
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(app)
}

// GetApplications lists applications for a candidate_id query param (legacy).
func (h *CandidateHandler) GetApplications(w http.ResponseWriter, r *http.Request) {
	candidateID := r.URL.Query().Get("candidate_id")
	var applications []models.Application
	h.DB.Where("candidate_id = ?", candidateID).Find(&applications)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(applications)
}

// WithdrawApplication marks an application as withdrawn.
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
