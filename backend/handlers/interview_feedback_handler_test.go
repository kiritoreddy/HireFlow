package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"backend/models"

	"github.com/gorilla/mux"
)

// ── seed helpers (feedback tests) ─────────────────────────────────────────────

// setupFeedbackTestDB reuses setupInterviewTestDB (same schema)
func setupFeedbackTestDB(t *testing.T) *InterviewFeedbackHandler {
	t.Helper()
	db := setupInterviewTestDB(t)
	return &InterviewFeedbackHandler{DB: db}
}

func seedFeedback(t *testing.T, h *InterviewFeedbackHandler, interviewID, interviewerID uint) models.InterviewFeedback {
	t.Helper()
	fb := models.InterviewFeedback{
		InterviewID:    interviewID,
		InterviewerID:  interviewerID,
		Rating:         4,
		TechnicalScore: 4,
		Communication:  3,
		Recommendation: "HIRE",
		SubmittedAt:    time.Now().UTC(),
	}
	if err := h.DB.Create(&fb).Error; err != nil {
		t.Fatalf("seed feedback: %v", err)
	}
	return fb
}

// ── SubmitFeedback ────────────────────────────────────────────────────────────

func TestSubmitFeedback_Unauthorized(t *testing.T) {
	h := setupFeedbackTestDB(t)
	body, _ := json.Marshal(map[string]interface{}{"rating": 4, "technical_score": 4, "communication": 3, "recommendation": "HIRE"})
	req := httptest.NewRequest(http.MethodPost, "/interviews/1/feedback", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	// No claims injected
	router := mux.NewRouter()
	router.HandleFunc("/interviews/{id}/feedback", h.SubmitFeedback)
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)
	if rr.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", rr.Code)
	}
}

func TestSubmitFeedback_InterviewNotFound(t *testing.T) {
	h := setupFeedbackTestDB(t)
	iv := seedInterviewer(t, h.DB)
	body, _ := json.Marshal(map[string]interface{}{"rating": 4, "technical_score": 4, "communication": 3, "recommendation": "HIRE"})
	req := httptest.NewRequest(http.MethodPost, "/interviews/9999/feedback", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req = withInterviewClaims(req, iv.ID, "interviewer")
	router := mux.NewRouter()
	router.HandleFunc("/interviews/{id}/feedback", h.SubmitFeedback)
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)
	if rr.Code != http.StatusNotFound {
		t.Errorf("expected 404, got %d", rr.Code)
	}
}

func TestSubmitFeedback_ForbiddenForUnassignedInterviewer(t *testing.T) {
	h := setupFeedbackTestDB(t)
	job := seedJobForInterview(t, h.DB)
	app := seedApplicationForInterview(t, h.DB, job.ID)
	iv := seedInterviewer(t, h.DB)
	interview := seedInterview(t, h.DB, app.ID, iv.ID, "SCHEDULED")

	body, _ := json.Marshal(map[string]interface{}{"rating": 4, "technical_score": 4, "communication": 3, "recommendation": "HIRE"})
	req := httptest.NewRequest(http.MethodPost, "/interviews/"+idStr(interview.ID)+"/feedback", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	// Different interviewer — not the assigned one
	req = withInterviewClaims(req, iv.ID+999, "interviewer")
	router := mux.NewRouter()
	router.HandleFunc("/interviews/{id}/feedback", h.SubmitFeedback)
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)
	if rr.Code != http.StatusForbidden {
		t.Errorf("expected 403 for unassigned interviewer, got %d", rr.Code)
	}
}

func TestSubmitFeedback_ForbiddenForCancelledInterview(t *testing.T) {
	h := setupFeedbackTestDB(t)
	job := seedJobForInterview(t, h.DB)
	app := seedApplicationForInterview(t, h.DB, job.ID)
	iv := seedInterviewer(t, h.DB)
	interview := seedInterview(t, h.DB, app.ID, iv.ID, "CANCELLED")

	body, _ := json.Marshal(map[string]interface{}{"rating": 4, "technical_score": 4, "communication": 3, "recommendation": "HIRE"})
	req := httptest.NewRequest(http.MethodPost, "/interviews/"+idStr(interview.ID)+"/feedback", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req = withInterviewClaims(req, iv.ID, "interviewer")
	router := mux.NewRouter()
	router.HandleFunc("/interviews/{id}/feedback", h.SubmitFeedback)
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)
	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for cancelled interview, got %d", rr.Code)
	}
}

