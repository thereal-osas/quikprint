package handlers

import (
	"context"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/quikprint/backend/internal/models"
	"github.com/quikprint/backend/internal/repository"
	"github.com/quikprint/backend/internal/services"
	"github.com/quikprint/backend/internal/utils"
)

type PricingHandler struct {
	pricingService *services.PricingService
	pricingRepo    *repository.PricingRepository
}

func NewPricingHandler(pricingService *services.PricingService, pricingRepo *repository.PricingRepository) *PricingHandler {
	return &PricingHandler{pricingService: pricingService, pricingRepo: pricingRepo}
}

func (h *PricingHandler) CalculatePrice(c *gin.Context) {
	var req models.CalculatePriceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, err.Error())
		return
	}

	ctx := context.Background()
	breakdown, err := h.pricingService.CalculatePrice(ctx, &req)
	if err != nil {
		utils.ErrorResponse(c, 500, "Failed to calculate price")
		return
	}
	if breakdown == nil {
		utils.ErrorResponse(c, 404, "Product not found")
		return
	}

	utils.SuccessResponse(c, 200, breakdown)
}

func (h *PricingHandler) AddPricingTier(c *gin.Context) {
	productID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.ValidationErrorResponse(c, "Invalid product ID")
		return
	}

	var req models.CreatePricingTierRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, err.Error())
		return
	}

	ctx := context.Background()
	tier := &models.PricingTier{
		MinQty: req.MinQty,
		MaxQty: req.MaxQty,
		Price:  req.Price,
	}

	if err := h.pricingRepo.CreatePricingTier(ctx, productID, tier); err != nil {
		utils.ErrorResponse(c, 500, "Failed to create pricing tier")
		return
	}

	utils.SuccessResponse(c, 201, tier)
}

func (h *PricingHandler) SetDimensionalPricing(c *gin.Context) {
	productID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.ValidationErrorResponse(c, "Invalid product ID")
		return
	}

	var req models.CreateDimensionalPricingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, err.Error())
		return
	}

	ctx := context.Background()
	dp := &models.DimensionalPricing{
		RatePerUnit: req.RatePerUnit,
		Unit:        req.Unit,
		MinCharge:   req.MinCharge,
	}

	if err := h.pricingRepo.CreateDimensionalPricing(ctx, productID, dp); err != nil {
		utils.ErrorResponse(c, 500, "Failed to set dimensional pricing")
		return
	}

	utils.SuccessResponse(c, 201, dp)
}

func (h *PricingHandler) GetPricingRules(c *gin.Context) {
	productID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.ValidationErrorResponse(c, "Invalid product ID")
		return
	}

	ctx := context.Background()

	tiers, _ := h.pricingRepo.GetPricingTiers(ctx, productID)
	dimPricing, _ := h.pricingRepo.GetDimensionalPricing(ctx, productID)
	addOns, _ := h.pricingRepo.GetAddOns(ctx, productID)
	rules, _ := h.pricingRepo.GetPricingRules(ctx, productID)

	utils.SuccessResponse(c, 200, gin.H{
		"tiers":              tiers,
		"dimensionalPricing": dimPricing,
		"addOns":             addOns,
		"rules":              rules,
	})
}

