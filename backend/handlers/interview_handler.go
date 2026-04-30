package handlers

import (
	"encoding/json"
	"errors"
	"mime"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"backend/middleware"
	"backend/models"

	"github.com/gorilla/mux"
	"gorm.io/gorm"
)

// InterviewHandler handles all interview assignment and management endpoints.
type InterviewHandler struct {
	DB *gorm.DB
}

func enrichInterviewCandidateSummary(iv *models.Interview) {
	if iv.Application.ID == 0 {
		return
	}
	iv.CandidateName = strings.TrimSpace(iv.Application.Candidate.Name)
	iv.CandidateEmail = strings.TrimSpace(iv.Application.Candidate.Email)
	iv.HasResume = strings.TrimSpace(iv.Application.Candidate.ResumePath) != ""
	if iv.Application.Job.ID != 0 {
		iv.JobTitle = strings.TrimSpace(iv.Application.Job.Title)
	}
}

// validInterviewTypes defines the allowed values for interview_type.
// Frozen per Sprint 4 contract (Q5, Section A).
var validInterviewTypes = map[string]bool{
	"TECHNICAL":     true,
	"BEHAVIORAL":    true,
	"HR":            true,
	"SYSTEM_DESIGN": true,
}

// validInterviewStatuses defines the allowed values for interview status.
// Frozen per Sprint 4 contract (Section A).
var validInterviewStatuses = map[string]bool{
	"SCHEDULED": true,
	"COMPLETED": true,
	"CANCELLED": true,
}

type createInterviewRequest struct {
	ApplicationID uint   `json:"application_id"`
	InterviewerID uint   `json:"interviewer_id"`
	ScheduledDate string `json:"scheduled_date"` // RFC3339 UTC
	InterviewType string `json:"interview_type"`
}

type updateInterviewRequest struct {
	ScheduledDate *string `json:"scheduled_date"`
	InterviewType *string `json:"interview_type"`
	Status        *string `json:"status"`
}

// CreateInterview handles POST /interviews
// Assigns an interviewer to an application and schedules the interview.
// Accessible by: admin, hiring_manager
// Sprint 4 BE-2: Interview assignment API (Q5, Q8)
func (h *InterviewHandler) CreateInterview(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var req createInterviewRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid request body"})
		return
	}

	// Validate required fields
	if req.ApplicationID == 0 {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "application_id is required"})
		return
	}
	if req.InterviewerID == 0 {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "interviewer_id is required"})
		return
	}
	if req.ScheduledDate == "" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "scheduled_date is required"})
		return
	}
	if req.InterviewType == "" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "interview_type is required"})
		return
	}

	iType := strings.ToUpper(strings.TrimSpace(req.InterviewType))
	if !validInterviewTypes[iType] {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "interview_type must be one of: TECHNICAL, BEHAVIORAL, HR, SYSTEM_DESIGN"})
		return
	}

	scheduledDate, err := time.Parse(time.RFC3339, req.ScheduledDate)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "scheduled_date must be RFC3339 UTC format (e.g. 2026-05-01T10:00:00Z)"})
		return
	}

	// Verify application exists
	var app models.Application
	if err := h.DB.First(&app, req.ApplicationID).Error; err != nil {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "Application not found"})
		return
	}

	// Verify interviewer exists, has the interviewer role, and is active
	var interviewer models.User
	if err := h.DB.First(&interviewer, req.InterviewerID).Error; err != nil {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "Interviewer not found"})
		return
	}
	if interviewer.Role != "interviewer" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "The specified user does not have the interviewer role"})
		return
	}
	if !interviewer.IsActive {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "The specified interviewer is not active"})
		return
	}

	// Check for duplicate assignment — same interviewer already assigned to this application.
	// Enforces uniqueness at service layer (DB composite index also enforces this).
	var existing models.Interview
	dupErr := h.DB.Where("application_id = ? AND interviewer_id = ?", req.ApplicationID, req.InterviewerID).
		First(&existing).Error
	if dupErr == nil {
		w.WriteHeader(http.StatusConflict)
		json.NewEncoder(w).Encode(map[string]string{"error": "This interviewer is already assigned to this application"})
		return
	}
	if !errors.Is(dupErr, gorm.ErrRecordNotFound) {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to check existing assignment"})
		return
	}

	interview := models.Interview{
		ApplicationID: req.ApplicationID,
		InterviewerID: req.InterviewerID,
		ScheduledDate: scheduledDate,
		InterviewType: iType,
		Status:        "SCHEDULED",
	}

	if err := h.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&interview).Error; err != nil {
			return err
		}
		// Pipeline: first scheduled interview moves the application from Applied → Interview.
		if strings.EqualFold(strings.TrimSpace(app.Status), "APPLIED") {
			if err := tx.Model(&models.Application{}).Where("id = ?", app.ID).Update("status", "INTERVIEW").Error; err != nil {
				return err
			}
		}
		return nil
	}); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to create interview"})
		return
	}

	// Reload with relations for the response
	h.DB.Preload("Application.Candidate").Preload("Application.Job").Preload("Interviewer").First(&interview, interview.ID)
	enrichInterviewCandidateSummary(&interview)

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(interview)
}

