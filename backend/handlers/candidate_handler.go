package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"backend/models"

	"github.com/gorilla/mux"
	"gorm.io/gorm"
)

type CandidateHandler struct {
	DB *gorm.DB
}

// Apply to Job
func (h *CandidateHandler) ApplyToJob(w http.ResponseWriter, r *http.Request) {
	var application models.Application

	if err := json.NewDecoder(r.Body).Decode(&application); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	application.Status = "APPLIED"

	if err := h.DB.Create(&application).Error; err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(application)
}

// Get Applications
func (h *CandidateHandler) GetApplications(w http.ResponseWriter, r *http.Request) {
	candidateID := r.URL.Query().Get("candidate_id")

	var applications []models.Application
	h.DB.Where("candidate_id = ?", candidateID).Find(&applications)

	json.NewEncoder(w).Encode(applications)
}

// Withdraw Application
func (h *CandidateHandler) WithdrawApplication(w http.ResponseWriter, r *http.Request) {
	params := mux.Vars(r)
	id := params["id"]

	appID, _ := strconv.Atoi(id)

	var application models.Application

	if err := h.DB.First(&application, appID).Error; err != nil {
		http.Error(w, "Application not found", http.StatusNotFound)
		return
	}

	application.Status = "WITHDRAWN"
	h.DB.Save(&application)

	json.NewEncoder(w).Encode(application)
}
