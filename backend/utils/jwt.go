package utils

import (
	"errors"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// JWTClaims represents the claims stored in JWT token
type JWTClaims struct {
	UserID uint   `json:"user_id"`
	Email  string `json:"email"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

// GetJWTSecret returns the JWT secret key from environment variable
// Falls back to default key for development (change in production!)
func GetJWTSecret() string {
	secret := os.Getenv("JWT_SECRET_KEY")
	if secret == "" {
		// Development fallback - DO NOT use in production
		return "your-super-secret-key-change-in-production-min-32-characters"
	}
	return secret
}

// GenerateJWT creates a new JWT token for authenticated user
func GenerateJWT(userID uint, email string, role string) (string, error) {
	// Token expires in 15 minutes
	expirationTime := time.Now().Add(15 * time.Minute)

	// Create claims with user information
	claims := &JWTClaims{
		UserID: userID,
		Email:  email,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	// Create token with HS256 signing method
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Sign token with secret key
	tokenString, err := token.SignedString([]byte(GetJWTSecret()))
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

// ValidateJWT verifies JWT token and returns claims if valid
func ValidateJWT(tokenString string) (*JWTClaims, error) {
	// Parse token
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		// Verify signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("invalid signing method")
		}
		return []byte(GetJWTSecret()), nil
	})

	if err != nil {
		return nil, err
	}

	// Extract claims
	if claims, ok := token.Claims.(*JWTClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("invalid token")
}
