package handlers

import (
    "context"
    "encoding/json"
    "net/http"
    "os"
    "strings"

    "backend/models"
    "backend/utils"

    "github.com/coreos/go-oidc/v3/oidc"
    "gorm.io/gorm"
)

// GoogleAuthHandler handles Google OAuth authentication
type GoogleAuthHandler struct {
    DB *gorm.DB
}

// GoogleAuthRequest represents the POST /auth/google request body
// Frontend sends the Google ID token received from Google Identity Services (GIS)
type GoogleAuthRequest struct {
    IDToken string `json:"id_token"`
}

// getGoogleClientID returns the Google OAuth client ID from environment
// Falls back to a placeholder for development (must be set in production)
func getGoogleClientID() string {
    clientID := os.Getenv("GOOGLE_CLIENT_ID")
    if clientID == "" {
        // Development fallback - set GOOGLE_CLIENT_ID in production environment
        return "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"
    }
    return clientID
}

// verifyGoogleToken verifies a Google ID token using go-oidc/v3
// Validates: audience (aud), issuer (iss), expiry (exp), and signature
// Returns the verified token payload or an error
func verifyGoogleToken(ctx context.Context, rawIDToken string) (*oidc.IDToken, error) {
    // Create Google OIDC provider
    // Google's OIDC discovery endpoint is: https://accounts.google.com
    provider, err := oidc.NewProvider(ctx, "https://accounts.google.com")
    if err != nil {
        return nil, err
    }

    // Configure verifier with our client ID
    // This ensures the token was issued FOR our application
    verifier := provider.Verifier(&oidc.Config{
        ClientID: getGoogleClientID(),
    })

    // Verify the token
    // Checks: signature, expiry, audience, issuer
    return verifier.Verify(ctx, rawIDToken)
}

// GoogleClaims represents the claims extracted from a verified Google ID token
type GoogleClaims struct {
    Email         string `json:"email"`
    EmailVerified bool   `json:"email_verified"`
    Name          string `json:"name"`
    Sub           string `json:"sub"` // Google's unique user identifier
}

// GoogleAuth handles POST /auth/google
// Flow:
// 1. Receive Google ID token from frontend (GIS)
// 2. Verify token server-side (audience, issuer, expiry, signature)
// 3. Check if deactivated user - deny login
// 4. Find existing user by email OR create new candidate
// 5. Link google_sub to existing account (auto-merge)
// 6. Return same JWT shape as email/password login
func (h *GoogleAuthHandler) GoogleAuth(w http.ResponseWriter, r *http.Request) {
    var req GoogleAuthRequest

    // Decode request body
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        w.Header().Set("Content-Type", "application/json")
        w.WriteHeader(http.StatusBadRequest)
        json.NewEncoder(w).Encode(map[string]string{"error": "Invalid request body"})
        return
    }

    // Validate token is present
    req.IDToken = strings.TrimSpace(req.IDToken)
    if req.IDToken == "" {
        w.Header().Set("Content-Type", "application/json")
        w.WriteHeader(http.StatusBadRequest)
        json.NewEncoder(w).Encode(map[string]string{"error": "id_token is required"})
        return
    }

    // Verify Google ID token server-side
    // Validates audience, issuer, expiry, and cryptographic signature
    idToken, err := verifyGoogleToken(r.Context(), req.IDToken)
    if err != nil {
        w.Header().Set("Content-Type", "application/json")
        w.WriteHeader(http.StatusUnauthorized)
        json.NewEncoder(w).Encode(map[string]string{"error": "Invalid or expired Google token"})
        return
    }

    // Extract claims from verified token
    var claims GoogleClaims
    if err := idToken.Claims(&claims); err != nil {
        w.Header().Set("Content-Type", "application/json")
        w.WriteHeader(http.StatusInternalServerError)
        json.NewEncoder(w).Encode(map[string]string{"error": "Failed to extract token claims"})
        return
    }

    // Require verified email from Google
    if !claims.EmailVerified {
        w.Header().Set("Content-Type", "application/json")
        w.WriteHeader(http.StatusUnauthorized)
        json.NewEncoder(w).Encode(map[string]string{"error": "Google account email not verified"})
        return
    }

    // Find or create user by email
    var user models.User
    result := h.DB.Where("email = ?", claims.Email).First(&user)

    if result.Error == gorm.ErrRecordNotFound {
        // New user - create candidate account with Google provider
        user = models.User{
            Name:      claims.Name,
            Email:     claims.Email,
            Role:      "candidate", // Google sign-up always creates candidate (Sprint 3 security rule)
            IsActive:  true,
            Provider:  "google",
            GoogleSub: claims.Sub,
        }
        if err := h.DB.Create(&user).Error; err != nil {
            w.Header().Set("Content-Type", "application/json")
            w.WriteHeader(http.StatusInternalServerError)
            json.NewEncoder(w).Encode(map[string]string{"error": "Failed to create user"})
            return
        }
    } else if result.Error != nil {
        // Database error
        w.Header().Set("Content-Type", "application/json")
        w.WriteHeader(http.StatusInternalServerError)
        json.NewEncoder(w).Encode(map[string]string{"error": "Database error"})
        return
    } else {
        // Existing user found

        // Check if user is active - deactivated users cannot sign in via Google
        if !user.IsActive {
            w.Header().Set("Content-Type", "application/json")
            w.WriteHeader(http.StatusForbidden)
            json.NewEncoder(w).Encode(map[string]string{"error": "Account deactivated"})
            return
        }

        // Auto-merge: link Google sub to existing email account if not already linked
        if user.GoogleSub == "" {
            user.GoogleSub = claims.Sub
            user.Provider = "google"
            if err := h.DB.Save(&user).Error; err != nil {
                w.Header().Set("Content-Type", "application/json")
                w.WriteHeader(http.StatusInternalServerError)
                json.NewEncoder(w).Encode(map[string]string{"error": "Failed to link Google account"})
                return
            }
        }
    }

    // Generate JWT token - same shape as email/password login
    // No frontend changes needed (consistent JWT contract)
    token, err := utils.GenerateJWT(user.ID, user.Email, user.Role)
    if err != nil {
        w.Header().Set("Content-Type", "application/json")
        w.WriteHeader(http.StatusInternalServerError)
        json.NewEncoder(w).Encode(map[string]string{"error": "Failed to generate token"})
        return
    }

    // Return same AuthResponse shape as email/password login
    var response AuthResponse
    response.User.ID = user.ID
    response.User.Name = user.Name
    response.User.Email = user.Email
    response.User.Role = user.Role
    response.User.IsActive = user.IsActive
    response.AccessToken = token
    response.ExpiresIn = 900 // 15 minutes

    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(response)
}