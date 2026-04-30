package handlers

import (
	"bytes"
	"encoding/json"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"strconv"
	"strings"
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

func setupCandidateTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		t.Fatalf("failed to open test DB: %v", err)
	}
	if err := db.AutoMigrate(&models.Candidate{}, &models.Job{}, &models.Application{}); err != nil {
		t.Fatalf("failed to migrate: %v", err)
	}
	return db
}

// ── inject fake JWT claims ────────────────────────────────────────────────────

func withCandidateClaims(r *http.Request, role, email string) *http.Request {
	claims := &utils.JWTClaims{Email: email, Role: role}
	ctx := middleware.ContextWithClaims(r.Context(), claims)
	return r.WithContext(ctx)
}

// ── seed helpers ──────────────────────────────────────────────────────────────

func seedTestJob(t *testing.T, db *gorm.DB) models.Job {
	t.Helper()
	job := models.Job{Title: "Test Engineer", Department: "QA", Status: "Open"}
	if err := db.Create(&job).Error; err != nil {
		t.Fatalf("seed job: %v", err)
	}
	return job
}

func seedTestCandidate(t *testing.T, db *gorm.DB, email string) models.Candidate {
	t.Helper()
	cand := models.Candidate{Name: "Test User", Email: email}
	if err := db.Create(&cand).Error; err != nil {
		t.Fatalf("seed candidate: %v", err)
	}
	return cand
}

func seedTestApplication(t *testing.T, db *gorm.DB, candID, jobID uint, status string) models.Application {
	t.Helper()
	app := models.Application{CandidateID: candID, JobID: jobID, Status: status}
	if err := db.Create(&app).Error; err != nil {
		t.Fatalf("seed application: %v", err)
	}
	return app
}

func uidStr(id uint) string { return strconv.Itoa(int(id)) }

// ── ApplyWithCandidate ────────────────────────────────────────────────────────

func TestApplyWithCandidate_Unauthorized(t *testing.T) {
	db := setupCandidateTestDB(t)
	h := &CandidateHandler{DB: db}
	body, _ := json.Marshal(map[string]interface{}{"job_id": 1})
	req := httptest.NewRequest(http.MethodPost, "/api/candidate/apply", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	h.ApplyWithCandidate(rr, req)
	if rr.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", rr.Code)
	}
}

