package handlers

import (
	"net/http"
)

// HealthHandler handles health check endpoint
func HealthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"ok","db":"sqlite","service":"hireflow-backend"}`))
}
