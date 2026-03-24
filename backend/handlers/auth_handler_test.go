package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"backend/models"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

// setupTestDB creates an in-memory SQLite database for testing
// Each test gets a fresh database - no real DB affected
func setupTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("Failed to open test database: %v", err)
	}
	if err := db.AutoMigrate(&models.User{}, &models.PasswordResetToken{}); err != nil {
		t.Fatalf("Failed to migrate test database: %v", err)
	}
	return db
}

// makeRequest is a helper to create HTTP requests with JSON body
func makeRequest(t *testing.T, method, url string, body interface{}) *http.Request {
	jsonBody, err := json.Marshal(body)
	if err != nil {
		t.Fatalf("Failed to marshal request body: %v", err)
	}
	req, err := http.NewRequest(method, url, bytes.NewBuffer(jsonBody))
	if err != nil {
		t.Fatalf("Failed to create request: %v", err)
	}
	req.Header.Set("Content-Type", "application/json")
	return req
}

// ─── Register Tests ───────────────────────────────────────────────────────────

// TestRegister_Success verifies a valid user can register successfully
func TestRegister_Success(t *testing.T) {
	db := setupTestDB(t)
	handler := &AuthHandler{DB: db}

	body := map[string]string{
		"name":     "John Doe",
		"email":    "john@example.com",
		"password": "SecurePass123!",
		"role":     "hiring_manager",
	}

	req := makeRequest(t, http.MethodPost, "/auth/register", body)
	rr := httptest.NewRecorder()
	handler.Register(rr, req)

	if rr.Code != http.StatusCreated {
		t.Errorf("Expected status 201, got %d. Body: %s", rr.Code, rr.Body.String())
	}

	var response AuthResponse
	if err := json.NewDecoder(rr.Body).Decode(&response); err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}
	if response.User.Email != "john@example.com" {
		t.Errorf("Expected email john@example.com, got %s", response.User.Email)
	}
	if response.AccessToken == "" {
		t.Error("Expected access token in response, got empty string")
	}
}

// TestRegister_DuplicateEmail verifies duplicate email registration is rejected
func TestRegister_DuplicateEmail(t *testing.T) {
	db := setupTestDB(t)
	handler := &AuthHandler{DB: db}

	body := map[string]string{
		"name":     "John Doe",
		"email":    "john@example.com",
		"password": "SecurePass123!",
		"role":     "hiring_manager",
	}

	// Register first time
	req1 := makeRequest(t, http.MethodPost, "/auth/register", body)
	rr1 := httptest.NewRecorder()
	handler.Register(rr1, req1)

	// Register second time with same email
	req2 := makeRequest(t, http.MethodPost, "/auth/register", body)
	rr2 := httptest.NewRecorder()
	handler.Register(rr2, req2)

	if rr2.Code != http.StatusConflict {
		t.Errorf("Expected status 409, got %d", rr2.Code)
	}
}

// TestRegister_MissingFields verifies registration fails with missing required fields
func TestRegister_MissingFields(t *testing.T) {
	db := setupTestDB(t)
	handler := &AuthHandler{DB: db}

	body := map[string]string{
		"email": "john@example.com",
		// Missing name and password
	}

	req := makeRequest(t, http.MethodPost, "/auth/register", body)
	rr := httptest.NewRecorder()
	handler.Register(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("Expected status 400, got %d", rr.Code)
	}
}

// TestRegister_WeakPassword verifies weak passwords are rejected
func TestRegister_WeakPassword(t *testing.T) {
	db := setupTestDB(t)
	handler := &AuthHandler{DB: db}

	body := map[string]string{
		"name":     "John Doe",
		"email":    "john@example.com",
		"password": "weak", // Too simple
		"role":     "hiring_manager",
	}

	req := makeRequest(t, http.MethodPost, "/auth/register", body)
	rr := httptest.NewRecorder()
	handler.Register(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("Expected status 400, got %d", rr.Code)
	}
}

// TestRegister_InvalidEmail verifies invalid email format is rejected
func TestRegister_InvalidEmail(t *testing.T) {
	db := setupTestDB(t)
	handler := &AuthHandler{DB: db}

	body := map[string]string{
		"name":     "John Doe",
		"email":    "not-an-email",
		"password": "SecurePass123!",
		"role":     "hiring_manager",
	}

	req := makeRequest(t, http.MethodPost, "/auth/register", body)
	rr := httptest.NewRecorder()
	handler.Register(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("Expected status 400, got %d", rr.Code)
	}
}

