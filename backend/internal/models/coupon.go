package models

import (
	"time"

	"github.com/google/uuid"
)

type DiscountType string

const (
	DiscountTypePercentage DiscountType = "percentage"
	DiscountTypeFixed      DiscountType = "fixed"
)

type Coupon struct {
	ID               uuid.UUID    `json:"id"`
	Code             string       `json:"code"`
	Description      string       `json:"description"`
	DiscountType     DiscountType `json:"discountType"`
	DiscountValue    float64      `json:"discountValue"`
	MinOrderAmount   float64      `json:"minOrderAmount"`
	MaxDiscountAmount *float64    `json:"maxDiscountAmount,omitempty"`
	UsageLimit       *int         `json:"usageLimit,omitempty"`
	UsedCount        int          `json:"usedCount"`
	PerUserLimit     int          `json:"perUserLimit"`
	ValidFrom        time.Time    `json:"validFrom"`
	ValidUntil       *time.Time   `json:"validUntil,omitempty"`
	IsActive         bool         `json:"isActive"`
	CreatedAt        time.Time    `json:"createdAt"`
	UpdatedAt        time.Time    `json:"updatedAt"`
}

type CouponUsage struct {
	ID             uuid.UUID `json:"id"`
	CouponID       uuid.UUID `json:"couponId"`
	UserID         uuid.UUID `json:"userId"`
	OrderID        *uuid.UUID `json:"orderId,omitempty"`
	DiscountAmount float64   `json:"discountAmount"`
	UsedAt         time.Time `json:"usedAt"`
}

// Request/Response types
type CreateCouponRequest struct {
	Code              string       `json:"code" binding:"required,min=3,max=50"`
	Description       string       `json:"description"`
	DiscountType      DiscountType `json:"discountType" binding:"required,oneof=percentage fixed"`
	DiscountValue     float64      `json:"discountValue" binding:"required,gt=0"`
	MinOrderAmount    float64      `json:"minOrderAmount"`
	MaxDiscountAmount *float64     `json:"maxDiscountAmount"`
	UsageLimit        *int         `json:"usageLimit"`
	PerUserLimit      int          `json:"perUserLimit"`
	ValidFrom         *time.Time   `json:"validFrom"`
	ValidUntil        *time.Time   `json:"validUntil"`
	IsActive          bool         `json:"isActive"`
}

type UpdateCouponRequest struct {
	Description       *string      `json:"description"`
	DiscountType      *DiscountType `json:"discountType"`
	DiscountValue     *float64     `json:"discountValue"`
	MinOrderAmount    *float64     `json:"minOrderAmount"`
	MaxDiscountAmount *float64     `json:"maxDiscountAmount"`
	UsageLimit        *int         `json:"usageLimit"`
	PerUserLimit      *int         `json:"perUserLimit"`
	ValidFrom         *time.Time   `json:"validFrom"`
	ValidUntil        *time.Time   `json:"validUntil"`
	IsActive          *bool        `json:"isActive"`
}

type ApplyCouponRequest struct {
	Code string `json:"code" binding:"required"`
}

type ApplyCouponResponse struct {
	Coupon         *Coupon `json:"coupon"`
	DiscountAmount float64 `json:"discountAmount"`
	Message        string  `json:"message"`
}

type ValidateCouponResult struct {
	Valid          bool    `json:"valid"`
	DiscountAmount float64 `json:"discountAmount"`
	Message        string  `json:"message"`
	Coupon         *Coupon `json:"coupon,omitempty"`
}

