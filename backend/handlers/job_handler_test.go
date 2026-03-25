package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"backend/models"

	"github.com/gorilla/mux"
)

// ─── GetAllJobs Tests ─────────────────────────────────────────────────────────

// TestGetAllJobs_Success verifies jobs are returned with candidateCount
func TestGetAllJobs_Success(t *testing.T) {
	db := setupTestDB(t)
	if err := db.AutoMigrate(&models.Job{}, &models.Application{}); err != nil {
		t.Fatalf("Failed to migrate: %v", err)
	}
	handler := &JobHandler{DB: db}

	// Create test job
	job := models.Job{
		Title:       "Software Engineer",
		Description: "Build systems",
		Department:  "Engineering",
		Location:    "Remote",
		Status:      "Open",
	}
	db.Create(&job)

	req, _ := http.NewRequest(http.MethodGet, "/jobs", nil)
	req = injectAdminClaims(req)
	rr := httptest.NewRecorder()
	handler.GetAllJobs(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d. Body: %s", rr.Code, rr.Body.String())
	}

	var jobs []JobResponse
	if err := json.NewDecoder(rr.Body).Decode(&jobs); err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}
	if len(jobs) != 1 {
		t.Errorf("Expected 1 job, got %d", len(jobs))
	}
	if jobs[0].Title != "Software Engineer" {
		t.Errorf("Expected title 'Software Engineer', got %s", jobs[0].Title)
	}
	if jobs[0].CandidateCount != 0 {
		t.Errorf("Expected candidateCount 0, got %d", jobs[0].CandidateCount)
	}
}

// TestGetAllJobs_EmptyList verifies empty array returned when no jobs exist
func TestGetAllJobs_EmptyList(t *testing.T) {
	db := setupTestDB(t)
	if err := db.AutoMigrate(&models.Job{}, &models.Application{}); err != nil {
		t.Fatalf("Failed to migrate: %v", err)
	}
	handler := &JobHandler{DB: db}

	req, _ := http.NewRequest(http.MethodGet, "/jobs", nil)
	req = injectAdminClaims(req)
	rr := httptest.NewRecorder()
	handler.GetAllJobs(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", rr.Code)
	}

	var jobs []JobResponse
	json.NewDecoder(rr.Body).Decode(&jobs)
	if len(jobs) != 0 {
		t.Errorf("Expected empty list, got %d jobs", len(jobs))
	}
}

// TestGetAllJobs_WithCandidateCount verifies candidateCount is accurate
func TestGetAllJobs_WithCandidateCount(t *testing.T) {
	db := setupTestDB(t)
	if err := db.AutoMigrate(&models.Job{}, &models.Application{}); err != nil {
		t.Fatalf("Failed to migrate: %v", err)
	}
	handler := &JobHandler{DB: db}

	// Create test job
	job := models.Job{
		Title:  "Software Engineer",
		Status: "Open",
	}
	db.Create(&job)

	// Create 3 applications for this job
	for i := 0; i < 3; i++ {
		app := models.Application{JobID: job.ID, Status: "APPLIED"}
		db.Create(&app)
	}

	req, _ := http.NewRequest(http.MethodGet, "/jobs", nil)
	req = injectAdminClaims(req)
	rr := httptest.NewRecorder()
	handler.GetAllJobs(rr, req)

	var jobs []JobResponse
	json.NewDecoder(rr.Body).Decode(&jobs)

	if jobs[0].CandidateCount != 3 {
		t.Errorf("Expected candidateCount 3, got %d", jobs[0].CandidateCount)
	}
}

// ─── CreateJob Tests ──────────────────────────────────────────────────────────

