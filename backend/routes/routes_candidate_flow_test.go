package routes

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"backend/models"
	"backend/utils"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func TestCandidateApplyThenListApplications_HTTP(t *testing.T) {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{Logger: logger.Default.LogMode(logger.Silent)})
	if err != nil {
		t.Fatalf("db: %v", err)
	}
	if err := db.AutoMigrate(&models.User{}, &models.PasswordResetToken{}, &models.Job{}, &models.Candidate{}, &models.Application{}); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	job := models.Job{Title: "Engineer", Department: "Eng", Status: "Open"}
	if err := db.Create(&job).Error; err != nil {
		t.Fatalf("seed job: %v", err)
	}

	handler := SetupRoutes(db)
	email := "portaluser@example.com"
	token, err := utils.GenerateJWT(99, email, "candidate")
	if err != nil {
		t.Fatalf("jwt: %v", err)
	}

	applyBody := map[string]any{"job_id": job.ID, "name": "Portal User", "email": "ignored@example.com"}
	applyJSON, _ := json.Marshal(applyBody)
	reqApply := httptest.NewRequest(http.MethodPost, "/api/candidate/apply", bytes.NewReader(applyJSON))
	reqApply.Header.Set("Content-Type", "application/json")
	reqApply.Header.Set("Authorization", "Bearer "+token)
	rrApply := httptest.NewRecorder()
	handler.ServeHTTP(rrApply, reqApply)
	if rrApply.Code != http.StatusCreated {
		t.Fatalf("apply: want 201 got %d body=%s", rrApply.Code, rrApply.Body.String())
	}

	reqList := httptest.NewRequest(http.MethodGet, "/api/candidate/my-applications", nil)
	reqList.Header.Set("Authorization", "Bearer "+token)
	rrList := httptest.NewRecorder()
	handler.ServeHTTP(rrList, reqList)
	if rrList.Code != http.StatusOK {
		t.Fatalf("list: want 200 got %d body=%s", rrList.Code, rrList.Body.String())
	}

	var rows []map[string]any
	if err := json.NewDecoder(rrList.Body).Decode(&rows); err != nil {
		t.Fatalf("decode list: %v", err)
	}
	if len(rows) != 1 {
		t.Fatalf("want 1 application, got %d: %v", len(rows), rows)
	}
	if int(rows[0]["job_id"].(float64)) != int(job.ID) {
		t.Errorf("job_id: got %v want %d", rows[0]["job_id"], job.ID)
	}
	if rows[0]["applied_at"] == nil || rows[0]["applied_at"] == "" {
		t.Errorf("expected applied_at, got %v", rows[0]["applied_at"])
	}
}
