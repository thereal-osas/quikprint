package handlers

import (
	"context"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/quikprint/backend/internal/models"
	"github.com/quikprint/backend/internal/repository"
	"github.com/quikprint/backend/internal/utils"
)

type AuthHandler struct {
	userRepo   *repository.UserRepository
	jwtManager *utils.JWTManager
}

func NewAuthHandler(userRepo *repository.UserRepository, jwtManager *utils.JWTManager) *AuthHandler {
	return &AuthHandler{userRepo: userRepo, jwtManager: jwtManager}
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req models.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, err.Error())
		return
	}

	ctx := context.Background()

	// Check if user exists
	existing, _ := h.userRepo.GetByEmail(ctx, req.Email)
	if existing != nil {
		utils.ErrorResponse(c, 409, "Email already registered")
		return
	}

	// Hash password
	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		utils.ErrorResponse(c, 500, "Failed to process password")
		return
	}

	user := &models.User{
		Email:        req.Email,
		PasswordHash: hashedPassword,
		FirstName:    req.FirstName,
		LastName:     req.LastName,
		Phone:        req.Phone,
		Role:         models.RoleCustomer,
	}

	if err := h.userRepo.Create(ctx, user); err != nil {
		utils.ErrorResponse(c, 500, "Failed to create user")
		return
	}

	// Generate tokens
	accessToken, err := h.jwtManager.GenerateAccessToken(user)
	if err != nil {
		utils.ErrorResponse(c, 500, "Failed to generate token")
		return
	}

	refreshToken, expiresAt, err := h.jwtManager.GenerateRefreshToken(user)
	if err != nil {
		utils.ErrorResponse(c, 500, "Failed to generate refresh token")
		return
	}

	// Save refresh token
	h.userRepo.SaveRefreshToken(ctx, &models.RefreshToken{
		UserID:    user.ID,
		Token:     refreshToken,
		ExpiresAt: expiresAt,
	})

	utils.SuccessResponse(c, 201, models.AuthResponse{
		User: models.UserProfile{
			ID:        user.ID,
			Email:     user.Email,
			FirstName: user.FirstName,
			LastName:  user.LastName,
			Phone:     user.Phone,
			Role:      user.Role,
			CreatedAt: user.CreatedAt,
		},
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	})
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, err.Error())
		return
	}

	ctx := context.Background()

	user, err := h.userRepo.GetByEmail(ctx, req.Email)
	if err != nil || user == nil {
		utils.ErrorResponse(c, 401, "Invalid email or password")
		return
	}

	if !utils.CheckPassword(req.Password, user.PasswordHash) {
		utils.ErrorResponse(c, 401, "Invalid email or password")
		return
	}

	accessToken, err := h.jwtManager.GenerateAccessToken(user)
	if err != nil {
		utils.ErrorResponse(c, 500, "Failed to generate token")
		return
	}

	refreshToken, expiresAt, err := h.jwtManager.GenerateRefreshToken(user)
	if err != nil {
		utils.ErrorResponse(c, 500, "Failed to generate refresh token")
		return
	}

	h.userRepo.SaveRefreshToken(ctx, &models.RefreshToken{
		UserID:    user.ID,
		Token:     refreshToken,
		ExpiresAt: expiresAt,
	})

	utils.SuccessResponse(c, 200, models.AuthResponse{
		User: models.UserProfile{
			ID:        user.ID,
			Email:     user.Email,
			FirstName: user.FirstName,
			LastName:  user.LastName,
			Phone:     user.Phone,
			Role:      user.Role,
			CreatedAt: user.CreatedAt,
		},
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	})
}

func (h *AuthHandler) RefreshToken(c *gin.Context) {
	var req models.RefreshTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, err.Error())
		return
	}

	ctx := context.Background()

	// Validate refresh token
	userID, err := h.jwtManager.ValidateRefreshToken(req.RefreshToken)
	if err != nil {
		utils.ErrorResponse(c, 401, "Invalid refresh token")
		return
	}

	// Check if token exists in DB
	storedToken, _ := h.userRepo.GetRefreshToken(ctx, req.RefreshToken)
	if storedToken == nil || storedToken.ExpiresAt.Before(time.Now()) {
		utils.ErrorResponse(c, 401, "Refresh token expired or invalid")
		return
	}

	user, err := h.userRepo.GetByID(ctx, userID)
	if err != nil || user == nil {
		utils.ErrorResponse(c, 401, "User not found")
		return
	}

	// Delete old refresh token
	h.userRepo.DeleteRefreshToken(ctx, req.RefreshToken)

	// Generate new tokens
	accessToken, _ := h.jwtManager.GenerateAccessToken(user)
	refreshToken, expiresAt, _ := h.jwtManager.GenerateRefreshToken(user)

	h.userRepo.SaveRefreshToken(ctx, &models.RefreshToken{
		UserID:    user.ID,
		Token:     refreshToken,
		ExpiresAt: expiresAt,
	})

	utils.SuccessResponse(c, 200, gin.H{
		"accessToken":  accessToken,
		"refreshToken": refreshToken,
	})
}

func (h *AuthHandler) GetProfile(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)
	ctx := context.Background()

	user, err := h.userRepo.GetByID(ctx, userID)
	if err != nil || user == nil {
		utils.ErrorResponse(c, 404, "User not found")
		return
	}

	utils.SuccessResponse(c, 200, models.UserProfile{
		ID:        user.ID,
		Email:     user.Email,
		FirstName: user.FirstName,
		LastName:  user.LastName,
		Phone:     user.Phone,
		Role:      user.Role,
		CreatedAt: user.CreatedAt,
	})
}