// TestCreateJob_Success verifies a valid job can be created
func TestCreateJob_Success(t *testing.T) {
	db := setupTestDB(t)
	if err := db.AutoMigrate(&models.Job{}); err != nil {
		t.Fatalf("Failed to migrate: %v", err)
	}
	handler := &JobHandler{DB: db}

	body := map[string]string{
		"title":       "Senior Engineer",
		"description": "Build scalable systems",
		"department":  "Engineering",
		"location":    "Remote",
		"status":      "Open",
	}

	req := makeRequest(t, http.MethodPost, "/jobs", body)
	req = injectAdminClaims(req)
	rr := httptest.NewRecorder()
	handler.CreateJob(rr, req)

	if rr.Code != http.StatusCreated {
		t.Errorf("Expected status 201, got %d. Body: %s", rr.Code, rr.Body.String())
	}

	var job models.Job
	if err := json.NewDecoder(rr.Body).Decode(&job); err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}
	if job.Title != "Senior Engineer" {
		t.Errorf("Expected title 'Senior Engineer', got %s", job.Title)
	}
	if job.ID == 0 {
		t.Error("Expected auto-generated ID, got 0")
	}
}

// TestCreateJob_DefaultStatus verifies default status is Open
func TestCreateJob_DefaultStatus(t *testing.T) {
	db := setupTestDB(t)
	if err := db.AutoMigrate(&models.Job{}); err != nil {
		t.Fatalf("Failed to migrate: %v", err)
	}
	handler := &JobHandler{DB: db}

	body := map[string]string{
		"title":      "Engineer",
		"department": "Engineering",
		// No status provided
	}

	req := makeRequest(t, http.MethodPost, "/jobs", body)
	req = injectAdminClaims(req)
	rr := httptest.NewRecorder()
	handler.CreateJob(rr, req)

	if rr.Code != http.StatusCreated {
		t.Errorf("Expected status 201, got %d", rr.Code)
	}
}

// ─── GetJobByID Tests ─────────────────────────────────────────────────────────

// TestGetJobByID_Success verifies existing job is returned by ID
func TestGetJobByID_Success(t *testing.T) {
	db := setupTestDB(t)
	if err := db.AutoMigrate(&models.Job{}); err != nil {
		t.Fatalf("Failed to migrate: %v", err)
	}
	handler := &JobHandler{DB: db}

	// Create test job
	job := models.Job{
		Title:      "Software Engineer",
		Department: "Engineering",
		Status:     "Open",
	}
	db.Create(&job)

	req, _ := http.NewRequest(http.MethodGet, "/jobs/1", nil)
	req = injectAdminClaims(req)
	req = mux.SetURLVars(req, map[string]string{"id": "1"})
	rr := httptest.NewRecorder()
	handler.GetJobByID(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d. Body: %s", rr.Code, rr.Body.String())
	}

	var response models.Job
	json.NewDecoder(rr.Body).Decode(&response)
	if response.Title != "Software Engineer" {
		t.Errorf("Expected title 'Software Engineer', got %s", response.Title)
	}
}

// TestGetJobByID_NotFound verifies 404 for non-existent job
func TestGetJobByID_NotFound(t *testing.T) {
	db := setupTestDB(t)
	if err := db.AutoMigrate(&models.Job{}); err != nil {
		t.Fatalf("Failed to migrate: %v", err)
	}
	handler := &JobHandler{DB: db}

	req, _ := http.NewRequest(http.MethodGet, "/jobs/999", nil)
	req = injectAdminClaims(req)
	req = mux.SetURLVars(req, map[string]string{"id": "999"})
	rr := httptest.NewRecorder()
	handler.GetJobByID(rr, req)

	if rr.Code != http.StatusNotFound {
		t.Errorf("Expected status 404, got %d", rr.Code)
	}
}

// TestGetJobByID_InvalidID verifies 400 for non-numeric ID
func TestGetJobByID_InvalidID(t *testing.T) {
	db := setupTestDB(t)
	if err := db.AutoMigrate(&models.Job{}); err != nil {
		t.Fatalf("Failed to migrate: %v", err)
	}
	handler := &JobHandler{DB: db}

	req, _ := http.NewRequest(http.MethodGet, "/jobs/abc", nil)
	req = injectAdminClaims(req)
	req = mux.SetURLVars(req, map[string]string{"id": "abc"})
	rr := httptest.NewRecorder()
	handler.GetJobByID(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("Expected status 400, got %d", rr.Code)
	}
}

