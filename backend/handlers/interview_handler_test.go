package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"

	"backend/middleware"
	"backend/models"
	"backend/utils"

	"github.com/glebarez/sqlite"
	"github.com/gorilla/mux"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// ── test DB ───────────────────────────────────────────────────────────────────

func setupInterviewTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		t.Fatalf("failed to open test DB: %v", err)
	}
	if err := db.AutoMigrate(
		&models.User{},
		&models.Job{},
		&models.Candidate{},
		&models.Application{},
		&models.Interview{},
		&models.InterviewFeedback{},
	); err != nil {
		t.Fatalf("failed to migrate: %v", err)
	}
	return db
}

// ── JWT claim helpers ─────────────────────────────────────────────────────────

func withInterviewClaims(r *http.Request, userID uint, role string) *http.Request {
	claims := &utils.JWTClaims{UserID: userID, Email: "test@example.com", Role: role}
	ctx := middleware.ContextWithClaims(r.Context(), claims)
	return r.WithContext(ctx)
}

// ── seed helpers ──────────────────────────────────────────────────────────────

func seedInterviewer(t *testing.T, db *gorm.DB) models.User {
	t.Helper()
	u := models.User{
		Name:     "Interviewer One",
		Email:    "iv@example.com",
		Role:     "interviewer",
		IsActive: true,
		Provider: "email",
	}
	u.HashPassword("Pass@1234")
	if err := db.Create(&u).Error; err != nil {
		t.Fatalf("seed interviewer: %v", err)
	}
	return u
}

func seedHiringManager(t *testing.T, db *gorm.DB) models.User {
	t.Helper()
	u := models.User{
		Name:     "Manager One",
		Email:    "hm@example.com",
		Role:     "hiring_manager",
		IsActive: true,
		Provider: "email",
	}
	u.HashPassword("Pass@1234")
	if err := db.Create(&u).Error; err != nil {
		t.Fatalf("seed hiring_manager: %v", err)
	}
	return u
}

func seedJobForInterview(t *testing.T, db *gorm.DB) models.Job {
	t.Helper()
	job := models.Job{Title: "Backend Dev", Department: "Engineering", Status: "Open"}
	if err := db.Create(&job).Error; err != nil {
		t.Fatalf("seed job: %v", err)
	}
	return job
}

func seedApplicationForInterview(t *testing.T, db *gorm.DB, jobID uint) models.Application {
	t.Helper()
	cand := models.Candidate{Name: "Cand One", Email: "cand@example.com"}
	db.Create(&cand)
	app := models.Application{CandidateID: cand.ID, JobID: jobID, Status: "APPLIED"}
	if err := db.Create(&app).Error; err != nil {
		t.Fatalf("seed application: %v", err)
	}
	return app
}

func seedInterview(t *testing.T, db *gorm.DB, appID, ivID uint, status string) models.Interview {
	t.Helper()
	iv := models.Interview{
		ApplicationID: appID,
		InterviewerID: ivID,
		InterviewType: "TECHNICAL",
		Status:        status,
	}
	if err := db.Create(&iv).Error; err != nil {
		t.Fatalf("seed interview: %v", err)
	}
	return iv
}

func idStr(id uint) string { return strconv.Itoa(int(id)) }

// ── CreateInterview ───────────────────────────────────────────────────────────

func TestCreateInterview_MissingApplicationID(t *testing.T) {
	db := setupInterviewTestDB(t)
	h := &InterviewHandler{DB: db}
	body, _ := json.Marshal(map[string]interface{}{
		"interviewer_id": 1, "scheduled_date": "2026-06-01T10:00:00Z", "interview_type": "TECHNICAL",
	})
	req := httptest.NewRequest(http.MethodPost, "/interviews", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	h.CreateInterview(rr, req)
	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", rr.Code)
	}
}

func TestCreateInterview_MissingInterviewerID(t *testing.T) {
	db := setupInterviewTestDB(t)
	h := &InterviewHandler{DB: db}
	body, _ := json.Marshal(map[string]interface{}{
		"application_id": 1, "scheduled_date": "2026-06-01T10:00:00Z", "interview_type": "TECHNICAL",
	})
	req := httptest.NewRequest(http.MethodPost, "/interviews", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	h.CreateInterview(rr, req)
	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", rr.Code)
	}
}

