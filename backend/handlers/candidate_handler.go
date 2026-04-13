package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"backend/middleware"
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

type myApplicationListItem struct {
	ID         string `json:"id"`
	JobID      uint   `json:"job_id"`
	JobTitle   string `json:"job_title"`
	Department string `json:"department,omitempty"`
	Stage      string `json:"stage"`
	RawStage   string `json:"raw_status,omitempty"`
	AppliedAt  string `json:"applied_at,omitempty"`
}

var allowedStages = map[string]bool{
	"APPLIED": true, "INTERVIEW": true, "SELECTED": true, "REJECTED": true, "WITHDRAWN": true,
}

func normalizeStageInput(s string) (string, bool) {
	s = strings.TrimSpace(s)
	if s == "" {
		return "", false
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

func statusToCandidatePortalStage(status string) string {
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
		return "Withdrawn"
	default:
		return "Applied"
	}
}

//////////////////////////////////////////////////////////
// ✅ APPLY (FIXED WITH JWT — SAFE)
//////////////////////////////////////////////////////////

func (h *CandidateHandler) ApplyWithCandidate(w http.ResponseWriter, r *http.Request) {
	var req applyWithCandidateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid request body"})
		return
	}

	// 🔥 REQUIRE JWT
	claims, ok := middleware.JWTClaimsFromRequest(r)
	if !ok || claims == nil {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "Unauthorized"})
		return
	}

	// 🔥 FORCE email from JWT (important fix)
	req.Email = claims.Email

	if req.JobID == 0 {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "job_id is required"})
		return
	}

	var job models.Job
	if err := h.DB.First(&job, req.JobID).Error; err != nil {
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
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]string{"error": "Failed to create candidate"})
			return
		}
	} else if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to look up candidate"})
		return
	}

	var activeApp models.Application
	dupQ := h.DB.Where("candidate_id = ? AND job_id = ? AND UPPER(TRIM(status)) <> ?", cand.ID, req.JobID, "WITHDRAWN")
	if err := dupQ.First(&activeApp).Error; err == nil {
		w.WriteHeader(http.StatusConflict)
		json.NewEncoder(w).Encode(map[string]string{"error": "You have already applied for this job"})
		return
	} else if err != gorm.ErrRecordNotFound {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to check existing application"})
		return
	}

	app := models.Application{
		CandidateID: cand.ID,
		JobID:       req.JobID,
		Status:      "APPLIED",
	}

	if err := h.DB.Create(&app).Error; err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to create application"})
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(app)
}

//////////////////////////////////////////////////////////
// ✅ KEEP (NO CHANGE — BE1 SAFE)
//////////////////////////////////////////////////////////

func (h *CandidateHandler) ListApplicationsByJob(w http.ResponseWriter, r *http.Request) {
	jobIDStr := mux.Vars(r)["jobId"]
	jobID, err := strconv.ParseUint(jobIDStr, 10, 32)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	var apps []models.Application
	h.DB.Preload("Candidate").Where("job_id = ?", uint(jobID)).Find(&apps)

	json.NewEncoder(w).Encode(apps)
}

//////////////////////////////////////////////////////////
// ✅ KEEP (NO CHANGE)
//////////////////////////////////////////////////////////

func (h *CandidateHandler) UpdateApplicationStage(w http.ResponseWriter, r *http.Request) {
	idStr := mux.Vars(r)["id"]
	appID, _ := strconv.Atoi(idStr)

	var body stageUpdateRequest
	json.NewDecoder(r.Body).Decode(&body)

	stage, ok := normalizeStageInput(body.Stage)
	if !ok {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	var app models.Application
	if err := h.DB.First(&app, appID).Error; err != nil {
		w.WriteHeader(http.StatusNotFound)
		return
	}

	app.Status = stage
	h.DB.Save(&app)

	json.NewEncoder(w).Encode(app)
}

//////////////////////////////////////////////////////////
// ❌ REMOVED INSECURE API (IMPORTANT)
//////////////////////////////////////////////////////////

// GetApplications DELETED

//////////////////////////////////////////////////////////
// ✅ MY APPLICATIONS (SECURE)
//////////////////////////////////////////////////////////

func (h *CandidateHandler) ListMyApplications(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.JWTClaimsFromRequest(r)
	if !ok || claims == nil {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	email := strings.ToLower(strings.TrimSpace(claims.Email))

	var cand models.Candidate
	if err := h.DB.Where("LOWER(email) = ?", email).First(&cand).Error; err != nil {
		json.NewEncoder(w).Encode([]myApplicationListItem{})
		return
	}

	var apps []models.Application
	h.DB.Preload("Job").Where("candidate_id = ?", cand.ID).Find(&apps)

	var out []myApplicationListItem

	for _, a := range apps {
		out = append(out, myApplicationListItem{
			ID:         strconv.Itoa(int(a.ID)),
			JobID:      a.JobID,
			JobTitle:   a.Job.Title,
			Department: a.Job.Department,
			Stage:      statusToCandidatePortalStage(a.Status),
			RawStage:   a.Status,
			AppliedAt:  a.CreatedAt.Format(time.RFC3339),
		})
	}

	json.NewEncoder(w).Encode(out)
}

//////////////////////////////////////////////////////////
// ✅ WITHDRAW (ALREADY PERFECT)
//////////////////////////////////////////////////////////

func (h *CandidateHandler) WithdrawApplication(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.JWTClaimsFromRequest(r)
	if !ok || claims == nil {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	idStr := mux.Vars(r)["id"]
	appID, _ := strconv.Atoi(idStr)

	email := strings.ToLower(strings.TrimSpace(claims.Email))

	var cand models.Candidate
	h.DB.Where("LOWER(email) = ?", email).First(&cand)

	var app models.Application
	if err := h.DB.First(&app, appID).Error; err != nil {
		w.WriteHeader(http.StatusNotFound)
		return
	}

	if app.CandidateID != cand.ID {
		w.WriteHeader(http.StatusForbidden)
		return
	}

	app.Status = "WITHDRAWN"
	h.DB.Save(&app)

	json.NewEncoder(w).Encode(app)
}