func TestSubmitFeedback_InvalidRating(t *testing.T) {
	h := setupFeedbackTestDB(t)
	job := seedJobForInterview(t, h.DB)
	app := seedApplicationForInterview(t, h.DB, job.ID)
	iv := seedInterviewer(t, h.DB)
	interview := seedInterview(t, h.DB, app.ID, iv.ID, "SCHEDULED")

	tests := []struct {
		name string
		body map[string]interface{}
	}{
		{"rating 0", map[string]interface{}{"rating": 0, "technical_score": 3, "communication": 3, "recommendation": "HIRE"}},
		{"rating 6", map[string]interface{}{"rating": 6, "technical_score": 3, "communication": 3, "recommendation": "HIRE"}},
		{"technical_score 0", map[string]interface{}{"rating": 3, "technical_score": 0, "communication": 3, "recommendation": "HIRE"}},
		{"communication 6", map[string]interface{}{"rating": 3, "technical_score": 3, "communication": 6, "recommendation": "HIRE"}},
		{"invalid recommendation", map[string]interface{}{"rating": 3, "technical_score": 3, "communication": 3, "recommendation": "MAYBE"}},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			body, _ := json.Marshal(tc.body)
			req := httptest.NewRequest(http.MethodPost, "/interviews/"+idStr(interview.ID)+"/feedback", bytes.NewBuffer(body))
			req.Header.Set("Content-Type", "application/json")
			req = withInterviewClaims(req, iv.ID, "interviewer")
			router := mux.NewRouter()
			router.HandleFunc("/interviews/{id}/feedback", h.SubmitFeedback)
			rr := httptest.NewRecorder()
			router.ServeHTTP(rr, req)
			if rr.Code != http.StatusBadRequest {
				t.Errorf("expected 400, got %d — body: %s", rr.Code, rr.Body.String())
			}
		})
	}
}

func TestSubmitFeedback_Success(t *testing.T) {
	h := setupFeedbackTestDB(t)
	job := seedJobForInterview(t, h.DB)
	app := seedApplicationForInterview(t, h.DB, job.ID)
	iv := seedInterviewer(t, h.DB)
	interview := seedInterview(t, h.DB, app.ID, iv.ID, "SCHEDULED")

	body, _ := json.Marshal(map[string]interface{}{
		"rating": 5, "technical_score": 4, "communication": 5,
		"recommendation": "STRONG_HIRE", "comments": "Excellent candidate",
	})
	req := httptest.NewRequest(http.MethodPost, "/interviews/"+idStr(interview.ID)+"/feedback", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req = withInterviewClaims(req, iv.ID, "interviewer")
	router := mux.NewRouter()
	router.HandleFunc("/interviews/{id}/feedback", h.SubmitFeedback)
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)
	if rr.Code != http.StatusCreated {
		t.Errorf("expected 201, got %d — body: %s", rr.Code, rr.Body.String())
	}
	var result models.InterviewFeedback
	json.NewDecoder(rr.Body).Decode(&result)
	if result.ID == 0 {
		t.Error("expected feedback ID in response")
	}
	if result.Recommendation != "STRONG_HIRE" {
		t.Errorf("expected recommendation STRONG_HIRE, got %s", result.Recommendation)
	}
	if result.Comments != "Excellent candidate" {
		t.Errorf("expected comments to be saved, got %q", result.Comments)
	}
}

