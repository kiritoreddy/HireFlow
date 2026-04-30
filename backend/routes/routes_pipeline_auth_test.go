package routes

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"

	"backend/models"
	"backend/utils"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func setupPipelineTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{Logger: logger.Default.LogMode(logger.Silent)})
	if err != nil {
		t.Fatalf("db: %v", err)
	}
	if err := db.AutoMigrate(
		&models.User{},
		&models.Job{},
		&models.Candidate{},
		&models.Application{},
		&models.Interview{},
	); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	return db
}

func TestPipeline_ListJobApplications_RequiresHiringManagerOrAdmin(t *testing.T) {
	db := setupPipelineTestDB(t)
	job := models.Job{Title: "Eng", Department: "E", Status: "Open"}
	if err := db.Create(&job).Error; err != nil {
		t.Fatalf("seed job: %v", err)
	}
	handler := SetupRoutes(db)
	url := "/api/jobs/" + uintToStr(job.ID) + "/applications"

	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, httptest.NewRequest(http.MethodGet, url, nil))
	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("no auth: want 401 got %d body=%s", rr.Code, rr.Body.String())
	}

	candTok, _ := utils.GenerateJWT(1, "c@x.com", "candidate")
	rr2 := httptest.NewRecorder()
	req2 := httptest.NewRequest(http.MethodGet, url, nil)
	req2.Header.Set("Authorization", "Bearer "+candTok)
	handler.ServeHTTP(rr2, req2)
	if rr2.Code != http.StatusForbidden {
		t.Fatalf("candidate: want 403 got %d body=%s", rr2.Code, rr2.Body.String())
	}

	hmTok, _ := utils.GenerateJWT(2, "hm@x.com", "hiring_manager")
	rr3 := httptest.NewRecorder()
	req3 := httptest.NewRequest(http.MethodGet, url, nil)
	req3.Header.Set("Authorization", "Bearer "+hmTok)
	handler.ServeHTTP(rr3, req3)
	if rr3.Code != http.StatusOK {
		t.Fatalf("hiring_manager: want 200 got %d body=%s", rr3.Code, rr3.Body.String())
	}
}

func TestPipeline_UpdateApplicationStage_RequiresHiringManagerOrAdmin(t *testing.T) {
	db := setupPipelineTestDB(t)
	job := models.Job{Title: "Eng", Department: "E", Status: "Open"}
	if err := db.Create(&job).Error; err != nil {
		t.Fatalf("seed job: %v", err)
	}
	cand := models.Candidate{Name: "C", Email: "c@x.com"}
	if err := db.Create(&cand).Error; err != nil {
		t.Fatalf("seed cand: %v", err)
	}
	app := models.Application{CandidateID: cand.ID, JobID: job.ID, Status: "APPLIED"}
	if err := db.Create(&app).Error; err != nil {
		t.Fatalf("seed app: %v", err)
	}

	handler := SetupRoutes(db)
	url := "/api/applications/" + uintToStr(app.ID) + "/stage"
	body, _ := json.Marshal(map[string]string{"stage": "INTERVIEW"})

	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, httptest.NewRequest(http.MethodPatch, url, bytes.NewReader(body)))
	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("no auth: want 401 got %d", rr.Code)
	}

	candTok, _ := utils.GenerateJWT(1, "c@x.com", "candidate")
	rr2 := httptest.NewRecorder()
	req2 := httptest.NewRequest(http.MethodPatch, url, bytes.NewReader(body))
	req2.Header.Set("Content-Type", "application/json")
	req2.Header.Set("Authorization", "Bearer "+candTok)
	handler.ServeHTTP(rr2, req2)
	if rr2.Code != http.StatusForbidden {
		t.Fatalf("candidate: want 403 got %d", rr2.Code)
	}

	hmTok, _ := utils.GenerateJWT(2, "hm@x.com", "hiring_manager")
	rr3 := httptest.NewRecorder()
	req3 := httptest.NewRequest(http.MethodPatch, url, bytes.NewReader(body))
	req3.Header.Set("Content-Type", "application/json")
	req3.Header.Set("Authorization", "Bearer "+hmTok)
	handler.ServeHTTP(rr3, req3)
	if rr3.Code != http.StatusOK {
		t.Fatalf("hiring_manager: want 200 got %d body=%s", rr3.Code, rr3.Body.String())
	}
}

func TestInterviewerAssignments_InterviewersOnly(t *testing.T) {
	db := setupPipelineTestDB(t)
	handler := SetupRoutes(db)

	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, httptest.NewRequest(http.MethodGet, "/interviewer/assignments", nil))
	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("no auth: want 401 got %d", rr.Code)
	}

	hmTok, _ := utils.GenerateJWT(2, "hm@x.com", "hiring_manager")
	rr2 := httptest.NewRecorder()
	req2 := httptest.NewRequest(http.MethodGet, "/interviewer/assignments", nil)
	req2.Header.Set("Authorization", "Bearer "+hmTok)
	handler.ServeHTTP(rr2, req2)
	if rr2.Code != http.StatusForbidden {
		t.Fatalf("hiring_manager: want 403 got %d", rr2.Code)
	}

	ivTok, _ := utils.GenerateJWT(3, "iv@x.com", "interviewer")
	rr3 := httptest.NewRecorder()
	req3 := httptest.NewRequest(http.MethodGet, "/interviewer/assignments", nil)
	req3.Header.Set("Authorization", "Bearer "+ivTok)
	handler.ServeHTTP(rr3, req3)
	if rr3.Code != http.StatusOK {
		t.Fatalf("interviewer: want 200 got %d body=%s", rr3.Code, rr3.Body.String())
	}
}

func uintToStr(id uint) string {
	return strconv.FormatUint(uint64(id), 10)
}
