package models

import (
	"time"

	"github.com/google/uuid"
)

type CartItem struct {
	ID            uuid.UUID              `json:"id"`
	UserID        uuid.UUID              `json:"userId"`
	ProductID     uuid.UUID              `json:"productId"`
	Product       *Product               `json:"product,omitempty"`
	Quantity      int                    `json:"quantity"`
	Configuration map[string]interface{} `json:"configuration"`
	TotalPrice    float64                `json:"totalPrice"`
	UploadedFile  *string                `json:"uploadedFile,omitempty"`
	CreatedAt     time.Time              `json:"createdAt"`
	UpdatedAt     time.Time              `json:"updatedAt"`
}

type AddToCartRequest struct {
	ProductID     uuid.UUID              `json:"productId" binding:"required"`
	Quantity      int                    `json:"quantity" binding:"required,min=1"`
	Configuration map[string]interface{} `json:"configuration" binding:"required"`
}

type UpdateCartItemRequest struct {
	Quantity      *int                    `json:"quantity"`
	Configuration map[string]interface{} `json:"configuration"`
}

type Cart struct {
	Items    []CartItem `json:"items"`
	Subtotal float64    `json:"subtotal"`
	Count    int        `json:"count"`
}