func TestApplyWithCandidate_ForbiddenForHiringManager(t *testing.T) {
	db := setupCandidateTestDB(t)
	h := &CandidateHandler{DB: db}
	body, _ := json.Marshal(map[string]interface{}{"job_id": 1})
	req := httptest.NewRequest(http.MethodPost, "/api/candidate/apply", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req = withCandidateClaims(req, "hiring_manager", "hm@example.com")
	rr := httptest.NewRecorder()
	h.ApplyWithCandidate(rr, req)
	if rr.Code != http.StatusForbidden {
		t.Errorf("expected 403, got %d", rr.Code)
	}
}

func TestApplyWithCandidate_MissingJobID(t *testing.T) {
	db := setupCandidateTestDB(t)
	h := &CandidateHandler{DB: db}
	body, _ := json.Marshal(map[string]interface{}{"job_id": 0})
	req := httptest.NewRequest(http.MethodPost, "/api/candidate/apply", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req = withCandidateClaims(req, "candidate", "c@example.com")
	rr := httptest.NewRecorder()
	h.ApplyWithCandidate(rr, req)
	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", rr.Code)
	}
}

func TestApplyWithCandidate_JobNotFound(t *testing.T) {
	db := setupCandidateTestDB(t)
	h := &CandidateHandler{DB: db}
	body, _ := json.Marshal(map[string]interface{}{"job_id": 9999})
	req := httptest.NewRequest(http.MethodPost, "/api/candidate/apply", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req = withCandidateClaims(req, "candidate", "c@example.com")
	rr := httptest.NewRecorder()
	h.ApplyWithCandidate(rr, req)
	if rr.Code != http.StatusNotFound {
		t.Errorf("expected 404, got %d", rr.Code)
	}
}

func TestApplyWithCandidate_Success(t *testing.T) {
	db := setupCandidateTestDB(t)
	h := &CandidateHandler{DB: db}
	job := seedTestJob(t, db)
	body, _ := json.Marshal(map[string]interface{}{"job_id": job.ID, "name": "Akki"})
	req := httptest.NewRequest(http.MethodPost, "/api/candidate/apply", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req = withCandidateClaims(req, "candidate", "akki@example.com")
	rr := httptest.NewRecorder()
	h.ApplyWithCandidate(rr, req)
	if rr.Code != http.StatusCreated {
		t.Errorf("expected 201, got %d — body: %s", rr.Code, rr.Body.String())
	}
}

func TestApplyWithCandidate_MultipartStoresResumeFile(t *testing.T) {
	t.Setenv("HF_UPLOAD_ROOT", t.TempDir())
	db := setupCandidateTestDB(t)
	h := &CandidateHandler{DB: db}
	job := seedTestJob(t, db)

	var buf bytes.Buffer
	mw := multipart.NewWriter(&buf)
	if err := mw.WriteField("job_id", strconv.Itoa(int(job.ID))); err != nil {
		t.Fatal(err)
	}
	if err := mw.WriteField("name", "Resume User"); err != nil {
		t.Fatal(err)
	}
	part, err := mw.CreateFormFile("resume", "cv.pdf")
	if err != nil {
		t.Fatal(err)
	}
	if _, err := part.Write([]byte("%PDF-1.4")); err != nil {
		t.Fatal(err)
	}
	if err := mw.Close(); err != nil {
		t.Fatal(err)
	}

	req := httptest.NewRequest(http.MethodPost, "/api/candidate/apply", &buf)
	req.Header.Set("Content-Type", mw.FormDataContentType())
	req = withCandidateClaims(req, "candidate", "resumeuser@example.com")
	rr := httptest.NewRecorder()
	h.ApplyWithCandidate(rr, req)
	if rr.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d — body: %s", rr.Code, rr.Body.String())
	}

	var cand models.Candidate
	if err := db.Where("LOWER(TRIM(email)) = ?", "resumeuser@example.com").First(&cand).Error; err != nil {
		t.Fatalf("candidate row: %v", err)
	}
	if cand.ResumePath == "" || !strings.Contains(cand.ResumePath, "uploads/resumes/") {
		t.Fatalf("expected uploads/resumes path in resume_path, got %q", cand.ResumePath)
	}
}

func TestApplyWithCandidate_DuplicateBlocked(t *testing.T) {
	db := setupCandidateTestDB(t)
	h := &CandidateHandler{DB: db}
	job := seedTestJob(t, db)
	cand := seedTestCandidate(t, db, "dup@example.com")
	seedTestApplication(t, db, cand.ID, job.ID, "APPLIED")
	body, _ := json.Marshal(map[string]interface{}{"job_id": job.ID})
	req := httptest.NewRequest(http.MethodPost, "/api/candidate/apply", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req = withCandidateClaims(req, "candidate", "dup@example.com")
	rr := httptest.NewRecorder()
	h.ApplyWithCandidate(rr, req)
	if rr.Code != http.StatusConflict {
		t.Errorf("expected 409, got %d", rr.Code)
	}
}

func TestApplyWithCandidate_AllowsReapplyAfterWithdraw(t *testing.T) {
	db := setupCandidateTestDB(t)
	h := &CandidateHandler{DB: db}
	job := seedTestJob(t, db)
	cand := seedTestCandidate(t, db, "retry@example.com")
	seedTestApplication(t, db, cand.ID, job.ID, "WITHDRAWN")
	body, _ := json.Marshal(map[string]interface{}{"job_id": job.ID})
	req := httptest.NewRequest(http.MethodPost, "/api/candidate/apply", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req = withCandidateClaims(req, "candidate", "retry@example.com")
	rr := httptest.NewRecorder()
	h.ApplyWithCandidate(rr, req)
	if rr.Code != http.StatusCreated {
		t.Errorf("expected 201 for re-apply after withdraw, got %d", rr.Code)
	}
}

// ── ListMyApplications ────────────────────────────────────────────────────────

func TestListMyApplications_Unauthorized(t *testing.T) {
	db := setupCandidateTestDB(t)
	h := &CandidateHandler{DB: db}
	req := httptest.NewRequest(http.MethodGet, "/api/candidate/applications", nil)
	rr := httptest.NewRecorder()
	h.ListMyApplications(rr, req)
	if rr.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", rr.Code)
	}
}

func TestListMyApplications_ReturnsEmptyForUnknownCandidate(t *testing.T) {
	db := setupCandidateTestDB(t)
	h := &CandidateHandler{DB: db}
	req := httptest.NewRequest(http.MethodGet, "/api/candidate/applications", nil)
	req = withCandidateClaims(req, "candidate", "nobody@example.com")
	rr := httptest.NewRecorder()
	h.ListMyApplications(rr, req)
	if rr.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rr.Code)
	}
	var result []interface{}
	json.NewDecoder(rr.Body).Decode(&result)
	if len(result) != 0 {
		t.Errorf("expected empty list, got %d items", len(result))
	}
}

func TestListMyApplications_ReturnsOnlyOwnApplications(t *testing.T) {
	db := setupCandidateTestDB(t)
	h := &CandidateHandler{DB: db}
	job := seedTestJob(t, db)
	cand := seedTestCandidate(t, db, "mine@example.com")
	other := seedTestCandidate(t, db, "other@example.com")
	seedTestApplication(t, db, cand.ID, job.ID, "APPLIED")
	seedTestApplication(t, db, other.ID, job.ID, "APPLIED")
	req := httptest.NewRequest(http.MethodGet, "/api/candidate/applications", nil)
	req = withCandidateClaims(req, "candidate", "mine@example.com")
	rr := httptest.NewRecorder()
	h.ListMyApplications(rr, req)
	if rr.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rr.Code)
	}
	var result []map[string]interface{}
	json.NewDecoder(rr.Body).Decode(&result)
	if len(result) != 1 {
		t.Errorf("expected 1 application, got %d", len(result))
	}
}

