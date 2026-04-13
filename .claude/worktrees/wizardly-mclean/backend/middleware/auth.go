package middleware

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"strings"

	"backend/utils"
)

type contextKey string

const claimsKey contextKey = "jwt_claims"

// JWTClaimsFromRequest returns JWT claims when RequireAuth has run; otherwise false.
func JWTClaimsFromRequest(r *http.Request) (*utils.JWTClaims, bool) {
	claims, ok := r.Context().Value(claimsKey).(*utils.JWTClaims)
	return claims, ok && claims != nil
}

// RequireAuth validates the JWT from Authorization: Bearer <token> and calls next with claims in context.
// Returns 401 if missing or invalid token.
func RequireAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		auth := r.Header.Get("Authorization")
		if auth == "" {
			log.Printf("[AUTH DEBUG] %s %s -> 401: Authorization header missing", r.Method, r.URL.Path)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]string{"error": "Authorization header required"})
			return
		}
		parts := strings.SplitN(auth, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			log.Printf("[AUTH DEBUG] %s %s -> 401: Invalid Authorization format (expected Bearer)", r.Method, r.URL.Path)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]string{"error": "Invalid Authorization header"})
			return
		}
		claims, err := utils.ValidateJWT(parts[1])
		if err != nil {
			log.Printf("[AUTH DEBUG] %s %s -> 401: JWT validation failed: %v", r.Method, r.URL.Path, err)
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

// RequireRole ensures the authenticated user has one of the specified roles.
// Use after RequireAuth.
// Returns 403 if user role is not in the allowed roles list.
func RequireRole(roles ...string) func(http.HandlerFunc) http.HandlerFunc {
	return func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			claims, ok := r.Context().Value(claimsKey).(*utils.JWTClaims)
			if !ok || claims == nil {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusForbidden)
				json.NewEncoder(w).Encode(map[string]string{"error": "Forbidden"})
				return
			}
			// Check if user's role matches any of the allowed roles
			for _, role := range roles {
				if claims.Role == role {
					next.ServeHTTP(w, r)
					return
				}
			}
			// Role not in allowed list
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusForbidden)
			json.NewEncoder(w).Encode(map[string]string{"error": "Insufficient permissions"})
		}
	}
}