func TestSubmitFeedback_WriteOnce(t *testing.T) {
	// Feedback is final once submitted — second attempt must return 409 (Q10)
	h := setupFeedbackTestDB(t)
	job := seedJobForInterview(t, h.DB)
	app := seedApplicationForInterview(t, h.DB, job.ID)
	iv := seedInterviewer(t, h.DB)
	interview := seedInterview(t, h.DB, app.ID, iv.ID, "SCHEDULED")
	seedFeedback(t, h, interview.ID, iv.ID)

	body, _ := json.Marshal(map[string]interface{}{
		"rating": 3, "technical_score": 3, "communication": 3, "recommendation": "NO_HIRE",
	})
	req := httptest.NewRequest(http.MethodPost, "/interviews/"+idStr(interview.ID)+"/feedback", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req = withInterviewClaims(req, iv.ID, "interviewer")
	router := mux.NewRouter()
	router.HandleFunc("/interviews/{id}/feedback", h.SubmitFeedback)
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)
	if rr.Code != http.StatusConflict {
		t.Errorf("expected 409 for duplicate feedback, got %d", rr.Code)
	}
}

func TestSubmitFeedback_CommentsOptional(t *testing.T) {
	// comments is optional (Q9) — omitting it must still succeed
	h := setupFeedbackTestDB(t)
	job := seedJobForInterview(t, h.DB)
	app := seedApplicationForInterview(t, h.DB, job.ID)
	iv := seedInterviewer(t, h.DB)
	interview := seedInterview(t, h.DB, app.ID, iv.ID, "SCHEDULED")

	body, _ := json.Marshal(map[string]interface{}{
		"rating": 3, "technical_score": 3, "communication": 3, "recommendation": "NO_HIRE",
		// no comments field
	})
	req := httptest.NewRequest(http.MethodPost, "/interviews/"+idStr(interview.ID)+"/feedback", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req = withInterviewClaims(req, iv.ID, "interviewer")
	router := mux.NewRouter()
	router.HandleFunc("/interviews/{id}/feedback", h.SubmitFeedback)
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)
	if rr.Code != http.StatusCreated {
		t.Errorf("expected 201 without comments, got %d — body: %s", rr.Code, rr.Body.String())
	}
}

func TestSubmitFeedback_RecommendationCaseInsensitive(t *testing.T) {
	h := setupFeedbackTestDB(t)
	job := seedJobForInterview(t, h.DB)
	app := seedApplicationForInterview(t, h.DB, job.ID)
	iv := seedInterviewer(t, h.DB)
	interview := seedInterview(t, h.DB, app.ID, iv.ID, "SCHEDULED")

	body, _ := json.Marshal(map[string]interface{}{
		"rating": 3, "technical_score": 3, "communication": 3, "recommendation": "strong_no_hire",
	})
	req := httptest.NewRequest(http.MethodPost, "/interviews/"+idStr(interview.ID)+"/feedback", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req = withInterviewClaims(req, iv.ID, "interviewer")
	router := mux.NewRouter()
	router.HandleFunc("/interviews/{id}/feedback", h.SubmitFeedback)
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)
	if rr.Code != http.StatusCreated {
		t.Errorf("expected 201 for lowercase recommendation, got %d", rr.Code)
	}
	var result models.InterviewFeedback
	json.NewDecoder(rr.Body).Decode(&result)
	if result.Recommendation != "STRONG_NO_HIRE" {
		t.Errorf("expected stored STRONG_NO_HIRE, got %s", result.Recommendation)
	}
}

// ── GetInterviewFeedback ──────────────────────────────────────────────────────

func TestGetInterviewFeedback_Unauthorized(t *testing.T) {
	h := setupFeedbackTestDB(t)
	req := httptest.NewRequest(http.MethodGet, "/interviews/1/feedback", nil)
	router := mux.NewRouter()
	router.HandleFunc("/interviews/{id}/feedback", h.GetInterviewFeedback)
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)
	if rr.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", rr.Code)
	}
}

func TestGetInterviewFeedback_InterviewNotFound(t *testing.T) {
	h := setupFeedbackTestDB(t)
	req := httptest.NewRequest(http.MethodGet, "/interviews/9999/feedback", nil)
	req = withInterviewClaims(req, 1, "hiring_manager")
	router := mux.NewRouter()
	router.HandleFunc("/interviews/{id}/feedback", h.GetInterviewFeedback)
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)
	if rr.Code != http.StatusNotFound {
		t.Errorf("expected 404, got %d", rr.Code)
	}
}

