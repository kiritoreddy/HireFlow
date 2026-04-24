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

// InterviewFeedbackHandler handles all interview feedback endpoints.
type InterviewFeedbackHandler struct {
	DB *gorm.DB
}

// validRecommendations defines the allowed values for the recommendation field.
// Frozen per Sprint 4 contract (Section A).
var validRecommendations = map[string]bool{
	"STRONG_HIRE":    true,
	"HIRE":           true,
	"NO_HIRE":        true,
	"STRONG_NO_HIRE": true,
}

type submitFeedbackRequest struct {
	Rating         int    `json:"rating"`          // Required: 1–5
	TechnicalScore int    `json:"technical_score"` // Required: 1–5
	Communication  int    `json:"communication"`   // Required: 1–5
	Recommendation string `json:"recommendation"`  // Required: STRONG_HIRE | HIRE | NO_HIRE | STRONG_NO_HIRE
	Comments       string `json:"comments"`        // Optional (Q9)
}

// SubmitFeedback handles POST /interviews/{id}/feedback
// Submits feedback for a completed interview. Write-once — returns 409 if already submitted (Q10).
// Only the assigned interviewer for this interview can submit feedback.
// Sprint 4 BE-2: Feedback submit API with role and ownership checks
func (h *InterviewFeedbackHandler) SubmitFeedback(w http.ResponseWriter, r *http.Request) {
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

	// Load the interview to verify ownership
	var interview models.Interview
	if err := h.DB.First(&interview, uint(id)).Error; err != nil {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "Interview not found"})
		return
	}

	// Ownership check: only the assigned interviewer can submit feedback
	if interview.InterviewerID != claims.UserID {
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).Encode(map[string]string{"error": "Only the assigned interviewer can submit feedback for this interview"})
		return
	}

	// Cannot submit feedback for a cancelled interview
	if interview.Status == "CANCELLED" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Cannot submit feedback for a cancelled interview"})
		return
	}

	// Write-once check: reject if feedback already exists (enforced at service layer + DB uniqueIndex)
	var existingFeedback models.InterviewFeedback
	if err := h.DB.Where("interview_id = ?", interview.ID).First(&existingFeedback).Error; err == nil {
		w.WriteHeader(http.StatusConflict)
		json.NewEncoder(w).Encode(map[string]string{"error": "Feedback has already been submitted for this interview"})
		return
	} else if err != gorm.ErrRecordNotFound {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to check existing feedback"})
		return
	}

	var req submitFeedbackRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid request body"})
		return
	}

	// Validate required numeric scores (1–5 range)
	if req.Rating < 1 || req.Rating > 5 {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "rating must be between 1 and 5"})
		return
	}
	if req.TechnicalScore < 1 || req.TechnicalScore > 5 {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "technical_score must be between 1 and 5"})
		return
	}
	if req.Communication < 1 || req.Communication > 5 {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "communication must be between 1 and 5"})
		return
	}

	rec := strings.ToUpper(strings.TrimSpace(req.Recommendation))
	if !validRecommendations[rec] {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "recommendation must be one of: STRONG_HIRE, HIRE, NO_HIRE, STRONG_NO_HIRE"})
		return
	}

	feedback := models.InterviewFeedback{
		InterviewID:    interview.ID,
		InterviewerID:  claims.UserID,
		Rating:         req.Rating,
		TechnicalScore: req.TechnicalScore,
		Communication:  req.Communication,
		Recommendation: rec,
		Comments:       strings.TrimSpace(req.Comments),
		SubmittedAt:    time.Now().UTC(),
	}

	if err := h.DB.Create(&feedback).Error; err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to submit feedback"})
		return
	}

	// Reload with interview relation for the response
	h.DB.Preload("Interview").First(&feedback, feedback.ID)

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(feedback)
}

// GetInterviewFeedback handles GET /interviews/{id}/feedback
// Returns feedback for a specific interview.
// Accessible by: admin, hiring_manager (read-only), or the assigned interviewer.
// Sprint 4 BE-2: Feedback read API (Q12)
func (h *InterviewFeedbackHandler) GetInterviewFeedback(w http.ResponseWriter, r *http.Request) {
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

	// Load the interview to verify it exists and check ownership for interviewers
	var interview models.Interview
	if err := h.DB.First(&interview, uint(id)).Error; err != nil {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "Interview not found"})
		return
	}

	// Interviewers can only see feedback from their own interviews
	if claims.Role == "interviewer" && interview.InterviewerID != claims.UserID {
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).Encode(map[string]string{"error": "Insufficient permissions"})
		return
	}

	var feedback models.InterviewFeedback
	if err := h.DB.Preload("Interview").Where("interview_id = ?", uint(id)).First(&feedback).Error; err != nil {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "Feedback not found for this interview"})
		return
	}

	json.NewEncoder(w).Encode(feedback)
}

// GetApplicationFeedback handles GET /api/applications/{id}/feedback
// Returns all feedback records across all interviews for an application (consolidated view).
// Accessible by: admin, hiring_manager (Q12 — hiring manager feedback viewing).
// Sprint 4 BE-2: Feedback read API for candidate-level consolidated view
func (h *InterviewFeedbackHandler) GetApplicationFeedback(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	idStr := mux.Vars(r)["id"]
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid application ID"})
		return
	}

	// Verify application exists
	var app models.Application
	if err := h.DB.First(&app, uint(id)).Error; err != nil {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "Application not found"})
		return
	}

	// Collect all interview IDs for this application
	var interviews []models.Interview
	if err := h.DB.Where("application_id = ?", uint(id)).Find(&interviews).Error; err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to retrieve interviews"})
		return
	}

	if len(interviews) == 0 {
		json.NewEncoder(w).Encode([]models.InterviewFeedback{})
		return
	}

	interviewIDs := make([]uint, len(interviews))
	for i, iv := range interviews {
		interviewIDs[i] = iv.ID
	}

	// Retrieve all feedback for those interviews, preloading interviewer details
	var feedbacks []models.InterviewFeedback
	if err := h.DB.
		Preload("Interview").
		Preload("Interview.Interviewer").
		Where("interview_id IN ?", interviewIDs).
		Find(&feedbacks).Error; err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to retrieve feedback"})
		return
	}

	json.NewEncoder(w).Encode(feedbacks)
}
