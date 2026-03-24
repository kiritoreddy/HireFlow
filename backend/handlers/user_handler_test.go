package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"backend/models"
	"backend/utils"

	"github.com/gorilla/mux"
)

// injectAdminClaims injects admin JWT claims into request context
// Uses string key directly to avoid cross-package contextKey dependency
func injectAdminClaims(r *http.Request) *http.Request {
	claims := &utils.JWTClaims{
		UserID: 1,
		Email:  "admin@test.com",
		Role:   "admin",
	}
	// Use the same string key defined in middleware/auth.go
	ctx := context.WithValue(r.Context(), "jwt_claims", claims)
	return r.WithContext(ctx)
}

// ─── ListUsers Tests ──────────────────────────────────────────────────────────

// TestListUsers_Success verifies admin can list all users
func TestListUsers_Success(t *testing.T) {
	db := setupTestDB(t)
	handler := &UserHandler{DB: db}

	// Create a test user
	user := models.User{
		Name:     "John Doe",
		Email:    "john@example.com",
		Role:     "hiring_manager",
		IsActive: true,
	}
	user.HashPassword("SecurePass123!")
	db.Create(&user)

	req, _ := http.NewRequest(http.MethodGet, "/users", nil)
	req = injectAdminClaims(req)
	rr := httptest.NewRecorder()
	handler.ListUsers(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d. Body: %s", rr.Code, rr.Body.String())
	}

	var users []UserListResponse
	if err := json.NewDecoder(rr.Body).Decode(&users); err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}
	if len(users) != 1 {
		t.Errorf("Expected 1 user, got %d", len(users))
	}
	if users[0].Email != "john@example.com" {
		t.Errorf("Expected email john@example.com, got %s", users[0].Email)
	}
}

// TestListUsers_EmptyList verifies empty array returned when no users exist
func TestListUsers_EmptyList(t *testing.T) {
	db := setupTestDB(t)
	handler := &UserHandler{DB: db}

	req, _ := http.NewRequest(http.MethodGet, "/users", nil)
	req = injectAdminClaims(req)
	rr := httptest.NewRecorder()
	handler.ListUsers(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", rr.Code)
	}

	var users []UserListResponse
	json.NewDecoder(rr.Body).Decode(&users)
	if len(users) != 0 {
		t.Errorf("Expected empty list, got %d users", len(users))
	}
}

// ─── CreateUser Tests ─────────────────────────────────────────────────────────

// TestCreateUser_Success verifies admin can create a new user
func TestCreateUser_Success(t *testing.T) {
	db := setupTestDB(t)
	handler := &UserHandler{DB: db}

	body := map[string]string{
		"name":     "Jane Smith",
		"email":    "jane@example.com",
		"password": "SecurePass123!",
		"role":     "interviewer",
	}

	req := makeRequest(t, http.MethodPost, "/users", body)
	req = injectAdminClaims(req)
	rr := httptest.NewRecorder()
	handler.CreateUser(rr, req)

	if rr.Code != http.StatusCreated {
		t.Errorf("Expected status 201, got %d. Body: %s", rr.Code, rr.Body.String())
	}

	var response UserListResponse
	if err := json.NewDecoder(rr.Body).Decode(&response); err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}
	if response.Email != "jane@example.com" {
		t.Errorf("Expected email jane@example.com, got %s", response.Email)
	}
	if response.Role != "interviewer" {
		t.Errorf("Expected role interviewer, got %s", response.Role)
	}
}

// TestCreateUser_DuplicateEmail verifies duplicate email is rejected
func TestCreateUser_DuplicateEmail(t *testing.T) {
	db := setupTestDB(t)
	handler := &UserHandler{DB: db}

	body := map[string]string{
		"name":     "Jane Smith",
		"email":    "jane@example.com",
		"password": "SecurePass123!",
		"role":     "interviewer",
	}

	// Create first time
	req1 := makeRequest(t, http.MethodPost, "/users", body)
	req1 = injectAdminClaims(req1)
	rr1 := httptest.NewRecorder()
	handler.CreateUser(rr1, req1)

	// Create second time with same email
	req2 := makeRequest(t, http.MethodPost, "/users", body)
	req2 = injectAdminClaims(req2)
	rr2 := httptest.NewRecorder()
	handler.CreateUser(rr2, req2)

	if rr2.Code != http.StatusConflict {
		t.Errorf("Expected status 409, got %d", rr2.Code)
	}
}

// TestCreateUser_MissingFields verifies missing required fields are rejected
func TestCreateUser_MissingFields(t *testing.T) {
	db := setupTestDB(t)
	handler := &UserHandler{DB: db}

	body := map[string]string{
		"email": "jane@example.com",
		// Missing name and password
	}

	req := makeRequest(t, http.MethodPost, "/users", body)
	req = injectAdminClaims(req)
	rr := httptest.NewRecorder()
	handler.CreateUser(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("Expected status 400, got %d", rr.Code)
	}
}

