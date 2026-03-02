package models

import (
	"time"

	"github.com/google/uuid"
)

type OrderStatus string

const (
	OrderStatusPending         OrderStatus = "pending"
	OrderStatusAwaitingPayment OrderStatus = "awaiting_payment"
	OrderStatusPaid            OrderStatus = "paid"
	OrderStatusProcessing      OrderStatus = "processing"
	OrderStatusPrinting        OrderStatus = "printing"
	OrderStatusReady           OrderStatus = "ready"
	OrderStatusShipped         OrderStatus = "shipped"
	OrderStatusDelivered       OrderStatus = "delivered"
	OrderStatusCancelled       OrderStatus = "cancelled"
)

type ShippingAddress struct {
	Name    string `json:"name"`
	Street  string `json:"street"`
	City    string `json:"city"`
	State   string `json:"state"`
	Zip     string `json:"zip"`
	Country string `json:"country"`
}

type OrderItem struct {
	ID            uuid.UUID              `json:"id"`
	OrderID       uuid.UUID              `json:"orderId"`
	ProductID     uuid.UUID              `json:"productId"`
	Product       *Product               `json:"product,omitempty"`
	Quantity      int                    `json:"quantity"`
	Configuration map[string]interface{} `json:"configuration"`
	UnitPrice     float64                `json:"unitPrice"`
	TotalPrice    float64                `json:"totalPrice"`
	UploadedFile  *string                `json:"uploadedFile,omitempty"`
}

type Order struct {
	ID              uuid.UUID       `json:"id"`
	OrderNumber     string          `json:"order_number"`
	UserID          uuid.UUID       `json:"user_id"`
	Status          OrderStatus     `json:"status"`
	Items           []OrderItem     `json:"items"`
	Subtotal        float64         `json:"subtotal"`
	Discount        float64         `json:"discount"`
	Shipping        float64         `json:"shipping"`
	Tax             float64         `json:"tax"`
	Total           float64         `json:"total"`
	ShippingAddress ShippingAddress `json:"shippingAddress"`
	CreatedAt       time.Time       `json:"createdAt"`
	UpdatedAt       time.Time       `json:"updatedAt"`
}

type OrderStatusHistory struct {
	ID        uuid.UUID   `json:"id"`
	OrderID   uuid.UUID   `json:"orderId"`
	Status    OrderStatus `json:"status"`
	Note      string      `json:"note,omitempty"`
	CreatedBy uuid.UUID   `json:"createdBy"`
	CreatedAt time.Time   `json:"createdAt"`
}

type OrderNote struct {
	ID        uuid.UUID `json:"id"`
	OrderID   uuid.UUID `json:"orderId"`
	Note      string    `json:"note"`
	CreatedBy uuid.UUID `json:"createdBy"`
	CreatedAt time.Time `json:"createdAt"`
}

type CreateOrderRequest struct {
	ShippingAddress ShippingAddress          `json:"shippingAddress" binding:"required"`
	Items           []CreateOrderItemRequest `json:"items"`
	Discount        float64                  `json:"discount"`
}

// CreateOrderItemRequest represents an item sent from the client when creating an order
type CreateOrderItemRequest struct {
	ProductID     uuid.UUID              `json:"productId" binding:"required"`
	Quantity      int                    `json:"quantity" binding:"required,min=1"`
	Configuration map[string]interface{} `json:"configuration" binding:"required"`
}

type UpdateOrderStatusRequest struct {
	Status OrderStatus `json:"status" binding:"required"`
	Note   string      `json:"note"`
}

type AddOrderNoteRequest struct {
	Note string `json:"note" binding:"required"`
}

// AdminOrderResponse extends Order with user info for admin views
type AdminOrderResponse struct {
	Order
	UserEmail     string `json:"user_email"`
	CustomerName  string `json:"customer_name"`
	CustomerEmail string `json:"customer_email"`
	AdminNotes    string `json:"admin_notes,omitempty"`
}

// UserOrderStats holds aggregated order data for a user
type UserOrderStats struct {
	TotalOrders int     `json:"totalOrders"`
	TotalSpent  float64 `json:"totalSpent"`
}