// ─── Login Tests ──────────────────────────────────────────────────────────────

// TestLogin_Success verifies a registered user can login successfully
func TestLogin_Success(t *testing.T) {
	db := setupTestDB(t)
	handler := &AuthHandler{DB: db}

	// First register a user
	registerBody := map[string]string{
		"name":     "John Doe",
		"email":    "john@example.com",
		"password": "SecurePass123!",
		"role":     "hiring_manager",
	}
	req := makeRequest(t, http.MethodPost, "/auth/register", registerBody)
	rr := httptest.NewRecorder()
	handler.Register(rr, req)

	// Now login
	loginBody := map[string]string{
		"email":    "john@example.com",
		"password": "SecurePass123!",
	}
	loginReq := makeRequest(t, http.MethodPost, "/auth/login", loginBody)
	loginRR := httptest.NewRecorder()
	handler.Login(loginRR, loginReq)

	if loginRR.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d. Body: %s", loginRR.Code, loginRR.Body.String())
	}

	var response AuthResponse
	if err := json.NewDecoder(loginRR.Body).Decode(&response); err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}
	if response.AccessToken == "" {
		t.Error("Expected access token in response, got empty string")
	}
}

// TestLogin_WrongPassword verifies login fails with incorrect password
func TestLogin_WrongPassword(t *testing.T) {
	db := setupTestDB(t)
	handler := &AuthHandler{DB: db}

	// Register user
	registerBody := map[string]string{
		"name":     "John Doe",
		"email":    "john@example.com",
		"password": "SecurePass123!",
		"role":     "hiring_manager",
	}
	req := makeRequest(t, http.MethodPost, "/auth/register", registerBody)
	rr := httptest.NewRecorder()
	handler.Register(rr, req)

	// Login with wrong password
	loginBody := map[string]string{
		"email":    "john@example.com",
		"password": "WrongPass123!",
	}
	loginReq := makeRequest(t, http.MethodPost, "/auth/login", loginBody)
	loginRR := httptest.NewRecorder()
	handler.Login(loginRR, loginReq)

	if loginRR.Code != http.StatusUnauthorized {
		t.Errorf("Expected status 401, got %d", loginRR.Code)
	}
}

// TestLogin_UserNotFound verifies login fails for non-existent email
func TestLogin_UserNotFound(t *testing.T) {
	db := setupTestDB(t)
	handler := &AuthHandler{DB: db}

	loginBody := map[string]string{
		"email":    "nobody@example.com",
		"password": "SecurePass123!",
	}
	req := makeRequest(t, http.MethodPost, "/auth/login", loginBody)
	rr := httptest.NewRecorder()
	handler.Login(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Errorf("Expected status 401, got %d", rr.Code)
	}
}

// TestLogin_InactiveUser verifies deactivated users cannot login
func TestLogin_InactiveUser(t *testing.T) {
	db := setupTestDB(t)
	handler := &AuthHandler{DB: db}

	// Register user
	registerBody := map[string]string{
		"name":     "John Doe",
		"email":    "john@example.com",
		"password": "SecurePass123!",
		"role":     "hiring_manager",
	}
	req := makeRequest(t, http.MethodPost, "/auth/register", registerBody)
	rr := httptest.NewRecorder()
	handler.Register(rr, req)

	// Deactivate user directly in DB
	db.Model(&models.User{}).
		Where("email = ?", "john@example.com").
		Update("is_active", false)

	// Try to login
	loginBody := map[string]string{
		"email":    "john@example.com",
		"password": "SecurePass123!",
	}
	loginReq := makeRequest(t, http.MethodPost, "/auth/login", loginBody)
	loginRR := httptest.NewRecorder()
	handler.Login(loginRR, loginReq)

	if loginRR.Code != http.StatusForbidden {
		t.Errorf("Expected status 403, got %d", loginRR.Code)
	}
}

// TestLogin_MissingFields verifies login fails with missing credentials
func TestLogin_MissingFields(t *testing.T) {
	db := setupTestDB(t)
	handler := &AuthHandler{DB: db}

	loginBody := map[string]string{
		"email": "john@example.com",
		// Missing password
	}
	req := makeRequest(t, http.MethodPost, "/auth/login", loginBody)
	rr := httptest.NewRecorder()
	handler.Login(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("Expected status 400, got %d", rr.Code)
	}
}

