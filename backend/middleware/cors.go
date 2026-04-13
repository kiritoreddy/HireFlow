package middleware

import (
	"net/http"

	"github.com/gorilla/handlers"
)

// SetupCORS configures CORS middleware for frontend access
func SetupCORS() func(http.Handler) http.Handler {
	return handlers.CORS(
		handlers.AllowedOrigins([]string{"http://localhost:4200"}), // Angular frontend
		handlers.AllowedMethods([]string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"}),
		// Include Accept (Angular HttpClient) so multipart apply preflight succeeds.
		handlers.AllowedHeaders([]string{"Content-Type", "Authorization", "Accept"}),
	)
}
