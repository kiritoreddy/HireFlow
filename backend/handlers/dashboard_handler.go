package handlers

import (
	"encoding/json"
	"net/http"

	"backend/models"

	"gorm.io/gorm"
)

// DashboardHandler encapsulates database dependency for dashboard operations
type DashboardHandler struct {
	DB *gorm.DB
}

// DepartmentSummary represents job counts per department
// Used in dashboard stats to show hiring activity by department
type DepartmentSummary struct {
	Department  string `json:"department"`
	OpenCount   int64  `json:"openCount"`
	ClosedCount int64  `json:"closedCount"`
}

// DashboardStatsResponse is the complete dashboard stats response shape
// Field names are camelCase to match Angular frontend conventions (confirmed with Vardhan)
// Sprint 4: Added interview statistics fields (totalInterviews, pendingInterviews, completedInterviews)
type DashboardStatsResponse struct {
	TotalJobs           int64               `json:"totalJobs"`
	OpenJobs            int64               `json:"openJobs"`
	ClosedJobs          int64               `json:"closedJobs"`
	TotalCandidates     int64               `json:"totalCandidates"`
	TotalUsers          int64               `json:"totalUsers"`
	DepartmentSummary   []DepartmentSummary `json:"departmentSummary"`
	TotalInterviews     int64               `json:"totalInterviews"`     // Sprint 4: total interviews scheduled
	PendingInterviews   int64               `json:"pendingInterviews"`   // Sprint 4: interviews without feedback yet
	CompletedInterviews int64               `json:"completedInterviews"` // Sprint 4: interviews with feedback submitted
}

// GetDashboardStats handles GET /dashboard/stats
// Returns aggregated stats for the hiring dashboard
// Accessible by: admin, hiring_manager, interviewer (NOT candidate)
func (h *DashboardHandler) GetDashboardStats(w http.ResponseWriter, r *http.Request) {
	var stats DashboardStatsResponse

	// Count total jobs
	if err := h.DB.Model(&models.Job{}).Count(&stats.TotalJobs).Error; err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to retrieve dashboard stats"})
		return
	}

	// Count open jobs (status = 'Open')
	if err := h.DB.Model(&models.Job{}).Where("status = ?", "Open").Count(&stats.OpenJobs).Error; err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to retrieve dashboard stats"})
		return
	}

	// Count closed jobs (status = 'Closed')
	if err := h.DB.Model(&models.Job{}).Where("status = ?", "Closed").Count(&stats.ClosedJobs).Error; err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to retrieve dashboard stats"})
		return
	}

	// Count total candidates from applications table
	// Excludes WITHDRAWN applications as confirmed with Vardhan
	if err := h.DB.Model(&models.Application{}).
		Where("status != ?", "WITHDRAWN").
		Count(&stats.TotalCandidates).Error; err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to retrieve dashboard stats"})
		return
	}

	// Count total users
	if err := h.DB.Model(&models.User{}).Count(&stats.TotalUsers).Error; err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to retrieve dashboard stats"})
		return
	}

	// Sprint 4: Count total interviews scheduled
	if err := h.DB.Model(&models.Interview{}).Count(&stats.TotalInterviews).Error; err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to retrieve dashboard stats"})
		return
	}

	// Sprint 4: Count completed interviews
	// Completed = interviews that have feedback submitted (InterviewFeedback record exists)
	if err := h.DB.Model(&models.Interview{}).
		Joins("INNER JOIN interview_feedbacks ON interview_feedbacks.interview_id = interviews.id").
		Count(&stats.CompletedInterviews).Error; err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to retrieve dashboard stats"})
		return
	}

	// Sprint 4: Pending = total interviews minus completed interviews
	stats.PendingInterviews = stats.TotalInterviews - stats.CompletedInterviews

	// Build department summary using GROUP BY query
	// Counts open and closed jobs per department
	type deptRow struct {
		Department string
		Status     string
		Count      int64
	}
	var rows []deptRow
	h.DB.Model(&models.Job{}).
		Select("department, status, COUNT(*) as count").
		Group("department, status").
		Scan(&rows)

	// Aggregate department counts into map then convert to slice
	// Uses tagged switch on row.Status for cleaner code (QF1003)
	deptMap := make(map[string]*DepartmentSummary)
	for _, row := range rows {
		if _, exists := deptMap[row.Department]; !exists {
			deptMap[row.Department] = &DepartmentSummary{Department: row.Department}
		}
		switch row.Status {
		case "Open":
			deptMap[row.Department].OpenCount = row.Count
		case "Closed":
			deptMap[row.Department].ClosedCount = row.Count
		}
	}

	// Convert map to slice for JSON response
	stats.DepartmentSummary = make([]DepartmentSummary, 0, len(deptMap))
	for _, dept := range deptMap {
		stats.DepartmentSummary = append(stats.DepartmentSummary, *dept)
	}

	// Return dashboard stats as JSON with 200 OK
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(stats)
}