func TestCreateInterview_InvalidInterviewType(t *testing.T) {
	db := setupInterviewTestDB(t)
	h := &InterviewHandler{DB: db}
	body, _ := json.Marshal(map[string]interface{}{
		"application_id": 1, "interviewer_id": 1,
		"scheduled_date": "2026-06-01T10:00:00Z", "interview_type": "NONSENSE",
	})
	req := httptest.NewRequest(http.MethodPost, "/interviews", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	h.CreateInterview(rr, req)
	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", rr.Code)
	}
}

func TestCreateInterview_InvalidScheduledDate(t *testing.T) {
	db := setupInterviewTestDB(t)
	h := &InterviewHandler{DB: db}
	body, _ := json.Marshal(map[string]interface{}{
		"application_id": 1, "interviewer_id": 1,
		"scheduled_date": "not-a-date", "interview_type": "TECHNICAL",
	})
	req := httptest.NewRequest(http.MethodPost, "/interviews", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	h.CreateInterview(rr, req)
	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", rr.Code)
	}
}

func TestCreateInterview_ApplicationNotFound(t *testing.T) {
	db := setupInterviewTestDB(t)
	h := &InterviewHandler{DB: db}
	body, _ := json.Marshal(map[string]interface{}{
		"application_id": 9999, "interviewer_id": 1,
		"scheduled_date": "2026-06-01T10:00:00Z", "interview_type": "TECHNICAL",
	})
	req := httptest.NewRequest(http.MethodPost, "/interviews", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	h.CreateInterview(rr, req)
	if rr.Code != http.StatusNotFound {
		t.Errorf("expected 404, got %d", rr.Code)
	}
}

func TestCreateInterview_InterviewerNotFound(t *testing.T) {
	db := setupInterviewTestDB(t)
	h := &InterviewHandler{DB: db}
	job := seedJobForInterview(t, db)
	app := seedApplicationForInterview(t, db, job.ID)
	body, _ := json.Marshal(map[string]interface{}{
		"application_id": app.ID, "interviewer_id": 9999,
		"scheduled_date": "2026-06-01T10:00:00Z", "interview_type": "TECHNICAL",
	})
	req := httptest.NewRequest(http.MethodPost, "/interviews", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	h.CreateInterview(rr, req)
	if rr.Code != http.StatusNotFound {
		t.Errorf("expected 404, got %d — body: %s", rr.Code, rr.Body.String())
	}
}

func TestCreateInterview_UserNotInterviewer(t *testing.T) {
	db := setupInterviewTestDB(t)
	h := &InterviewHandler{DB: db}
	job := seedJobForInterview(t, db)
	app := seedApplicationForInterview(t, db, job.ID)
	hm := seedHiringManager(t, db)
	body, _ := json.Marshal(map[string]interface{}{
		"application_id": app.ID, "interviewer_id": hm.ID,
		"scheduled_date": "2026-06-01T10:00:00Z", "interview_type": "TECHNICAL",
	})
	req := httptest.NewRequest(http.MethodPost, "/interviews", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	h.CreateInterview(rr, req)
	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected 400 (wrong role), got %d", rr.Code)
	}
}

func TestCreateInterview_Success(t *testing.T) {
	db := setupInterviewTestDB(t)
	h := &InterviewHandler{DB: db}
	job := seedJobForInterview(t, db)
	app := seedApplicationForInterview(t, db, job.ID)
	iv := seedInterviewer(t, db)
	body, _ := json.Marshal(map[string]interface{}{
		"application_id": app.ID, "interviewer_id": iv.ID,
		"scheduled_date": "2026-06-01T10:00:00Z", "interview_type": "TECHNICAL",
	})
	req := httptest.NewRequest(http.MethodPost, "/interviews", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	h.CreateInterview(rr, req)
	if rr.Code != http.StatusCreated {
		t.Errorf("expected 201, got %d — body: %s", rr.Code, rr.Body.String())
	}
	var result models.Interview
	json.NewDecoder(rr.Body).Decode(&result)
	if result.ID == 0 {
		t.Error("expected interview ID in response")
	}
	if result.Status != "SCHEDULED" {
		t.Errorf("expected status SCHEDULED, got %s", result.Status)
	}
	var appAfter models.Application
	if err := db.First(&appAfter, app.ID).Error; err != nil {
		t.Fatalf("reload application: %v", err)
	}
	if appAfter.Status != "INTERVIEW" {
		t.Errorf("expected application status INTERVIEW after assign, got %q", appAfter.Status)
	}
}

func TestCreateInterview_DuplicateAssignmentBlocked(t *testing.T) {
	db := setupInterviewTestDB(t)
	h := &InterviewHandler{DB: db}
	job := seedJobForInterview(t, db)
	app := seedApplicationForInterview(t, db, job.ID)
	iv := seedInterviewer(t, db)
	// First assignment
	seedInterview(t, db, app.ID, iv.ID, "SCHEDULED")
	// Second assignment — same interviewer + application
	body, _ := json.Marshal(map[string]interface{}{
		"application_id": app.ID, "interviewer_id": iv.ID,
		"scheduled_date": "2026-06-01T10:00:00Z", "interview_type": "BEHAVIORAL",
	})
	req := httptest.NewRequest(http.MethodPost, "/interviews", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	h.CreateInterview(rr, req)
	if rr.Code != http.StatusConflict {
		t.Errorf("expected 409, got %d", rr.Code)
	}
}

func TestCreateInterview_PanelAllowed(t *testing.T) {
	// Multiple different interviewers can be assigned to the same application (Q8)
	db := setupInterviewTestDB(t)
	h := &InterviewHandler{DB: db}
	job := seedJobForInterview(t, db)
	app := seedApplicationForInterview(t, db, job.ID)
	iv1 := seedInterviewer(t, db)

	// Second interviewer
	iv2 := models.User{Name: "IV Two", Email: "iv2@example.com", Role: "interviewer", IsActive: true, Provider: "email"}
	iv2.HashPassword("Pass@1234")
	db.Create(&iv2)

	seedInterview(t, db, app.ID, iv1.ID, "SCHEDULED")

	body, _ := json.Marshal(map[string]interface{}{
		"application_id": app.ID, "interviewer_id": iv2.ID,
		"scheduled_date": "2026-06-02T10:00:00Z", "interview_type": "BEHAVIORAL",
	})
	req := httptest.NewRequest(http.MethodPost, "/interviews", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	h.CreateInterview(rr, req)
	if rr.Code != http.StatusCreated {
		t.Errorf("expected 201 for panel interview (second interviewer), got %d — body: %s", rr.Code, rr.Body.String())
	}
	var appAfter models.Application
	if err := db.First(&appAfter, app.ID).Error; err != nil {
		t.Fatalf("reload application: %v", err)
	}
	if appAfter.Status != "INTERVIEW" {
		t.Errorf("expected application status INTERVIEW after second assign, got %q", appAfter.Status)
	}
}

func TestCreateInterview_InterviewTypeCaseInsensitive(t *testing.T) {
	db := setupInterviewTestDB(t)
	h := &InterviewHandler{DB: db}
	job := seedJobForInterview(t, db)
	app := seedApplicationForInterview(t, db, job.ID)
	iv := seedInterviewer(t, db)
	body, _ := json.Marshal(map[string]interface{}{
		"application_id": app.ID, "interviewer_id": iv.ID,
		"scheduled_date": "2026-06-01T10:00:00Z", "interview_type": "behavioral",
	})
	req := httptest.NewRequest(http.MethodPost, "/interviews", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	h.CreateInterview(rr, req)
	if rr.Code != http.StatusCreated {
		t.Errorf("expected 201 for lowercase type, got %d", rr.Code)
	}
	var result models.Interview
	json.NewDecoder(rr.Body).Decode(&result)
	if result.InterviewType != "BEHAVIORAL" {
		t.Errorf("expected stored type BEHAVIORAL, got %s", result.InterviewType)
	}
}

// ── ListInterviews ────────────────────────────────────────────────────────────

func TestListInterviews_Unauthorized(t *testing.T) {
	db := setupInterviewTestDB(t)
	h := &InterviewHandler{DB: db}
	req := httptest.NewRequest(http.MethodGet, "/interviews", nil)
	rr := httptest.NewRecorder()
	h.ListInterviews(rr, req)
	if rr.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", rr.Code)
	}
}

func TestListInterviews_AdminSeesAll(t *testing.T) {
	db := setupInterviewTestDB(t)
	h := &InterviewHandler{DB: db}
	job := seedJobForInterview(t, db)
	app := seedApplicationForInterview(t, db, job.ID)
	iv := seedInterviewer(t, db)
	seedInterview(t, db, app.ID, iv.ID, "SCHEDULED")
	seedInterview(t, db, app.ID, iv.ID+1, "SCHEDULED") // non-existent IV — still creates row
	req := httptest.NewRequest(http.MethodGet, "/interviews", nil)
	req = withInterviewClaims(req, 1, "admin")
	rr := httptest.NewRecorder()
	h.ListInterviews(rr, req)
	if rr.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rr.Code)
	}
	var result []models.Interview
	json.NewDecoder(rr.Body).Decode(&result)
	if len(result) != 2 {
		t.Errorf("expected 2 interviews for admin, got %d", len(result))
	}
}

func TestListInterviews_InterviewerSeesOnlyOwn(t *testing.T) {
	db := setupInterviewTestDB(t)
	h := &InterviewHandler{DB: db}
	job := seedJobForInterview(t, db)
	app := seedApplicationForInterview(t, db, job.ID)
	iv := seedInterviewer(t, db)

	iv2 := models.User{Name: "IV Two", Email: "iv2b@example.com", Role: "interviewer", IsActive: true, Provider: "email"}
	iv2.HashPassword("Pass@1234")
	db.Create(&iv2)

	seedInterview(t, db, app.ID, iv.ID, "SCHEDULED")
	seedInterview(t, db, app.ID, iv2.ID, "SCHEDULED")

	req := httptest.NewRequest(http.MethodGet, "/interviews", nil)
	req = withInterviewClaims(req, iv.ID, "interviewer")
	rr := httptest.NewRecorder()
	h.ListInterviews(rr, req)
	if rr.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rr.Code)
	}
	var result []models.Interview
	json.NewDecoder(rr.Body).Decode(&result)
	if len(result) != 1 {
		t.Errorf("expected 1 interview for interviewer, got %d", len(result))
	}
	if result[0].InterviewerID != iv.ID {
		t.Errorf("expected interviewer_id %d, got %d", iv.ID, result[0].InterviewerID)
	}
}

func TestListInterviews_FilterByApplicationID(t *testing.T) {
	db := setupInterviewTestDB(t)
	h := &InterviewHandler{DB: db}
	job := seedJobForInterview(t, db)
	app1 := seedApplicationForInterview(t, db, job.ID)

	// Second candidate + application
	cand2 := models.Candidate{Name: "C2", Email: "c2@example.com"}
	db.Create(&cand2)
	app2 := models.Application{CandidateID: cand2.ID, JobID: job.ID, Status: "APPLIED"}
	db.Create(&app2)

	iv := seedInterviewer(t, db)
	seedInterview(t, db, app1.ID, iv.ID, "SCHEDULED")

	iv2 := models.User{Name: "IV3", Email: "iv3@example.com", Role: "interviewer", IsActive: true, Provider: "email"}
	iv2.HashPassword("Pass@1234")
	db.Create(&iv2)
	seedInterview(t, db, app2.ID, iv2.ID, "SCHEDULED")

	req := httptest.NewRequest(http.MethodGet, "/interviews?application_id="+idStr(app1.ID), nil)
	req = withInterviewClaims(req, 1, "hiring_manager")
	rr := httptest.NewRecorder()
	h.ListInterviews(rr, req)
	if rr.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rr.Code)
	}
	var result []models.Interview
	json.NewDecoder(rr.Body).Decode(&result)
	if len(result) != 1 {
		t.Errorf("expected 1 interview filtered by application, got %d", len(result))
	}
}

