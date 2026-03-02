package handlers

import (
	"context"
	"fmt"

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

func (h *PricingHandler) DeleteDimensionalPricing(c *gin.Context) {
	productID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.ValidationErrorResponse(c, "Invalid product ID")
		return
	}

	ctx := context.Background()
	if err := h.pricingRepo.DeleteDimensionalPricing(ctx, productID); err != nil {
		utils.ErrorResponse(c, 500, "Failed to delete dimensional pricing")
		return
	}

	utils.SuccessMessageResponse(c, 200, "Dimensional pricing deleted successfully")
}

// SetPricingTiers replaces all pricing tiers for a product
func (h *PricingHandler) SetPricingTiers(c *gin.Context) {
	productID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.ValidationErrorResponse(c, "Invalid product ID")
		return
	}

	var tiers []models.CreatePricingTierRequest
	if err := c.ShouldBindJSON(&tiers); err != nil {
		utils.ValidationErrorResponse(c, err.Error())
		return
	}

	// Debug logging
	fmt.Printf("DEBUG: SetPricingTiers called for product %s with %d tiers\n", productID, len(tiers))
	for i, tier := range tiers {
		fmt.Printf("DEBUG: Tier %d: minQty=%d, maxQty=%d, price=%f\n", i, tier.MinQty, tier.MaxQty, tier.Price)
	}

	ctx := context.Background()

	// Delete existing tiers first
	if err := h.pricingRepo.DeletePricingTiers(ctx, productID); err != nil {
		fmt.Printf("DEBUG: Failed to delete existing tiers: %v\n", err)
		utils.ErrorResponse(c, 500, "Failed to clear existing pricing tiers")
		return
	}

	// Create new tiers
	var createdTiers []models.PricingTier
	for _, req := range tiers {
		tier := &models.PricingTier{
			MinQty: req.MinQty,
			MaxQty: req.MaxQty,
			Price:  req.Price,
		}
		if err := h.pricingRepo.CreatePricingTier(ctx, productID, tier); err != nil {
			fmt.Printf("DEBUG: Failed to create pricing tier: %v\n", err)
			utils.ErrorResponse(c, 500, "Failed to create pricing tier")
			return
		}
		createdTiers = append(createdTiers, *tier)
		fmt.Printf("DEBUG: Successfully created tier with ID %s\n", tier.ID)
	}

	fmt.Printf("DEBUG: Successfully created %d pricing tiers\n", len(createdTiers))
	utils.SuccessResponse(c, 201, createdTiers)
}

// DeletePricingTiers removes all pricing tiers for a product
func (h *PricingHandler) DeletePricingTiers(c *gin.Context) {
	productID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.ValidationErrorResponse(c, "Invalid product ID")
		return
	}

	ctx := context.Background()
	if err := h.pricingRepo.DeletePricingTiers(ctx, productID); err != nil {
		utils.ErrorResponse(c, 500, "Failed to delete pricing tiers")
		return
	}

	utils.SuccessMessageResponse(c, 200, "Pricing tiers deleted successfully")
}