// ListInterviews handles GET /interviews
// hiring_manager and admin see all interviews (optionally filtered by ?application_id=X).
// interviewer role sees only their own assigned interviews.
// Sprint 4 BE-2: Interview listing + Interviewer assignment listing API
func (h *InterviewHandler) ListInterviews(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	claims, ok := middleware.JWTClaimsFromRequest(r)
	if !ok || claims == nil {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "Unauthorized"})
		return
	}

	query := h.DB.Preload("Application.Candidate").Preload("Application.Job").Preload("Interviewer")

	if claims.Role == "interviewer" {
		// Interviewers only see their own assignments
		query = query.Where("interviewer_id = ?", claims.UserID)
	} else {
		// hiring_manager / admin: optional application_id filter
		if appIDStr := r.URL.Query().Get("application_id"); appIDStr != "" {
			appID, err := strconv.ParseUint(appIDStr, 10, 32)
			if err != nil {
				w.WriteHeader(http.StatusBadRequest)
				json.NewEncoder(w).Encode(map[string]string{"error": "Invalid application_id query parameter"})
				return
			}
			query = query.Where("application_id = ?", uint(appID))
		}
	}

	var interviews []models.Interview
	if err := query.Find(&interviews).Error; err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to retrieve interviews"})
		return
	}

	for i := range interviews {
		enrichInterviewCandidateSummary(&interviews[i])
	}

	json.NewEncoder(w).Encode(interviews)
}

// GetInterview handles GET /interviews/{id}
// Returns a single interview. hiring_manager/admin can view any; interviewer can only view their own.
func (h *InterviewHandler) GetInterview(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	claims, ok := middleware.JWTClaimsFromRequest(r)
	if !ok || claims == nil {
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "Unauthorized"})
		return
	}

	idStr := mux.Vars(r)["id"]
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid interview ID"})
		return
	}

	var interview models.Interview
	if err := h.DB.Preload("Application.Candidate").Preload("Application.Job").Preload("Interviewer").First(&interview, uint(id)).Error; err != nil {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "Interview not found"})
		return
	}

	// Interviewers can only view their own assignments
	if claims.Role == "interviewer" && interview.InterviewerID != claims.UserID {
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).Encode(map[string]string{"error": "Insufficient permissions"})
		return
	}

	enrichInterviewCandidateSummary(&interview)
	json.NewEncoder(w).Encode(interview)
}