// ── GetInterview ──────────────────────────────────────────────────────────────

func TestGetInterview_NotFound(t *testing.T) {
	db := setupInterviewTestDB(t)
	h := &InterviewHandler{DB: db}
	req := httptest.NewRequest(http.MethodGet, "/interviews/9999", nil)
	req = withInterviewClaims(req, 1, "admin")
	router := mux.NewRouter()
	router.HandleFunc("/interviews/{id}", h.GetInterview)
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)
	if rr.Code != http.StatusNotFound {
		t.Errorf("expected 404, got %d", rr.Code)
	}
}

func TestGetInterview_InterviewerForbiddenForOthers(t *testing.T) {
	db := setupInterviewTestDB(t)
	h := &InterviewHandler{DB: db}
	job := seedJobForInterview(t, db)
	app := seedApplicationForInterview(t, db, job.ID)
	iv := seedInterviewer(t, db)
	interview := seedInterview(t, db, app.ID, iv.ID, "SCHEDULED")

	req := httptest.NewRequest(http.MethodGet, "/interviews/"+idStr(interview.ID), nil)
	req = withInterviewClaims(req, iv.ID+99, "interviewer") // different interviewer
	router := mux.NewRouter()
	router.HandleFunc("/interviews/{id}", h.GetInterview)
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)
	if rr.Code != http.StatusForbidden {
		t.Errorf("expected 403, got %d", rr.Code)
	}
}