// ─── ForgotPassword Tests ─────────────────────────────────────────────────────

// TestForgotPassword_ValidEmail verifies forgot password succeeds with valid email
func TestForgotPassword_ValidEmail(t *testing.T) {
	db := setupTestDB(t)
	handler := &AuthHandler{DB: db}

	// Register user first
	registerBody := map[string]string{
		"name":     "John Doe",
		"email":    "john@example.com",
		"password": "SecurePass123!",
		"role":     "hiring_manager",
	}
	req := makeRequest(t, http.MethodPost, "/auth/register", registerBody)
	rr := httptest.NewRecorder()
	handler.Register(rr, req)

	// Request password reset
	forgotBody := map[string]string{"email": "john@example.com"}
	forgotReq := makeRequest(t, http.MethodPost, "/auth/forgot-password", forgotBody)
	forgotRR := httptest.NewRecorder()
	handler.ForgotPassword(forgotRR, forgotReq)

	if forgotRR.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", forgotRR.Code)
	}

	var response ForgotPasswordResponse
	if err := json.NewDecoder(forgotRR.Body).Decode(&response); err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}
	if response.ResetToken == "" {
		t.Error("Expected reset token in response, got empty string")
	}
}

// TestForgotPassword_MissingEmail verifies forgot password fails with missing email
func TestForgotPassword_MissingEmail(t *testing.T) {
	db := setupTestDB(t)
	handler := &AuthHandler{DB: db}

	forgotBody := map[string]string{}
	req := makeRequest(t, http.MethodPost, "/auth/forgot-password", forgotBody)
	rr := httptest.NewRecorder()
	handler.ForgotPassword(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("Expected status 400, got %d", rr.Code)
	}
}

// ─── ResetPassword Tests ──────────────────────────────────────────────────────

// TestResetPassword_ValidToken verifies password reset succeeds with valid token
func TestResetPassword_ValidToken(t *testing.T) {
	db := setupTestDB(t)
	handler := &AuthHandler{DB: db}

	// Register user
	registerBody := map[string]string{
		"name":     "John Doe",
		"email":    "john@example.com",
		"password": "SecurePass123!",
		"role":     "hiring_manager",
	}
	req := makeRequest(t, http.MethodPost, "/auth/register", registerBody)
	rr := httptest.NewRecorder()
	handler.Register(rr, req)

	// Get reset token
	forgotBody := map[string]string{"email": "john@example.com"}
	forgotReq := makeRequest(t, http.MethodPost, "/auth/forgot-password", forgotBody)
	forgotRR := httptest.NewRecorder()
	handler.ForgotPassword(forgotRR, forgotReq)

	var forgotResponse ForgotPasswordResponse
	json.NewDecoder(forgotRR.Body).Decode(&forgotResponse)

	// Reset password with valid token
	resetBody := map[string]string{
		"token":    forgotResponse.ResetToken,
		"password": "NewSecurePass123!",
	}
	resetReq := makeRequest(t, http.MethodPost, "/auth/reset-password", resetBody)
	resetRR := httptest.NewRecorder()
	handler.ResetPassword(resetRR, resetReq)

	if resetRR.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d. Body: %s", resetRR.Code, resetRR.Body.String())
	}
}

// TestResetPassword_InvalidToken verifies reset fails with invalid token
func TestResetPassword_InvalidToken(t *testing.T) {
	db := setupTestDB(t)
	handler := &AuthHandler{DB: db}

	resetBody := map[string]string{
		"token":    "invalid-token-that-doesnt-exist",
		"password": "NewSecurePass123!",
	}
	req := makeRequest(t, http.MethodPost, "/auth/reset-password", resetBody)
	rr := httptest.NewRecorder()
	handler.ResetPassword(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("Expected status 400, got %d", rr.Code)
	}
}

// TestResetPassword_WeakPassword verifies reset fails with weak new password
func TestResetPassword_WeakPassword(t *testing.T) {
	db := setupTestDB(t)
	handler := &AuthHandler{DB: db}

	resetBody := map[string]string{
		"token":    "some-token",
		"password": "weak",
	}
	req := makeRequest(t, http.MethodPost, "/auth/reset-password", resetBody)
	rr := httptest.NewRecorder()
	handler.ResetPassword(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("Expected status 400, got %d", rr.Code)
	}
}
