package handlers

import (
	"context"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/quikprint/backend/internal/models"
	"github.com/quikprint/backend/internal/repository"
	"github.com/quikprint/backend/internal/utils"
)

type OrderHandler struct {
	orderRepo   *repository.OrderRepository
	cartRepo    *repository.CartRepository
	productRepo *repository.ProductRepository
}

func NewOrderHandler(orderRepo *repository.OrderRepository, cartRepo *repository.CartRepository, productRepo *repository.ProductRepository) *OrderHandler {
	return &OrderHandler{orderRepo: orderRepo, cartRepo: cartRepo, productRepo: productRepo}
}

func (h *OrderHandler) CreateOrder(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)

	var req models.CreateOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, err.Error())
		return
	}

	ctx := context.Background()

	// Get cart items
	cartItems, err := h.cartRepo.GetByUserID(ctx, userID)
	if err != nil || len(cartItems) == 0 {
		utils.ErrorResponse(c, 400, "Cart is empty")
		return
	}

	// Calculate totals
	var subtotal float64
	var orderItems []models.OrderItem
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

	// Calculate shipping and tax (simplified)
	shipping := 0.0
	if subtotal < 50 {
		shipping = 9.99
	}
	tax := subtotal * 0.08 // 8% tax

	order := &models.Order{
		UserID:          userID,
		Status:          models.OrderStatusAwaitingPayment,
		Items:           orderItems,
		Subtotal:        subtotal,
		Shipping:        shipping,
		Tax:             tax,
		Total:           subtotal + shipping + tax,
		ShippingAddress: req.ShippingAddress,
	}

	if err := h.orderRepo.Create(ctx, order); err != nil {
		utils.ErrorResponse(c, 500, "Failed to create order")
		return
	}

	// Clear cart
	h.cartRepo.ClearCart(ctx, userID)

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

	orders, err := h.orderRepo.GetAll(ctx, status)
	if err != nil {
		utils.ErrorResponse(c, 500, "Failed to fetch orders")
		return
	}
	if orders == nil {
		orders = []models.Order{}
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
