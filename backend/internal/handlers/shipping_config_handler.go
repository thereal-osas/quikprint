package handlers

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/quikprint/backend/internal/models"
	"github.com/quikprint/backend/internal/repository"
	"github.com/quikprint/backend/internal/utils"
)

type ShippingConfigHandler struct {
	repo *repository.ShippingConfigRepository
}

func NewShippingConfigHandler(repo *repository.ShippingConfigRepository) *ShippingConfigHandler {
	return &ShippingConfigHandler{repo: repo}
}

// GetShippingConfig returns the current shipping configuration
func (h *ShippingConfigHandler) GetShippingConfig(c *gin.Context) {
	ctx := context.Background()
	config, err := h.repo.Get(ctx)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch shipping configuration")
		return
	}
	utils.SuccessResponse(c, http.StatusOK, config)
}

// UpdateShippingConfig updates the shipping configuration (admin only)
func (h *ShippingConfigHandler) UpdateShippingConfig(c *gin.Context) {
	var req models.UpdateShippingConfigRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, err.Error())
		return
	}

	ctx := context.Background()

	// Get current config to get the ID
	config, err := h.repo.Get(ctx)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch shipping configuration")
		return
	}

	// Update the config
	err = h.repo.Update(ctx, config.ID, req.ShippingFee, req.FreeShippingThreshold)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to update shipping configuration")
		return
	}

	// Fetch and return updated config
	updatedConfig, err := h.repo.Get(ctx)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch updated shipping configuration")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, updatedConfig)
}

// GetShippingConfigPublic returns the current shipping configuration for public use
func (h *ShippingConfigHandler) GetShippingConfigPublic(c *gin.Context) {
	ctx := context.Background()
	config, err := h.repo.Get(ctx)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Failed to fetch shipping configuration")
		return
	}
	utils.SuccessResponse(c, http.StatusOK, config)
}