// TestCreateUser_InvalidRole verifies invalid role is rejected
func TestCreateUser_InvalidRole(t *testing.T) {
	db := setupTestDB(t)
	handler := &UserHandler{DB: db}

	body := map[string]string{
		"name":     "Jane Smith",
		"email":    "jane@example.com",
		"password": "SecurePass123!",
		"role":     "superuser", // Invalid role
	}

	req := makeRequest(t, http.MethodPost, "/users", body)
	req = injectAdminClaims(req)
	rr := httptest.NewRecorder()
	handler.CreateUser(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("Expected status 400, got %d", rr.Code)
	}
}

// TestCreateUser_DefaultRole verifies default role is set to candidate when not provided
func TestCreateUser_DefaultRole(t *testing.T) {
	db := setupTestDB(t)
	handler := &UserHandler{DB: db}

	body := map[string]string{
		"name":     "Jane Smith",
		"email":    "jane@example.com",
		"password": "SecurePass123!",
		// No role provided
	}

	req := makeRequest(t, http.MethodPost, "/users", body)
	req = injectAdminClaims(req)
	rr := httptest.NewRecorder()
	handler.CreateUser(rr, req)

	if rr.Code != http.StatusCreated {
		t.Errorf("Expected status 201, got %d", rr.Code)
	}

	var response UserListResponse
	json.NewDecoder(rr.Body).Decode(&response)
	if response.Role != "candidate" {
		t.Errorf("Expected default role candidate, got %s", response.Role)
	}
}

// ─── SetUserActive Tests ──────────────────────────────────────────────────────

// TestSetUserActive_Deactivate verifies admin can deactivate a user
func TestSetUserActive_Deactivate(t *testing.T) {
	db := setupTestDB(t)
	handler := &UserHandler{DB: db}

	// Create user to deactivate
	user := models.User{
		Name:     "John Doe",
		Email:    "john@example.com",
		Role:     "hiring_manager",
		IsActive: true,
	}
	user.HashPassword("SecurePass123!")
	db.Create(&user)

	isActive := false
	body := map[string]interface{}{"is_active": isActive}
	bodyBytes, _ := json.Marshal(body)

	req, _ := http.NewRequest(http.MethodPatch, "/users/1", bytes.NewBuffer(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	req = injectAdminClaims(req)

	// Set URL vars for mux
	req = mux.SetURLVars(req, map[string]string{"id": "1"})
	rr := httptest.NewRecorder()
	handler.SetUserActive(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d. Body: %s", rr.Code, rr.Body.String())
	}

	var response UserListResponse
	json.NewDecoder(rr.Body).Decode(&response)
	if response.IsActive {
		t.Error("Expected user to be deactivated (is_active = false)")
	}
}

// TestSetUserActive_Reactivate verifies admin can reactivate a deactivated user
func TestSetUserActive_Reactivate(t *testing.T) {
	db := setupTestDB(t)
	handler := &UserHandler{DB: db}

	// Create inactive user
	user := models.User{
		Name:     "John Doe",
		Email:    "john@example.com",
		Role:     "hiring_manager",
		IsActive: false,
	}
	user.HashPassword("SecurePass123!")
	db.Create(&user)

	isActive := true
	body := map[string]interface{}{"is_active": isActive}
	bodyBytes, _ := json.Marshal(body)

	req, _ := http.NewRequest(http.MethodPatch, "/users/1", bytes.NewBuffer(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	req = injectAdminClaims(req)
	req = mux.SetURLVars(req, map[string]string{"id": "1"})
	rr := httptest.NewRecorder()
	handler.SetUserActive(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", rr.Code)
	}

	var response UserListResponse
	json.NewDecoder(rr.Body).Decode(&response)
	if !response.IsActive {
		t.Error("Expected user to be reactivated (is_active = true)")
	}
}

// TestSetUserActive_UserNotFound verifies 404 for non-existent user
func TestSetUserActive_UserNotFound(t *testing.T) {
	db := setupTestDB(t)
	handler := &UserHandler{DB: db}

	isActive := false
	body := map[string]interface{}{"is_active": isActive}
	bodyBytes, _ := json.Marshal(body)

	req, _ := http.NewRequest(http.MethodPatch, "/users/999", bytes.NewBuffer(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	req = injectAdminClaims(req)
	req = mux.SetURLVars(req, map[string]string{"id": "999"})
	rr := httptest.NewRecorder()
	handler.SetUserActive(rr, req)

	if rr.Code != http.StatusNotFound {
		t.Errorf("Expected status 404, got %d", rr.Code)
	}
}

// TestSetUserActive_MissingField verifies missing is_active field is rejected
func TestSetUserActive_MissingField(t *testing.T) {
	db := setupTestDB(t)
	handler := &UserHandler{DB: db}

	body := map[string]interface{}{} // Missing is_active
	bodyBytes, _ := json.Marshal(body)

	req, _ := http.NewRequest(http.MethodPatch, "/users/1", bytes.NewBuffer(bodyBytes))
	req.Header.Set("Content-Type", "application/json")
	req = injectAdminClaims(req)
	req = mux.SetURLVars(req, map[string]string{"id": "1"})
	rr := httptest.NewRecorder()
	handler.SetUserActive(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("Expected status 400, got %d", rr.Code)
	}
}
