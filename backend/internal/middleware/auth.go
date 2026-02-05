package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/quikprint/backend/internal/models"
	"github.com/quikprint/backend/internal/utils"
)

type AuthMiddleware struct {
	jwtManager *utils.JWTManager
}

func NewAuthMiddleware(jwtManager *utils.JWTManager) *AuthMiddleware {
	return &AuthMiddleware{jwtManager: jwtManager}
}

func (m *AuthMiddleware) RequireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			utils.ErrorResponse(c, 401, "Authorization header required")
			c.Abort()
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			utils.ErrorResponse(c, 401, "Invalid authorization header format")
			c.Abort()
			return
		}

		claims, err := m.jwtManager.ValidateAccessToken(parts[1])
		if err != nil {
			utils.ErrorResponse(c, 401, "Invalid or expired token")
			c.Abort()
			return
		}

		c.Set("userID", claims.UserID)
		c.Set("userEmail", claims.Email)
		c.Set("userRole", claims.Role)
		c.Next()
	}
}

func (m *AuthMiddleware) RequireAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			utils.ErrorResponse(c, 401, "Authorization header required")
			c.Abort()
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			utils.ErrorResponse(c, 401, "Invalid authorization header format")
			c.Abort()
			return
		}

		claims, err := m.jwtManager.ValidateAccessToken(parts[1])
		if err != nil {
			utils.ErrorResponse(c, 401, "Invalid or expired token")
			c.Abort()
			return
		}

		if claims.Role != models.RoleAdmin {
			utils.ErrorResponse(c, 403, "Admin access required")
			c.Abort()
			return
		}

		c.Set("userID", claims.UserID)
		c.Set("userEmail", claims.Email)
		c.Set("userRole", claims.Role)
		c.Next()
	}
}

func (m *AuthMiddleware) OptionalAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.Next()
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.Next()
			return
		}

		claims, err := m.jwtManager.ValidateAccessToken(parts[1])
		if err == nil {
			c.Set("userID", claims.UserID)
			c.Set("userEmail", claims.Email)
			c.Set("userRole", claims.Role)
		}
		c.Next()
	}
}