func TestGetInterviewFeedback_FeedbackNotFound(t *testing.T) {
	h := setupFeedbackTestDB(t)
	job := seedJobForInterview(t, h.DB)
	app := seedApplicationForInterview(t, h.DB, job.ID)
	iv := seedInterviewer(t, h.DB)
	interview := seedInterview(t, h.DB, app.ID, iv.ID, "SCHEDULED")

	req := httptest.NewRequest(http.MethodGet, "/interviews/"+idStr(interview.ID)+"/feedback", nil)
	req = withInterviewClaims(req, 1, "hiring_manager")
	router := mux.NewRouter()
	router.HandleFunc("/interviews/{id}/feedback", h.GetInterviewFeedback)
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)
	if rr.Code != http.StatusNotFound {
		t.Errorf("expected 404 when no feedback, got %d", rr.Code)
	}
}

func TestGetInterviewFeedback_InterviewerForbiddenForOthers(t *testing.T) {
	h := setupFeedbackTestDB(t)
	job := seedJobForInterview(t, h.DB)
	app := seedApplicationForInterview(t, h.DB, job.ID)
	iv := seedInterviewer(t, h.DB)
	interview := seedInterview(t, h.DB, app.ID, iv.ID, "SCHEDULED")
	seedFeedback(t, h, interview.ID, iv.ID)

	req := httptest.NewRequest(http.MethodGet, "/interviews/"+idStr(interview.ID)+"/feedback", nil)
	req = withInterviewClaims(req, iv.ID+999, "interviewer") // different interviewer
	router := mux.NewRouter()
	router.HandleFunc("/interviews/{id}/feedback", h.GetInterviewFeedback)
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)
	if rr.Code != http.StatusForbidden {
		t.Errorf("expected 403, got %d", rr.Code)
	}
}

func TestGetInterviewFeedback_AssignedInterviewerCanView(t *testing.T) {
	h := setupFeedbackTestDB(t)
	job := seedJobForInterview(t, h.DB)
	app := seedApplicationForInterview(t, h.DB, job.ID)
	iv := seedInterviewer(t, h.DB)
	interview := seedInterview(t, h.DB, app.ID, iv.ID, "SCHEDULED")
	seedFeedback(t, h, interview.ID, iv.ID)

	req := httptest.NewRequest(http.MethodGet, "/interviews/"+idStr(interview.ID)+"/feedback", nil)
	req = withInterviewClaims(req, iv.ID, "interviewer")
	router := mux.NewRouter()
	router.HandleFunc("/interviews/{id}/feedback", h.GetInterviewFeedback)
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)
	if rr.Code != http.StatusOK {
		t.Errorf("expected 200, got %d — body: %s", rr.Code, rr.Body.String())
	}
}

func TestGetInterviewFeedback_HiringManagerCanView(t *testing.T) {
	h := setupFeedbackTestDB(t)
	job := seedJobForInterview(t, h.DB)
	app := seedApplicationForInterview(t, h.DB, job.ID)
	iv := seedInterviewer(t, h.DB)
	interview := seedInterview(t, h.DB, app.ID, iv.ID, "SCHEDULED")
	seedFeedback(t, h, interview.ID, iv.ID)

	req := httptest.NewRequest(http.MethodGet, "/interviews/"+idStr(interview.ID)+"/feedback", nil)
	req = withInterviewClaims(req, 999, "hiring_manager")
	router := mux.NewRouter()
	router.HandleFunc("/interviews/{id}/feedback", h.GetInterviewFeedback)
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)
	if rr.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rr.Code)
	}
	var fb models.InterviewFeedback
	json.NewDecoder(rr.Body).Decode(&fb)
	if fb.ID == 0 {
		t.Error("expected feedback ID in response")
	}
}

// ── GetApplicationFeedback ────────────────────────────────────────────────────

func TestGetApplicationFeedback_ApplicationNotFound(t *testing.T) {
	h := setupFeedbackTestDB(t)
	req := httptest.NewRequest(http.MethodGet, "/api/applications/9999/feedback", nil)
	router := mux.NewRouter()
	router.HandleFunc("/api/applications/{id}/feedback", h.GetApplicationFeedback)
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)
	if rr.Code != http.StatusNotFound {
		t.Errorf("expected 404, got %d", rr.Code)
	}
}