func TestGetInterview_InterviewerCanViewOwn(t *testing.T) {
	db := setupInterviewTestDB(t)
	h := &InterviewHandler{DB: db}
	job := seedJobForInterview(t, db)
	app := seedApplicationForInterview(t, db, job.ID)
	iv := seedInterviewer(t, db)
	interview := seedInterview(t, db, app.ID, iv.ID, "SCHEDULED")

	req := httptest.NewRequest(http.MethodGet, "/interviews/"+idStr(interview.ID), nil)
	req = withInterviewClaims(req, iv.ID, "interviewer")
	router := mux.NewRouter()
	router.HandleFunc("/interviews/{id}", h.GetInterview)
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)
	if rr.Code != http.StatusOK {
		t.Errorf("expected 200, got %d — body: %s", rr.Code, rr.Body.String())
	}
}

func TestGetInterview_AdminCanViewAny(t *testing.T) {
	db := setupInterviewTestDB(t)
	h := &InterviewHandler{DB: db}
	job := seedJobForInterview(t, db)
	app := seedApplicationForInterview(t, db, job.ID)
	iv := seedInterviewer(t, db)
	interview := seedInterview(t, db, app.ID, iv.ID, "SCHEDULED")

	req := httptest.NewRequest(http.MethodGet, "/interviews/"+idStr(interview.ID), nil)
	req = withInterviewClaims(req, 999, "admin")
	router := mux.NewRouter()
	router.HandleFunc("/interviews/{id}", h.GetInterview)
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)
	if rr.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rr.Code)
	}
}

