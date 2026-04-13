package handlers

import (
    "encoding/json"
    "net/http"
    "net/http/httptest"
    "testing"

    "backend/models"
)

// setupDashboardTestDB creates an in-memory SQLite database with all dashboard-related tables
func setupDashboardTestDB(t *testing.T) *DashboardHandler {
    db := setupTestDB(t)
    if err := db.AutoMigrate(&models.Job{}, &models.Application{}, &models.Candidate{}); err != nil {
        t.Fatalf("Failed to migrate dashboard test database: %v", err)
    }
    return &DashboardHandler{DB: db}
}

// ─── GetDashboardStats Tests ──────────────────────────────────────────────────

// TestGetDashboardStats_EmptyDatabase verifies stats return zeros when no data exists
func TestGetDashboardStats_EmptyDatabase(t *testing.T) {
    handler := setupDashboardTestDB(t)

    req, _ := http.NewRequest(http.MethodGet, "/dashboard/stats", nil)
    req = injectAdminClaims(req)
    rr := httptest.NewRecorder()
    handler.GetDashboardStats(rr, req)

    if rr.Code != http.StatusOK {
        t.Errorf("Expected status 200, got %d. Body: %s", rr.Code, rr.Body.String())
    }

    var stats DashboardStatsResponse
    if err := json.NewDecoder(rr.Body).Decode(&stats); err != nil {
        t.Fatalf("Failed to decode response: %v", err)
    }

    if stats.TotalJobs != 0 {
        t.Errorf("Expected totalJobs 0, got %d", stats.TotalJobs)
    }
    if stats.TotalUsers != 0 {
        t.Errorf("Expected totalUsers 0, got %d", stats.TotalUsers)
    }
    if stats.TotalCandidates != 0 {
        t.Errorf("Expected totalCandidates 0, got %d", stats.TotalCandidates)
    }
    if stats.DepartmentSummary == nil {
        t.Error("Expected departmentSummary to be empty slice, got nil")
    }
}

// TestGetDashboardStats_TotalJobsCount verifies correct total job count
func TestGetDashboardStats_TotalJobsCount(t *testing.T) {
    handler := setupDashboardTestDB(t)

    // Create 3 jobs
    for i := 0; i < 3; i++ {
        handler.DB.Create(&models.Job{Title: "Engineer", Status: "Open", Department: "Engineering"})
    }

    req, _ := http.NewRequest(http.MethodGet, "/dashboard/stats", nil)
    req = injectAdminClaims(req)
    rr := httptest.NewRecorder()
    handler.GetDashboardStats(rr, req)

    var stats DashboardStatsResponse
    json.NewDecoder(rr.Body).Decode(&stats)

    if stats.TotalJobs != 3 {
        t.Errorf("Expected totalJobs 3, got %d", stats.TotalJobs)
    }
}

// TestGetDashboardStats_OpenClosedJobsCount verifies open and closed job counts
func TestGetDashboardStats_OpenClosedJobsCount(t *testing.T) {
    handler := setupDashboardTestDB(t)

    // Create 2 open and 1 closed job
    handler.DB.Create(&models.Job{Title: "Engineer 1", Status: "Open", Department: "Engineering"})
    handler.DB.Create(&models.Job{Title: "Engineer 2", Status: "Open", Department: "Engineering"})
    handler.DB.Create(&models.Job{Title: "Designer", Status: "Closed", Department: "Design"})

    req, _ := http.NewRequest(http.MethodGet, "/dashboard/stats", nil)
    req = injectAdminClaims(req)
    rr := httptest.NewRecorder()
    handler.GetDashboardStats(rr, req)

    var stats DashboardStatsResponse
    json.NewDecoder(rr.Body).Decode(&stats)

    if stats.OpenJobs != 2 {
        t.Errorf("Expected openJobs 2, got %d", stats.OpenJobs)
    }
    if stats.ClosedJobs != 1 {
        t.Errorf("Expected closedJobs 1, got %d", stats.ClosedJobs)
    }
    if stats.TotalJobs != 3 {
        t.Errorf("Expected totalJobs 3, got %d", stats.TotalJobs)
    }
}

