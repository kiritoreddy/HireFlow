package handlers

import (
	"encoding/json"
	"net/http"

	"backend/models"
	"backend/utils"

	"gorm.io/gorm"
)

// AuthHandler encapsulates database dependency for authentication operations
type AuthHandler struct {
	DB *gorm.DB
}

// RegisterRequest represents the registration request body
type RegisterRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
	Role     string `json:"role"` // admin, hiring_manager, interviewer, candidate
}

// LoginRequest represents the login request body
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// AuthResponse represents the authentication response
type AuthResponse struct {
	User struct {
		ID       uint   `json:"id"`
		Name     string `json:"name"`
		Email    string `json:"email"`
		Role     string `json:"role"`
		IsActive bool   `json:"is_active"`
	} `json:"user"`
	AccessToken string `json:"access_token"`
	ExpiresIn   int    `json:"expires_in"` // Seconds until expiration
}

// Register handles POST /auth/register - User registration
func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest

	// Decode JSON request body
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid request body"})
		return
	}

	// Validate required fields
	if req.Name == "" || req.Email == "" || req.Password == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Name, email, and password are required"})
		return
	}

	// Validate email format
	if !models.ValidateEmail(req.Email) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid email format"})
		return
	}

	// Validate password strength
	if !models.ValidatePassword(req.Password) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Password must be at least 8 characters with uppercase, lowercase, number, and special character"})
		return
	}

	// Check if user already exists
	var existingUser models.User
	if err := h.DB.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusConflict)
		json.NewEncoder(w).Encode(map[string]string{"error": "Email already registered"})
		return
	}

	// Set default role if not provided
	if req.Role == "" {
		req.Role = "candidate"
	}

	// Validate role
	validRoles := map[string]bool{"admin": true, "hiring_manager": true, "interviewer": true, "candidate": true}
	if !validRoles[req.Role] {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid role"})
		return
	}

	// Create new user
	user := models.User{
		Name:     req.Name,
		Email:    req.Email,
		Role:     req.Role,
		IsActive: true,
	}

	// Hash password
	if err := user.HashPassword(req.Password); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to process password"})
		return
	}

	// Save user to database
	if err := h.DB.Create(&user).Error; err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to create user"})
		return
	}

	// Generate JWT token
	token, err := utils.GenerateJWT(user.ID, user.Email, user.Role)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to generate token"})
		return
	}

	// Prepare response
	var response AuthResponse
	response.User.ID = user.ID
	response.User.Name = user.Name
	response.User.Email = user.Email
	response.User.Role = user.Role
	response.User.IsActive = user.IsActive
	response.AccessToken = token
	response.ExpiresIn = 900 // 15 minutes in seconds

	// Return success response
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(response)
}

// Login handles POST /auth/login - User authentication
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest

	// Decode JSON request body
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid request body"})
		return
	}

	// Validate required fields
	if req.Email == "" || req.Password == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "Email and password are required"})
		return
	}

	// Find user by email
	var user models.User
	if err := h.DB.Where("email = ?", req.Email).First(&user).Error; err != nil {
		// Return generic error to prevent email enumeration
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid credentials"})
		return
	}

	// Check if user is active
	if !user.IsActive {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).Encode(map[string]string{"error": "Account deactivated"})
		return
	}

	// Verify password
	if err := user.CheckPassword(req.Password); err != nil {
		// Return generic error to prevent email enumeration
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid credentials"})
		return
	}

	// Generate JWT token
	token, err := utils.GenerateJWT(user.ID, user.Email, user.Role)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to generate token"})
		return
	}

	// Prepare response
	var response AuthResponse
	response.User.ID = user.ID
	response.User.Name = user.Name
	response.User.Email = user.Email
	response.User.Role = user.Role
	response.User.IsActive = user.IsActive
	response.AccessToken = token
	response.ExpiresIn = 900 // 15 minutes in seconds

	// Return success response
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}