// ── WithdrawApplication ───────────────────────────────────────────────────────

func TestWithdrawApplication_Unauthorized(t *testing.T) {
	db := setupCandidateTestDB(t)
	h := &CandidateHandler{DB: db}
	req := httptest.NewRequest(http.MethodPatch, "/api/candidate/applications/1/withdraw", nil)
	rr := httptest.NewRecorder()
	h.WithdrawApplication(rr, req)
	if rr.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", rr.Code)
	}
}

func TestWithdrawApplication_NotFound(t *testing.T) {
	db := setupCandidateTestDB(t)
	h := &CandidateHandler{DB: db}
	req := httptest.NewRequest(http.MethodPatch, "/api/candidate/applications/9999/withdraw", nil)
	req = withCandidateClaims(req, "candidate", "c@example.com")
	router := mux.NewRouter()
	router.HandleFunc("/api/candidate/applications/{id}/withdraw", h.WithdrawApplication)
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)
	if rr.Code != http.StatusNotFound {
		t.Errorf("expected 404, got %d", rr.Code)
	}
}

func TestWithdrawApplication_ForbiddenForOtherCandidate(t *testing.T) {
	db := setupCandidateTestDB(t)
	h := &CandidateHandler{DB: db}
	job := seedTestJob(t, db)
	owner := seedTestCandidate(t, db, "owner@example.com")
	app := seedTestApplication(t, db, owner.ID, job.ID, "APPLIED")
	seedTestCandidate(t, db, "attacker@example.com")
	req := httptest.NewRequest(http.MethodPatch, "/api/candidate/applications/"+uidStr(app.ID)+"/withdraw", nil)
	req = withCandidateClaims(req, "candidate", "attacker@example.com")
	router := mux.NewRouter()
	router.HandleFunc("/api/candidate/applications/{id}/withdraw", h.WithdrawApplication)
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)
	if rr.Code != http.StatusForbidden {
		t.Errorf("expected 403, got %d", rr.Code)
	}
}

func TestWithdrawApplication_Success(t *testing.T) {
	db := setupCandidateTestDB(t)
	h := &CandidateHandler{DB: db}
	job := seedTestJob(t, db)
	cand := seedTestCandidate(t, db, "me@example.com")
	app := seedTestApplication(t, db, cand.ID, job.ID, "APPLIED")
	req := httptest.NewRequest(http.MethodPatch, "/api/candidate/applications/"+uidStr(app.ID)+"/withdraw", nil)
	req = withCandidateClaims(req, "candidate", "me@example.com")
	router := mux.NewRouter()
	router.HandleFunc("/api/candidate/applications/{id}/withdraw", h.WithdrawApplication)
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)
	if rr.Code != http.StatusOK {
		t.Errorf("expected 200, got %d — body: %s", rr.Code, rr.Body.String())
	}
	var updated models.Application
	db.First(&updated, app.ID)
	if updated.Status != "WITHDRAWN" {
		t.Errorf("expected WITHDRAWN, got %s", updated.Status)
	}
}

// ── DeleteApplication ─────────────────────────────────────────────────────────

func TestDeleteApplication_Unauthorized(t *testing.T) {
	db := setupCandidateTestDB(t)
	h := &CandidateHandler{DB: db}
	req := httptest.NewRequest(http.MethodDelete, "/api/candidate/applications/1", nil)
	rr := httptest.NewRecorder()
	h.DeleteApplication(rr, req)
	if rr.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", rr.Code)
	}
}