// TestGetDashboardStats_TotalCandidatesExcludesWithdrawn verifies withdrawn applications excluded
func TestGetDashboardStats_TotalCandidatesExcludesWithdrawn(t *testing.T) {
    handler := setupDashboardTestDB(t)

    // Create 3 applications: 2 active, 1 withdrawn
    handler.DB.Create(&models.Application{Status: "APPLIED"})
    handler.DB.Create(&models.Application{Status: "APPLIED"})
    handler.DB.Create(&models.Application{Status: "WITHDRAWN"}) // Should be excluded

    req, _ := http.NewRequest(http.MethodGet, "/dashboard/stats", nil)
    req = injectAdminClaims(req)
    rr := httptest.NewRecorder()
    handler.GetDashboardStats(rr, req)

    var stats DashboardStatsResponse
    json.NewDecoder(rr.Body).Decode(&stats)

    if stats.TotalCandidates != 2 {
        t.Errorf("Expected totalCandidates 2 (excluding withdrawn), got %d", stats.TotalCandidates)
    }
}

// TestGetDashboardStats_TotalUsersCount verifies correct user count
func TestGetDashboardStats_TotalUsersCount(t *testing.T) {
    handler := setupDashboardTestDB(t)

    // Create 2 users
    user1 := models.User{Name: "User One", Email: "user1@example.com", Role: "hiring_manager", IsActive: true}
    user1.HashPassword("SecurePass123!")
    handler.DB.Create(&user1)

    user2 := models.User{Name: "User Two", Email: "user2@example.com", Role: "interviewer", IsActive: true}
    user2.HashPassword("SecurePass123!")
    handler.DB.Create(&user2)

    req, _ := http.NewRequest(http.MethodGet, "/dashboard/stats", nil)
    req = injectAdminClaims(req)
    rr := httptest.NewRecorder()
    handler.GetDashboardStats(rr, req)

    var stats DashboardStatsResponse
    json.NewDecoder(rr.Body).Decode(&stats)

    if stats.TotalUsers != 2 {
        t.Errorf("Expected totalUsers 2, got %d", stats.TotalUsers)
    }
}

// TestGetDashboardStats_DepartmentSummary verifies department summary is correct
func TestGetDashboardStats_DepartmentSummary(t *testing.T) {
    handler := setupDashboardTestDB(t)

    // Create jobs in different departments
    handler.DB.Create(&models.Job{Title: "Eng 1", Status: "Open", Department: "Engineering"})
    handler.DB.Create(&models.Job{Title: "Eng 2", Status: "Open", Department: "Engineering"})
    handler.DB.Create(&models.Job{Title: "Eng 3", Status: "Closed", Department: "Engineering"})
    handler.DB.Create(&models.Job{Title: "Design 1", Status: "Open", Department: "Design"})

    req, _ := http.NewRequest(http.MethodGet, "/dashboard/stats", nil)
    req = injectAdminClaims(req)
    rr := httptest.NewRecorder()
    handler.GetDashboardStats(rr, req)

    var stats DashboardStatsResponse
    json.NewDecoder(rr.Body).Decode(&stats)

    if len(stats.DepartmentSummary) != 2 {
        t.Errorf("Expected 2 departments, got %d", len(stats.DepartmentSummary))
    }

    // Find Engineering department
    var engineering *DepartmentSummary
    for i := range stats.DepartmentSummary {
        if stats.DepartmentSummary[i].Department == "Engineering" {
            engineering = &stats.DepartmentSummary[i]
        }
    }

    if engineering == nil {
        t.Fatal("Engineering department not found in summary")
    }
    if engineering.OpenCount != 2 {
        t.Errorf("Expected Engineering openCount 2, got %d", engineering.OpenCount)
    }
    if engineering.ClosedCount != 1 {
        t.Errorf("Expected Engineering closedCount 1, got %d", engineering.ClosedCount)
    }
}

// TestGetDashboardStats_ResponseShape verifies exact JSON field names match frontend expectation
func TestGetDashboardStats_ResponseShape(t *testing.T) {
    handler := setupDashboardTestDB(t)

    req, _ := http.NewRequest(http.MethodGet, "/dashboard/stats", nil)
    req = injectAdminClaims(req)
    rr := httptest.NewRecorder()
    handler.GetDashboardStats(rr, req)

    // Decode into raw map to verify exact camelCase field names
    var raw map[string]interface{}
    if err := json.NewDecoder(rr.Body).Decode(&raw); err != nil {
        t.Fatalf("Failed to decode response: %v", err)
    }

    // Verify all required camelCase fields exist (confirmed with Vardhan)
    requiredFields := []string{
        "totalJobs",
        "openJobs",
        "closedJobs",
        "totalCandidates",
        "totalUsers",
        "departmentSummary",
    }

    for _, field := range requiredFields {
        if _, exists := raw[field]; !exists {
            t.Errorf("Expected field '%s' in response, not found", field)
        }
    }
}