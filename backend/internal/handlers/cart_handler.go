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

type CartHandler struct {
	cartRepo       *repository.CartRepository
	productRepo    *repository.ProductRepository
	pricingService *services.PricingService
}

func NewCartHandler(cartRepo *repository.CartRepository, productRepo *repository.ProductRepository, pricingService *services.PricingService) *CartHandler {
	return &CartHandler{cartRepo: cartRepo, productRepo: productRepo, pricingService: pricingService}
}

func (h *CartHandler) GetCart(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)
	ctx := context.Background()

	items, err := h.cartRepo.GetByUserID(ctx, userID)
	if err != nil {
		utils.ErrorResponse(c, 500, "Failed to fetch cart")
		return
	}
	if items == nil {
		items = []models.CartItem{}
	}

	// Populate product info
	var subtotal float64
	for i := range items {
		product, _ := h.productRepo.GetByID(ctx, items[i].ProductID)
		items[i].Product = product
		subtotal += items[i].TotalPrice
	}

	cart := models.Cart{
		Items:    items,
		Subtotal: subtotal,
		Count:    len(items),
	}

	utils.SuccessResponse(c, 200, cart)
}

func (h *CartHandler) AddItem(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)

	var req models.AddToCartRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, err.Error())
		return
	}

	ctx := context.Background()

	// Verify product exists
	product, err := h.productRepo.GetByID(ctx, req.ProductID)
	if err != nil || product == nil {
		utils.ErrorResponse(c, 404, "Product not found")
		return
	}

	// Calculate price
	priceReq := &models.CalculatePriceRequest{
		ProductID:     req.ProductID,
		Configuration: req.Configuration,
		Quantity:      req.Quantity,
	}
	breakdown, err := h.pricingService.CalculatePrice(ctx, priceReq)
	if err != nil {
		utils.ErrorResponse(c, 500, "Failed to calculate price")
		return
	}

	item := &models.CartItem{
		UserID:        userID,
		ProductID:     req.ProductID,
		Quantity:      req.Quantity,
		Configuration: req.Configuration,
		TotalPrice:    breakdown.Total,
	}

	if err := h.cartRepo.AddItem(ctx, item); err != nil {
		utils.ErrorResponse(c, 500, "Failed to add item to cart")
		return
	}

	item.Product = product
	utils.SuccessResponse(c, 201, item)
}

func (h *CartHandler) UpdateItem(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)
	itemID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.ValidationErrorResponse(c, "Invalid item ID")
		return
	}

	var req models.UpdateCartItemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, err.Error())
		return
	}

	ctx := context.Background()

	item, err := h.cartRepo.GetItemByID(ctx, itemID, userID)
	if err != nil {
		utils.ErrorResponse(c, 404, "Cart item not found")
		return
	}

	if req.Quantity != nil {
		item.Quantity = *req.Quantity
	}
	if req.Configuration != nil {
		item.Configuration = req.Configuration
	}

	// Recalculate price
	priceReq := &models.CalculatePriceRequest{
		ProductID:     item.ProductID,
		Configuration: item.Configuration,
		Quantity:      item.Quantity,
	}
	breakdown, _ := h.pricingService.CalculatePrice(ctx, priceReq)
	if breakdown != nil {
		item.TotalPrice = breakdown.Total
	}

	if err := h.cartRepo.UpdateItem(ctx, item); err != nil {
		utils.ErrorResponse(c, 500, "Failed to update cart item")
		return
	}

	product, _ := h.productRepo.GetByID(ctx, item.ProductID)
	item.Product = product
	utils.SuccessResponse(c, 200, item)
}

func (h *CartHandler) DeleteItem(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)
	itemID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.ValidationErrorResponse(c, "Invalid item ID")
		return
	}

	ctx := context.Background()
	if err := h.cartRepo.DeleteItem(ctx, itemID, userID); err != nil {
		utils.ErrorResponse(c, 500, "Failed to remove item from cart")
		return
	}

	utils.SuccessMessageResponse(c, 200, "Item removed from cart")
}

