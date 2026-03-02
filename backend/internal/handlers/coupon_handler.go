package handlers

import (
	"context"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/quikprint/backend/internal/models"
	"github.com/quikprint/backend/internal/repository"
	"github.com/quikprint/backend/internal/utils"
)

type CouponHandler struct {
	couponRepo *repository.CouponRepository
	cartRepo   *repository.CartRepository
}

func NewCouponHandler(couponRepo *repository.CouponRepository, cartRepo *repository.CartRepository) *CouponHandler {
	return &CouponHandler{couponRepo: couponRepo, cartRepo: cartRepo}
}

// Admin: Get all coupons
func (h *CouponHandler) GetAll(c *gin.Context) {
	ctx := context.Background()
	coupons, err := h.couponRepo.GetAll(ctx)
	if err != nil {
		utils.ErrorResponse(c, 500, "Failed to fetch coupons")
		return
	}
	if coupons == nil {
		coupons = []models.Coupon{}
	}
	utils.SuccessResponse(c, 200, coupons)
}

// Admin: Get coupon by ID
func (h *CouponHandler) GetByID(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.ValidationErrorResponse(c, "Invalid coupon ID")
		return
	}

	ctx := context.Background()
	coupon, err := h.couponRepo.GetByID(ctx, id)
	if err != nil {
		utils.ErrorResponse(c, 404, "Coupon not found")
		return
	}
	utils.SuccessResponse(c, 200, coupon)
}

// Admin: Create coupon
func (h *CouponHandler) Create(c *gin.Context) {
	var req models.CreateCouponRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, err.Error())
		return
	}

	ctx := context.Background()

	// Check if code already exists
	existing, _ := h.couponRepo.GetByCode(ctx, req.Code)
	if existing != nil {
		utils.ErrorResponse(c, 400, "Coupon code already exists")
		return
	}

	coupon := &models.Coupon{
		Code:              strings.ToUpper(req.Code),
		Description:       req.Description,
		DiscountType:      req.DiscountType,
		DiscountValue:     req.DiscountValue,
		MinOrderAmount:    req.MinOrderAmount,
		MaxDiscountAmount: req.MaxDiscountAmount,
		UsageLimit:        req.UsageLimit,
		PerUserLimit:      req.PerUserLimit,
		IsActive:          req.IsActive,
	}

	if req.ValidFrom != nil {
		coupon.ValidFrom = *req.ValidFrom
	} else {
		coupon.ValidFrom = time.Now()
	}
	coupon.ValidUntil = req.ValidUntil

	if coupon.PerUserLimit == 0 {
		coupon.PerUserLimit = 1
	}

	if err := h.couponRepo.Create(ctx, coupon); err != nil {
		utils.ErrorResponse(c, 500, "Failed to create coupon: "+err.Error())
		return
	}

	utils.SuccessResponse(c, 201, coupon)
}

// Admin: Update coupon
func (h *CouponHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.ValidationErrorResponse(c, "Invalid coupon ID")
		return
	}

	var req models.UpdateCouponRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, err.Error())
		return
	}

	ctx := context.Background()
	coupon, err := h.couponRepo.GetByID(ctx, id)
	if err != nil {
		utils.ErrorResponse(c, 404, "Coupon not found")
		return
	}

	if req.Description != nil {
		coupon.Description = *req.Description
	}
	if req.DiscountType != nil {
		coupon.DiscountType = *req.DiscountType
	}
	if req.DiscountValue != nil {
		coupon.DiscountValue = *req.DiscountValue
	}
	if req.MinOrderAmount != nil {
		coupon.MinOrderAmount = *req.MinOrderAmount
	}
	if req.MaxDiscountAmount != nil {
		coupon.MaxDiscountAmount = req.MaxDiscountAmount
	}
	if req.UsageLimit != nil {
		coupon.UsageLimit = req.UsageLimit
	}
	if req.PerUserLimit != nil {
		coupon.PerUserLimit = *req.PerUserLimit
	}
	if req.ValidFrom != nil {
		coupon.ValidFrom = *req.ValidFrom
	}
	if req.ValidUntil != nil {
		coupon.ValidUntil = req.ValidUntil
	}
	if req.IsActive != nil {
		coupon.IsActive = *req.IsActive
	}

	if err := h.couponRepo.Update(ctx, coupon); err != nil {
		utils.ErrorResponse(c, 500, "Failed to update coupon")
		return
	}

	utils.SuccessResponse(c, 200, coupon)
}

// Admin: Delete coupon
func (h *CouponHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.ValidationErrorResponse(c, "Invalid coupon ID")
		return
	}

	ctx := context.Background()
	if err := h.couponRepo.Delete(ctx, id); err != nil {
		utils.ErrorResponse(c, 500, "Failed to delete coupon")
		return
	}

	utils.SuccessMessageResponse(c, 200, "Coupon deleted successfully")
}

// Protected: Apply coupon for current user and order amount
func (h *CouponHandler) Apply(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)

	type applyRequest struct {
		Code        string  `json:"code" binding:"required"`
		OrderAmount float64 `json:"orderAmount" binding:"required,gt=0"`
	}

	var req applyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, err.Error())
		return
	}

	ctx := context.Background()

	coupon, err := h.couponRepo.GetByCode(ctx, req.Code)
	if err != nil || coupon == nil {
		utils.ErrorResponse(c, 404, "Coupon not found")
		return
	}

	now := time.Now()

	if !coupon.IsActive {
		utils.ErrorResponse(c, 400, "Coupon is not active")
		return
	}

	if coupon.ValidFrom.After(now) {
		utils.ErrorResponse(c, 400, "Coupon is not yet valid")
		return
	}

	if coupon.ValidUntil != nil && coupon.ValidUntil.Before(now) {
		utils.ErrorResponse(c, 400, "Coupon has expired")
		return
	}

	if req.OrderAmount < coupon.MinOrderAmount {
		utils.ErrorResponse(c, 400, "Order total does not meet the minimum amount for this coupon")
		return
	}

	// Global usage limit
	if coupon.UsageLimit != nil && coupon.UsedCount >= *coupon.UsageLimit {
		utils.ErrorResponse(c, 400, "Coupon usage limit has been reached")
		return
	}

	// Per-user usage limit
	if coupon.PerUserLimit > 0 {
		usageCount, err := h.couponRepo.GetUserUsageCount(ctx, coupon.ID, userID)
		if err != nil {
			utils.ErrorResponse(c, 500, "Failed to validate coupon usage")
			return
		}
		if usageCount >= coupon.PerUserLimit {
			utils.ErrorResponse(c, 400, "You have already used this coupon the maximum allowed times")
			return
		}
	}

	// Calculate discount
	var discount float64
	switch coupon.DiscountType {
	case models.DiscountTypeFixed:
		discount = coupon.DiscountValue
	case models.DiscountTypePercentage:
		discount = (req.OrderAmount * coupon.DiscountValue) / 100
	}

	// Apply maximum discount cap if set
	if coupon.MaxDiscountAmount != nil && discount > *coupon.MaxDiscountAmount {
		discount = *coupon.MaxDiscountAmount
	}

	if discount <= 0 {
		utils.ErrorResponse(c, 400, "Coupon does not provide a discount for this order amount")
		return
	}

	response := models.ApplyCouponResponse{
		Coupon:         coupon,
		DiscountAmount: discount,
		Message:        "Coupon applied successfully",
	}

	utils.SuccessResponse(c, 200, response)
}
