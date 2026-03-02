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

type OrderHandler struct {
	orderRepo          *repository.OrderRepository
	cartRepo           *repository.CartRepository
	productRepo        *repository.ProductRepository
	pricingService     *services.PricingService
	shippingConfigRepo *repository.ShippingConfigRepository
}

func NewOrderHandler(
	orderRepo *repository.OrderRepository,
	cartRepo *repository.CartRepository,
	productRepo *repository.ProductRepository,
	pricingService *services.PricingService,
	shippingConfigRepo *repository.ShippingConfigRepository,
) *OrderHandler {
	return &OrderHandler{
		orderRepo:          orderRepo,
		cartRepo:           cartRepo,
		productRepo:        productRepo,
		pricingService:     pricingService,
		shippingConfigRepo: shippingConfigRepo,
	}
}

func (h *OrderHandler) CreateOrder(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)

	var req models.CreateOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, err.Error())
		return
	}

	ctx := context.Background()

	var subtotal float64
	var orderItems []models.OrderItem

	// If items are provided in the request, use them; otherwise fall back to the user's cart
	if len(req.Items) > 0 {
		// Build order items from request and calculate pricing using the pricing service
		for _, itemReq := range req.Items {
			// Ensure product exists
			product, err := h.productRepo.GetByID(ctx, itemReq.ProductID)
			if err != nil || product == nil {
				utils.ErrorResponse(c, 404, "One or more products in the order were not found")
				return
			}

			// Calculate price for this configuration/quantity
			priceReq := &models.CalculatePriceRequest{
				ProductID:     itemReq.ProductID,
				Configuration: itemReq.Configuration,
				Quantity:      itemReq.Quantity,
			}

			breakdown, err := h.pricingService.CalculatePrice(ctx, priceReq)
			if err != nil || breakdown == nil {
				utils.ErrorResponse(c, 500, "Failed to calculate price for one of the items")
				return
			}

			unitPrice := breakdown.Total / float64(itemReq.Quantity)
			if itemReq.Quantity == 0 {
				unitPrice = breakdown.Total
			}

			fmt.Printf("DEBUG: Order item - ProductID=%s, Quantity=%d, UnitPrice=%.2f, TotalPrice=%.2f\n", itemReq.ProductID, itemReq.Quantity, unitPrice, breakdown.Total)

			orderItems = append(orderItems, models.OrderItem{
				ProductID:     itemReq.ProductID,
				Quantity:      itemReq.Quantity,
				Configuration: itemReq.Configuration,
				UnitPrice:     unitPrice,
				TotalPrice:    breakdown.Total,
			})
			subtotal += breakdown.Total
		}
	} else {
		// Fallback: use items currently in the user's cart
		cartItems, err := h.cartRepo.GetByUserID(ctx, userID)
		if err != nil || len(cartItems) == 0 {
			utils.ErrorResponse(c, 400, "Cart is empty")
			return
		}

		for _, item := range cartItems {
			subtotal += item.TotalPrice
			orderItems = append(orderItems, models.OrderItem{
				ProductID:     item.ProductID,
				Quantity:      item.Quantity,
				Configuration: item.Configuration,
				UnitPrice:     item.TotalPrice / float64(item.Quantity),
				TotalPrice:    item.TotalPrice,
				UploadedFile:  item.UploadedFile,
			})
		}
	}

	// Fetch shipping configuration from database
	shippingConfig, err := h.shippingConfigRepo.Get(ctx)
	if err != nil {
		utils.ErrorResponse(c, 500, "Failed to fetch shipping configuration")
		return
	}

	// Calculate shipping using values from database
	shipping := 0.0
	if subtotal < shippingConfig.FreeShippingThreshold {
		shipping = shippingConfig.ShippingFee
	}

	// Validate discount
	if req.Discount < 0 {
		utils.ErrorResponse(c, 400, "Discount cannot be negative")
		return
	}

	// Ensure discount doesn't exceed subtotal
	discount := req.Discount
	if discount > subtotal {
		discount = subtotal
		fmt.Printf("DEBUG: Discount capped from %.2f to %.2f\n", req.Discount, discount)
	}

	// Calculate total - ensure it's never negative
	total := subtotal + shipping - discount
	if total < 0 {
		total = 0
	}

	fmt.Printf("DEBUG: Order calculation: subtotal=%.2f, shipping=%.2f, discount=%.2f, total=%.2f\n", subtotal, shipping, discount, total)

	order := &models.Order{
		UserID:          userID,
		Status:          models.OrderStatusAwaitingPayment,
		Items:           orderItems,
		Subtotal:        subtotal,
		Discount:        discount,
		Shipping:        shipping,
		Tax:             0, // VAT removed as requested
		Total:           total,
		ShippingAddress: req.ShippingAddress,
	}

	if err := h.orderRepo.Create(ctx, order); err != nil {
		fmt.Printf("DEBUG: Order creation error: %v\n", err)
		utils.ErrorResponse(c, 500, fmt.Sprintf("Failed to create order: %v", err))
		return
	}

	// Clear cart if we used it
	if len(req.Items) == 0 {
		h.cartRepo.ClearCart(ctx, userID)
	}

	// Populate product info
	for i := range order.Items {
		product, _ := h.productRepo.GetByID(ctx, order.Items[i].ProductID)
		order.Items[i].Product = product
	}

	utils.SuccessResponse(c, 201, order)
}

