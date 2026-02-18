package middleware

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"

	"backend/utils"
)

type contextKey string

const claimsKey contextKey = "jwt_claims"

// RequireAuth validates the JWT from Authorization: Bearer <token> and calls next with claims in context.
// Returns 401 if missing or invalid token.
func RequireAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		auth := r.Header.Get("Authorization")
		if auth == "" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]string{"error": "Authorization header required"})
			return
		}
		parts := strings.SplitN(auth, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]string{"error": "Invalid Authorization header"})
			return
		}
		claims, err := utils.ValidateJWT(parts[1])
		if err != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]string{"error": "Invalid or expired token"})
			return
		}
		ctx := context.WithValue(r.Context(), claimsKey, claims)
		next.ServeHTTP(w, r.WithContext(ctx))
	}
}

// RequireAdmin ensures the authenticated user has role "admin". Use after RequireAuth.
// Returns 403 if role is not admin.
func RequireAdmin(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		claims, ok := r.Context().Value(claimsKey).(*utils.JWTClaims)
		if !ok || claims == nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusForbidden)
			json.NewEncoder(w).Encode(map[string]string{"error": "Forbidden"})
			return
		}
		if claims.Role != "admin" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusForbidden)
			json.NewEncoder(w).Encode(map[string]string{"error": "Admin role required"})
			return
		}
		next.ServeHTTP(w, r)
	}
}