// ── UpdateInterview ───────────────────────────────────────────────────────────

func TestUpdateInterview_NotFound(t *testing.T) {
	db := setupInterviewTestDB(t)
	h := &InterviewHandler{DB: db}
	body, _ := json.Marshal(map[string]string{"status": "COMPLETED"})
	req := httptest.NewRequest(http.MethodPatch, "/interviews/9999", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	router := mux.NewRouter()
	router.HandleFunc("/interviews/{id}", h.UpdateInterview)
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)
	if rr.Code != http.StatusNotFound {
		t.Errorf("expected 404, got %d", rr.Code)
	}
}

func TestUpdateInterview_CannotUpdateCancelled(t *testing.T) {
	db := setupInterviewTestDB(t)
	h := &InterviewHandler{DB: db}
	job := seedJobForInterview(t, db)
	app := seedApplicationForInterview(t, db, job.ID)
	iv := seedInterviewer(t, db)
	interview := seedInterview(t, db, app.ID, iv.ID, "CANCELLED")

	body, _ := json.Marshal(map[string]string{"status": "SCHEDULED"})
	req := httptest.NewRequest(http.MethodPatch, "/interviews/"+idStr(interview.ID), bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	router := mux.NewRouter()
	router.HandleFunc("/interviews/{id}", h.UpdateInterview)
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)
	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for updating cancelled interview, got %d", rr.Code)
	}
}

func TestUpdateInterview_InvalidStatus(t *testing.T) {
	db := setupInterviewTestDB(t)
	h := &InterviewHandler{DB: db}
	job := seedJobForInterview(t, db)
	app := seedApplicationForInterview(t, db, job.ID)
	iv := seedInterviewer(t, db)
	interview := seedInterview(t, db, app.ID, iv.ID, "SCHEDULED")

	body, _ := json.Marshal(map[string]string{"status": "INVALID"})
	req := httptest.NewRequest(http.MethodPatch, "/interviews/"+idStr(interview.ID), bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	router := mux.NewRouter()
	router.HandleFunc("/interviews/{id}", h.UpdateInterview)
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)
	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for invalid status, got %d", rr.Code)
	}
}

func TestUpdateInterview_NoFields(t *testing.T) {
	db := setupInterviewTestDB(t)
	h := &InterviewHandler{DB: db}
	job := seedJobForInterview(t, db)
	app := seedApplicationForInterview(t, db, job.ID)
	iv := seedInterviewer(t, db)
	interview := seedInterview(t, db, app.ID, iv.ID, "SCHEDULED")

	body, _ := json.Marshal(map[string]interface{}{})
	req := httptest.NewRequest(http.MethodPatch, "/interviews/"+idStr(interview.ID), bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	router := mux.NewRouter()
	router.HandleFunc("/interviews/{id}", h.UpdateInterview)
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)
	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for empty update, got %d", rr.Code)
	}
}

