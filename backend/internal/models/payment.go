package models

import (
	"time"

	"github.com/google/uuid"
)

type PaymentStatus string

const (
	PaymentStatusPending  PaymentStatus = "pending"
	PaymentStatusSuccess  PaymentStatus = "success"
	PaymentStatusFailed   PaymentStatus = "failed"
	PaymentStatusRefunded PaymentStatus = "refunded"
)

type Payment struct {
	ID               uuid.UUID     `json:"id"`
	OrderID          uuid.UUID     `json:"orderId"`
	PaystackRef      string        `json:"paystackRef"`
	Amount           float64       `json:"amount"`
	Currency         string        `json:"currency"`
	Status           PaymentStatus `json:"status"`
	PaystackResponse string        `json:"-"`
	CreatedAt        time.Time     `json:"createdAt"`
	UpdatedAt        time.Time     `json:"updatedAt"`
}

type InitializePaymentRequest struct {
	OrderID uuid.UUID `json:"orderId" binding:"required"`
}

type InitializePaymentResponse struct {
	AuthorizationURL string `json:"authorizationUrl"`
	AccessCode       string `json:"accessCode"`
	Reference        string `json:"reference"`
}

type VerifyPaymentRequest struct {
	Reference string `json:"reference" binding:"required"`
}

type PaystackWebhookPayload struct {
	Event string `json:"event"`
	Data  struct {
		Reference string  `json:"reference"`
		Amount    int     `json:"amount"`
		Currency  string  `json:"currency"`
		Status    string  `json:"status"`
		Channel   string  `json:"channel"`
		PaidAt    string  `json:"paid_at"`
	} `json:"data"`
}

