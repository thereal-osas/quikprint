package handlers

import (
	"context"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/pquerna/otp/totp"
	"github.com/quikprint/backend/internal/models"
	"github.com/quikprint/backend/internal/repository"
	"github.com/quikprint/backend/internal/utils"
)

type TwoFactorHandler struct {
	userRepo *repository.UserRepository
}

func NewTwoFactorHandler(userRepo *repository.UserRepository) *TwoFactorHandler {
	return &TwoFactorHandler{userRepo: userRepo}
}

// GenerateSetup generates a new 2FA secret and QR code URL
func (h *TwoFactorHandler) GenerateSetup(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)
	ctx := context.Background()

	user, err := h.userRepo.GetByID(ctx, userID)
	if err != nil || user == nil {
		utils.ErrorResponse(c, 404, "User not found")
		return
	}

	if user.TwoFactorEnabled {
		utils.ErrorResponse(c, 400, "Two-factor authentication is already enabled")
		return
	}

	// Generate a new TOTP key
	key, err := totp.Generate(totp.GenerateOpts{
		Issuer:      "QuikPrint",
		AccountName: user.Email,
	})
	if err != nil {
		utils.ErrorResponse(c, 500, "Failed to generate 2FA secret")
		return
	}

	// Save the secret temporarily (not enabled yet)
	if err := h.userRepo.SetTwoFactorSecret(ctx, userID, key.Secret()); err != nil {
		utils.ErrorResponse(c, 500, "Failed to save 2FA secret")
		return
	}

	utils.SuccessResponse(c, 200, models.TwoFactorSetupResponse{
		Secret:    key.Secret(),
		QRCodeURL: key.URL(),
	})
}

// VerifyAndEnable verifies the TOTP code and enables 2FA
func (h *TwoFactorHandler) VerifyAndEnable(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)
	ctx := context.Background()

	var req models.TwoFactorVerifyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, err.Error())
		return
	}

	user, err := h.userRepo.GetByID(ctx, userID)
	if err != nil || user == nil {
		utils.ErrorResponse(c, 404, "User not found")
		return
	}

	if user.TwoFactorEnabled {
		utils.ErrorResponse(c, 400, "Two-factor authentication is already enabled")
		return
	}

	if user.TwoFactorSecret == "" {
		utils.ErrorResponse(c, 400, "Please generate a 2FA setup first")
		return
	}

	// Verify the TOTP code
	valid := totp.Validate(req.Code, user.TwoFactorSecret)
	if !valid {
		utils.ErrorResponse(c, 400, "Invalid verification code")
		return
	}

	// Enable 2FA
	if err := h.userRepo.EnableTwoFactor(ctx, userID); err != nil {
		utils.ErrorResponse(c, 500, "Failed to enable 2FA")
		return
	}

	utils.SuccessResponse(c, 200, gin.H{"message": "Two-factor authentication enabled successfully"})
}

// Disable disables 2FA for the user
func (h *TwoFactorHandler) Disable(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)
	ctx := context.Background()

	var req models.TwoFactorVerifyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, err.Error())
		return
	}

	user, err := h.userRepo.GetByID(ctx, userID)
	if err != nil || user == nil {
		utils.ErrorResponse(c, 404, "User not found")
		return
	}

	if !user.TwoFactorEnabled {
		utils.ErrorResponse(c, 400, "Two-factor authentication is not enabled")
		return
	}

	// Verify the TOTP code before disabling
	valid := totp.Validate(req.Code, user.TwoFactorSecret)
	if !valid {
		utils.ErrorResponse(c, 400, "Invalid verification code")
		return
	}

	if err := h.userRepo.DisableTwoFactor(ctx, userID); err != nil {
		utils.ErrorResponse(c, 500, "Failed to disable 2FA")
		return
	}

	utils.SuccessResponse(c, 200, gin.H{"message": "Two-factor authentication disabled successfully"})
}

// GetStatus returns the current 2FA status
func (h *TwoFactorHandler) GetStatus(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)
	ctx := context.Background()

	user, err := h.userRepo.GetByID(ctx, userID)
	if err != nil || user == nil {
		utils.ErrorResponse(c, 404, "User not found")
		return
	}

	utils.SuccessResponse(c, 200, gin.H{"enabled": user.TwoFactorEnabled})
}