// DownloadInterviewResume streams the candidate resume as an attachment (assigned interviewer, hiring_manager, or admin).
func (h *InterviewHandler) DownloadInterviewResume(w http.ResponseWriter, r *http.Request) {
	claims, ok := middleware.JWTClaimsFromRequest(r)
	if !ok || claims == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "Unauthorized"})
		return
	}

	idStr := mux.Vars(r)["id"]
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid interview ID"})
		return
	}

	var interview models.Interview
	if err := h.DB.Preload("Application.Candidate").First(&interview, uint(id)).Error; err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "Interview not found"})
		return
	}

	if claims.Role == "interviewer" && interview.InterviewerID != claims.UserID {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).Encode(map[string]string{"error": "Insufficient permissions"})
		return
	}
	if claims.Role != "interviewer" && claims.Role != "hiring_manager" && claims.Role != "admin" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).Encode(map[string]string{"error": "Insufficient permissions"})
		return
	}

	rel := strings.TrimSpace(interview.Application.Candidate.ResumePath)
	if rel == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "No resume on file for this candidate"})
		return
	}

	full, err := SafeResumeFullPath(rel)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid resume path"})
		return
	}
	if _, err := os.Stat(full); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "Resume file not found"})
		return
	}

	base := filepath.Base(full)
	ct := mime.TypeByExtension(filepath.Ext(base))
	if ct == "" {
		ct = "application/octet-stream"
	}
	w.Header().Set("Content-Type", ct)
	w.Header().Set("Content-Disposition", "attachment; filename=\""+strings.ReplaceAll(base, "\"", "")+"\"")
	http.ServeFile(w, r, full)
}

// UpdateInterview handles PATCH /interviews/{id}
// Updates scheduled_date, interview_type, or status of an interview.
// Accessible by: admin, hiring_manager
// Cannot update a CANCELLED interview.
func (h *InterviewHandler) UpdateInterview(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	idStr := mux.Vars(r)["id"]
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid interview ID"})
		return
	}

	var interview models.Interview
	if err := h.DB.First(&interview, uint(id)).Error; err != nil {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "Interview not found"})
		return
	}

	if interview.Status == "CANCELLED" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Cannot update a cancelled interview"})
		return
	}

	var req updateInterviewRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid request body"})
		return
	}

	updates := map[string]interface{}{}

	if req.ScheduledDate != nil {
		sd, err := time.Parse(time.RFC3339, *req.ScheduledDate)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "scheduled_date must be RFC3339 UTC format"})
			return
		}
		updates["scheduled_date"] = sd
	}

	if req.InterviewType != nil {
		iType := strings.ToUpper(strings.TrimSpace(*req.InterviewType))
		if !validInterviewTypes[iType] {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "interview_type must be one of: TECHNICAL, BEHAVIORAL, HR, SYSTEM_DESIGN"})
			return
		}
		updates["interview_type"] = iType
	}

	if req.Status != nil {
		status := strings.ToUpper(strings.TrimSpace(*req.Status))
		if !validInterviewStatuses[status] {
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{"error": "status must be one of: SCHEDULED, COMPLETED, CANCELLED"})
			return
		}
		updates["status"] = status
	}

	if len(updates) == 0 {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "No valid fields provided to update"})
		return
	}

	if err := h.DB.Model(&interview).Updates(updates).Error; err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to update interview"})
		return
	}

	// Reload with relations
	h.DB.Preload("Application").Preload("Interviewer").First(&interview, interview.ID)

	json.NewEncoder(w).Encode(interview)
}

// CancelInterview handles PATCH /interviews/{id}/cancel
// Sets interview status to CANCELLED. Accessible by: admin, hiring_manager.
// Sprint 4 BE-2: Interview cancellation API
func (h *InterviewHandler) CancelInterview(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	idStr := mux.Vars(r)["id"]
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid interview ID"})
		return
	}

	var interview models.Interview
	if err := h.DB.First(&interview, uint(id)).Error; err != nil {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "Interview not found"})
		return
	}

	if interview.Status == "CANCELLED" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Interview is already cancelled"})
		return
	}

	if err := h.DB.Model(&interview).Update("status", "CANCELLED").Error; err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to cancel interview"})
		return
	}

	h.DB.Preload("Application").Preload("Interviewer").First(&interview, interview.ID)

	json.NewEncoder(w).Encode(interview)
}