func TestGetApplicationFeedback_EmptyWhenNoInterviews(t *testing.T) {
	h := setupFeedbackTestDB(t)
	job := seedJobForInterview(t, h.DB)
	app := seedApplicationForInterview(t, h.DB, job.ID)

	req := httptest.NewRequest(http.MethodGet, "/api/applications/"+idStr(app.ID)+"/feedback", nil)
	router := mux.NewRouter()
	router.HandleFunc("/api/applications/{id}/feedback", h.GetApplicationFeedback)
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)
	if rr.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rr.Code)
	}
	var result []models.InterviewFeedback
	json.NewDecoder(rr.Body).Decode(&result)
	if len(result) != 0 {
		t.Errorf("expected empty list, got %d", len(result))
	}
}

func TestGetApplicationFeedback_ReturnsAllFeedbackForApplication(t *testing.T) {
	// Panel interviews: two interviewers, two feedbacks — all returned for the application
	h := setupFeedbackTestDB(t)
	job := seedJobForInterview(t, h.DB)
	app := seedApplicationForInterview(t, h.DB, job.ID)
	iv1 := seedInterviewer(t, h.DB)

	iv2 := models.User{Name: "IV Panel", Email: "ivp@example.com", Role: "interviewer", IsActive: true, Provider: "email"}
	iv2.HashPassword("Pass@1234")
	h.DB.Create(&iv2)

	interview1 := seedInterview(t, h.DB, app.ID, iv1.ID, "SCHEDULED")
	interview2 := seedInterview(t, h.DB, app.ID, iv2.ID, "SCHEDULED")
	seedFeedback(t, h, interview1.ID, iv1.ID)
	seedFeedback(t, h, interview2.ID, iv2.ID)

	req := httptest.NewRequest(http.MethodGet, "/api/applications/"+idStr(app.ID)+"/feedback", nil)
	router := mux.NewRouter()
	router.HandleFunc("/api/applications/{id}/feedback", h.GetApplicationFeedback)
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)
	if rr.Code != http.StatusOK {
		t.Errorf("expected 200, got %d — body: %s", rr.Code, rr.Body.String())
	}
	var result []models.InterviewFeedback
	json.NewDecoder(rr.Body).Decode(&result)
	if len(result) != 2 {
		t.Errorf("expected 2 feedback records for panel interviews, got %d", len(result))
	}
}

func TestGetApplicationFeedback_DoesNotReturnOtherApplicationFeedback(t *testing.T) {
	h := setupFeedbackTestDB(t)
	job := seedJobForInterview(t, h.DB)
	app1 := seedApplicationForInterview(t, h.DB, job.ID)

	// Second application
	cand2 := models.Candidate{Name: "C2", Email: "c2fb@example.com"}
	h.DB.Create(&cand2)
	app2 := models.Application{CandidateID: cand2.ID, JobID: job.ID, Status: "APPLIED"}
	h.DB.Create(&app2)

	iv := seedInterviewer(t, h.DB)
	iv2 := models.User{Name: "IV2", Email: "iv2fb@example.com", Role: "interviewer", IsActive: true, Provider: "email"}
	iv2.HashPassword("Pass@1234")
	h.DB.Create(&iv2)

	interview1 := seedInterview(t, h.DB, app1.ID, iv.ID, "SCHEDULED")
	interview2 := seedInterview(t, h.DB, app2.ID, iv2.ID, "SCHEDULED")
	seedFeedback(t, h, interview1.ID, iv.ID)
	seedFeedback(t, h, interview2.ID, iv2.ID)

	// Request feedback for app1 only
	req := httptest.NewRequest(http.MethodGet, "/api/applications/"+idStr(app1.ID)+"/feedback", nil)
	router := mux.NewRouter()
	router.HandleFunc("/api/applications/{id}/feedback", h.GetApplicationFeedback)
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)
	if rr.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rr.Code)
	}
	var result []models.InterviewFeedback
	json.NewDecoder(rr.Body).Decode(&result)
	if len(result) != 1 {
		t.Errorf("expected 1 feedback (only app1), got %d", len(result))
	}
}