func TestUpdateInterview_StatusSuccess(t *testing.T) {
	db := setupInterviewTestDB(t)
	h := &InterviewHandler{DB: db}
	job := seedJobForInterview(t, db)
	app := seedApplicationForInterview(t, db, job.ID)
	iv := seedInterviewer(t, db)
	interview := seedInterview(t, db, app.ID, iv.ID, "SCHEDULED")

	body, _ := json.Marshal(map[string]string{"status": "COMPLETED"})
	req := httptest.NewRequest(http.MethodPatch, "/interviews/"+idStr(interview.ID), bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	router := mux.NewRouter()
	router.HandleFunc("/interviews/{id}", h.UpdateInterview)
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)
	if rr.Code != http.StatusOK {
		t.Errorf("expected 200, got %d — body: %s", rr.Code, rr.Body.String())
	}
	var updated models.Interview
	db.First(&updated, interview.ID)
	if updated.Status != "COMPLETED" {
		t.Errorf("expected COMPLETED, got %s", updated.Status)
	}
}

func TestUpdateInterview_RescheduleSuccess(t *testing.T) {
	db := setupInterviewTestDB(t)
	h := &InterviewHandler{DB: db}
	job := seedJobForInterview(t, db)
	app := seedApplicationForInterview(t, db, job.ID)
	iv := seedInterviewer(t, db)
	interview := seedInterview(t, db, app.ID, iv.ID, "SCHEDULED")

	newDate := "2026-07-15T09:00:00Z"
	body, _ := json.Marshal(map[string]string{"scheduled_date": newDate})
	req := httptest.NewRequest(http.MethodPatch, "/interviews/"+idStr(interview.ID), bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	router := mux.NewRouter()
	router.HandleFunc("/interviews/{id}", h.UpdateInterview)
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)
	if rr.Code != http.StatusOK {
		t.Errorf("expected 200, got %d — body: %s", rr.Code, rr.Body.String())
	}
}

// ── CancelInterview ───────────────────────────────────────────────────────────

func TestCancelInterview_NotFound(t *testing.T) {
	db := setupInterviewTestDB(t)
	h := &InterviewHandler{DB: db}
	req := httptest.NewRequest(http.MethodPatch, "/interviews/9999/cancel", nil)
	router := mux.NewRouter()
	router.HandleFunc("/interviews/{id}/cancel", h.CancelInterview)
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)
	if rr.Code != http.StatusNotFound {
		t.Errorf("expected 404, got %d", rr.Code)
	}
}

func TestCancelInterview_AlreadyCancelled(t *testing.T) {
	db := setupInterviewTestDB(t)
	h := &InterviewHandler{DB: db}
	job := seedJobForInterview(t, db)
	app := seedApplicationForInterview(t, db, job.ID)
	iv := seedInterviewer(t, db)
	interview := seedInterview(t, db, app.ID, iv.ID, "CANCELLED")

	req := httptest.NewRequest(http.MethodPatch, "/interviews/"+idStr(interview.ID)+"/cancel", nil)
	router := mux.NewRouter()
	router.HandleFunc("/interviews/{id}/cancel", h.CancelInterview)
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)
	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", rr.Code)
	}
}

func TestCancelInterview_Success(t *testing.T) {
	db := setupInterviewTestDB(t)
	h := &InterviewHandler{DB: db}
	job := seedJobForInterview(t, db)
	app := seedApplicationForInterview(t, db, job.ID)
	iv := seedInterviewer(t, db)
	interview := seedInterview(t, db, app.ID, iv.ID, "SCHEDULED")

	req := httptest.NewRequest(http.MethodPatch, "/interviews/"+idStr(interview.ID)+"/cancel", nil)
	router := mux.NewRouter()
	router.HandleFunc("/interviews/{id}/cancel", h.CancelInterview)
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)
	if rr.Code != http.StatusOK {
		t.Errorf("expected 200, got %d — body: %s", rr.Code, rr.Body.String())
	}
	var updated models.Interview
	db.First(&updated, interview.ID)
	if updated.Status != "CANCELLED" {
		t.Errorf("expected CANCELLED, got %s", updated.Status)
	}
}