func TestDeleteApplication_CandidateCanDeleteOwn(t *testing.T) {
	db := setupCandidateTestDB(t)
	h := &CandidateHandler{DB: db}
	job := seedTestJob(t, db)
	cand := seedTestCandidate(t, db, "del@example.com")
	app := seedTestApplication(t, db, cand.ID, job.ID, "APPLIED")
	req := httptest.NewRequest(http.MethodDelete, "/api/candidate/applications/"+uidStr(app.ID), nil)
	req = withCandidateClaims(req, "candidate", "del@example.com")
	router := mux.NewRouter()
	router.HandleFunc("/api/candidate/applications/{id}", h.DeleteApplication)
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)
	if rr.Code != http.StatusNoContent {
		t.Errorf("expected 204, got %d", rr.Code)
	}
}

func TestDeleteApplication_CandidateCannotDeleteOthers(t *testing.T) {
	db := setupCandidateTestDB(t)
	h := &CandidateHandler{DB: db}
	job := seedTestJob(t, db)
	owner := seedTestCandidate(t, db, "owner2@example.com")
	app := seedTestApplication(t, db, owner.ID, job.ID, "APPLIED")
	seedTestCandidate(t, db, "bad@example.com")
	req := httptest.NewRequest(http.MethodDelete, "/api/candidate/applications/"+uidStr(app.ID), nil)
	req = withCandidateClaims(req, "candidate", "bad@example.com")
	router := mux.NewRouter()
	router.HandleFunc("/api/candidate/applications/{id}", h.DeleteApplication)
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)
	if rr.Code != http.StatusForbidden {
		t.Errorf("expected 403, got %d", rr.Code)
	}
}

func TestDeleteApplication_AdminCanDeleteAny(t *testing.T) {
	db := setupCandidateTestDB(t)
	h := &CandidateHandler{DB: db}
	job := seedTestJob(t, db)
	cand := seedTestCandidate(t, db, "someone@example.com")
	app := seedTestApplication(t, db, cand.ID, job.ID, "APPLIED")
	req := httptest.NewRequest(http.MethodDelete, "/api/candidate/applications/"+uidStr(app.ID), nil)
	req = withCandidateClaims(req, "admin", "admin@example.com")
	router := mux.NewRouter()
	router.HandleFunc("/api/candidate/applications/{id}", h.DeleteApplication)
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)
	if rr.Code != http.StatusNoContent {
		t.Errorf("expected 204 for admin, got %d", rr.Code)
	}
}

// ── UpdateApplicationStage ────────────────────────────────────────────────────

func TestUpdateApplicationStage_InvalidStage(t *testing.T) {
	db := setupCandidateTestDB(t)
	h := &CandidateHandler{DB: db}
	job := seedTestJob(t, db)
	cand := seedTestCandidate(t, db, "s@example.com")
	app := seedTestApplication(t, db, cand.ID, job.ID, "APPLIED")
	body, _ := json.Marshal(map[string]string{"stage": "NONSENSE"})
	req := httptest.NewRequest(http.MethodPatch, "/api/applications/"+uidStr(app.ID)+"/stage", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req = withCandidateClaims(req, "hiring_manager", "hm@example.com")
	router := mux.NewRouter()
	router.HandleFunc("/api/applications/{id}/stage", h.UpdateApplicationStage)
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)
	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", rr.Code)
	}
}

func TestUpdateApplicationStage_Success(t *testing.T) {
	db := setupCandidateTestDB(t)
	h := &CandidateHandler{DB: db}
	job := seedTestJob(t, db)
	cand := seedTestCandidate(t, db, "stage@example.com")
	app := seedTestApplication(t, db, cand.ID, job.ID, "APPLIED")
	body, _ := json.Marshal(map[string]string{"stage": "INTERVIEW"})
	req := httptest.NewRequest(http.MethodPatch, "/api/applications/"+uidStr(app.ID)+"/stage", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req = withCandidateClaims(req, "hiring_manager", "hm@example.com")
	router := mux.NewRouter()
	router.HandleFunc("/api/applications/{id}/stage", h.UpdateApplicationStage)
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)
	if rr.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rr.Code)
	}
	var updated models.Application
	db.First(&updated, app.ID)
	if updated.Status != "INTERVIEW" {
		t.Errorf("expected INTERVIEW, got %s", updated.Status)
	}
}
