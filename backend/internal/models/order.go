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
	OrderNumber     string          `json:"orderNumber"`
	UserID          uuid.UUID       `json:"userId"`
	Status          OrderStatus     `json:"status"`
	Items           []OrderItem     `json:"items"`
	Subtotal        float64         `json:"subtotal"`
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
	ShippingAddress ShippingAddress `json:"shippingAddress" binding:"required"`
}

type UpdateOrderStatusRequest struct {
	Status OrderStatus `json:"status" binding:"required"`
	Note   string      `json:"note"`
}

type AddOrderNoteRequest struct {
	Note string `json:"note" binding:"required"`
}