func (h *OrderHandler) GetOrders(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)
	ctx := context.Background()

	orders, err := h.orderRepo.GetByUserID(ctx, userID)
	if err != nil {
		utils.ErrorResponse(c, 500, "Failed to fetch orders")
		return
	}
	if orders == nil {
		orders = []models.Order{}
	}

	utils.SuccessResponse(c, 200, orders)
}

func (h *OrderHandler) GetOrder(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)
	orderID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.ValidationErrorResponse(c, "Invalid order ID")
		return
	}

	ctx := context.Background()
	order, err := h.orderRepo.GetByID(ctx, orderID)
	if err != nil || order == nil {
		utils.ErrorResponse(c, 404, "Order not found")
		return
	}

	// Verify ownership
	if order.UserID != userID {
		utils.ErrorResponse(c, 403, "Access denied")
		return
	}

	// Populate product info
	for i := range order.Items {
		product, _ := h.productRepo.GetByID(ctx, order.Items[i].ProductID)
		order.Items[i].Product = product
	}

	utils.SuccessResponse(c, 200, order)
}

// Admin endpoints
func (h *OrderHandler) GetAllOrders(c *gin.Context) {
	status := c.Query("status")
	ctx := context.Background()

	orders, err := h.orderRepo.GetAllAdmin(ctx, status)
	if err != nil {
		utils.ErrorResponse(c, 500, "Failed to fetch orders")
		return
	}
	if orders == nil {
		orders = []models.AdminOrderResponse{}
	}

	utils.SuccessResponse(c, 200, orders)
}

func (h *OrderHandler) GetOrderAdmin(c *gin.Context) {
	orderID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.ValidationErrorResponse(c, "Invalid order ID")
		return
	}

	ctx := context.Background()
	order, err := h.orderRepo.GetByID(ctx, orderID)
	if err != nil || order == nil {
		utils.ErrorResponse(c, 404, "Order not found")
		return
	}

	for i := range order.Items {
		product, _ := h.productRepo.GetByID(ctx, order.Items[i].ProductID)
		order.Items[i].Product = product
	}

	utils.SuccessResponse(c, 200, order)
}

func (h *OrderHandler) UpdateOrderStatus(c *gin.Context) {
	orderID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.ValidationErrorResponse(c, "Invalid order ID")
		return
	}

	var req models.UpdateOrderStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, err.Error())
		return
	}

	ctx := context.Background()
	order, err := h.orderRepo.GetByID(ctx, orderID)
	if err != nil || order == nil {
		utils.ErrorResponse(c, 404, "Order not found")
		return
	}

	adminID := c.MustGet("userID").(uuid.UUID)

	if err := h.orderRepo.UpdateStatus(ctx, orderID, req.Status, req.Note, adminID); err != nil {
		utils.ErrorResponse(c, 500, "Failed to update order status")
		return
	}

	order.Status = req.Status
	utils.SuccessResponse(c, 200, order)
}

func (h *OrderHandler) AddOrderNote(c *gin.Context) {
	orderID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.ValidationErrorResponse(c, "Invalid order ID")
		return
	}

	var req models.AddOrderNoteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, err.Error())
		return
	}

	ctx := context.Background()
	order, err := h.orderRepo.GetByID(ctx, orderID)
	if err != nil || order == nil {
		utils.ErrorResponse(c, 404, "Order not found")
		return
	}

	adminID := c.MustGet("userID").(uuid.UUID)

	if err := h.orderRepo.AddNote(ctx, orderID, req.Note, adminID); err != nil {
		utils.ErrorResponse(c, 500, "Failed to add note")
		return
	}

	utils.SuccessResponse(c, 201, models.OrderNote{
		OrderID:   orderID,
		Note:      req.Note,
		CreatedBy: adminID,
	})
}

func (h *OrderHandler) GetOrderNotes(c *gin.Context) {
	orderID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.ValidationErrorResponse(c, "Invalid order ID")
		return
	}

	ctx := context.Background()
	notes, err := h.orderRepo.GetNotes(ctx, orderID)
	if err != nil {
		utils.ErrorResponse(c, 500, "Failed to fetch notes")
		return
	}
	if notes == nil {
		notes = []models.OrderNote{}
	}

	utils.SuccessResponse(c, 200, notes)
}

func (h *OrderHandler) GetOrderHistory(c *gin.Context) {
	orderID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.ValidationErrorResponse(c, "Invalid order ID")
		return
	}

	ctx := context.Background()
	history, err := h.orderRepo.GetStatusHistory(ctx, orderID)
	if err != nil {
		utils.ErrorResponse(c, 500, "Failed to fetch order history")
		return
	}
	if history == nil {
		history = []models.OrderStatusHistory{}
	}

	utils.SuccessResponse(c, 200, history)
}