// ─── UpdateJob Tests ──────────────────────────────────────────────────────────

// TestUpdateJob_Success verifies existing job can be updated
func TestUpdateJob_Success(t *testing.T) {
	db := setupTestDB(t)
	if err := db.AutoMigrate(&models.Job{}); err != nil {
		t.Fatalf("Failed to migrate: %v", err)
	}
	handler := &JobHandler{DB: db}

	// Create test job
	job := models.Job{
		Title:      "Software Engineer",
		Department: "Engineering",
		Status:     "Open",
	}
	db.Create(&job)

	// Update job
	body := map[string]string{
		"title":      "Senior Software Engineer",
		"department": "Engineering",
		"status":     "Open",
	}
	req := makeRequest(t, http.MethodPut, "/jobs/1", body)
	req = injectAdminClaims(req)
	req = mux.SetURLVars(req, map[string]string{"id": "1"})
	rr := httptest.NewRecorder()
	handler.UpdateJob(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d. Body: %s", rr.Code, rr.Body.String())
	}

	var response models.Job
	json.NewDecoder(rr.Body).Decode(&response)
	if response.Title != "Senior Software Engineer" {
		t.Errorf("Expected updated title 'Senior Software Engineer', got %s", response.Title)
	}
}

// TestUpdateJob_NotFound verifies 404 for non-existent job
func TestUpdateJob_NotFound(t *testing.T) {
	db := setupTestDB(t)
	if err := db.AutoMigrate(&models.Job{}); err != nil {
		t.Fatalf("Failed to migrate: %v", err)
	}
	handler := &JobHandler{DB: db}

	body := map[string]string{
		"title":  "Updated Title",
		"status": "Open",
	}
	req := makeRequest(t, http.MethodPut, "/jobs/999", body)
	req = injectAdminClaims(req)
	req = mux.SetURLVars(req, map[string]string{"id": "999"})
	rr := httptest.NewRecorder()
	handler.UpdateJob(rr, req)

	if rr.Code != http.StatusNotFound {
		t.Errorf("Expected status 404, got %d", rr.Code)
	}
}

// ─── DeleteJob Tests ──────────────────────────────────────────────────────────

// TestDeleteJob_Success verifies existing job can be deleted
func TestDeleteJob_Success(t *testing.T) {
	db := setupTestDB(t)
	if err := db.AutoMigrate(&models.Job{}); err != nil {
		t.Fatalf("Failed to migrate: %v", err)
	}
	handler := &JobHandler{DB: db}

	// Create test job
	job := models.Job{
		Title:  "Software Engineer",
		Status: "Open",
	}
	db.Create(&job)

	req, _ := http.NewRequest(http.MethodDelete, "/jobs/1", nil)
	req = injectAdminClaims(req)
	req = mux.SetURLVars(req, map[string]string{"id": "1"})
	rr := httptest.NewRecorder()
	handler.DeleteJob(rr, req)

	if rr.Code != http.StatusNoContent {
		t.Errorf("Expected status 204, got %d", rr.Code)
	}
}

// TestDeleteJob_NotFound verifies 404 for non-existent job
func TestDeleteJob_NotFound(t *testing.T) {
	db := setupTestDB(t)
	if err := db.AutoMigrate(&models.Job{}); err != nil {
		t.Fatalf("Failed to migrate: %v", err)
	}
	handler := &JobHandler{DB: db}

	req, _ := http.NewRequest(http.MethodDelete, "/jobs/999", nil)
	req = injectAdminClaims(req)
	req = mux.SetURLVars(req, map[string]string{"id": "999"})
	rr := httptest.NewRecorder()
	handler.DeleteJob(rr, req)

	if rr.Code != http.StatusNotFound {
		t.Errorf("Expected status 404, got %d", rr.Code)
	}
}
