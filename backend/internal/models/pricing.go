package models

import (
	"github.com/google/uuid"
)

type PricingTier struct {
	ID        uuid.UUID `json:"id"`
	ProductID uuid.UUID `json:"productId"`
	MinQty    int       `json:"minQty"`
	MaxQty    int       `json:"maxQty"`
	Price     float64   `json:"price"`
}

type DimensionalPricing struct {
	ID          uuid.UUID `json:"id"`
	ProductID   uuid.UUID `json:"productId"`
	RatePerUnit float64   `json:"ratePerUnit"`
	Unit        string    `json:"unit"` // e.g., "sqft", "sqin"
	MinCharge   float64   `json:"minCharge"`
}

type AddOn struct {
	ID            uuid.UUID `json:"id"`
	ProductID     uuid.UUID `json:"productId"`
	Name          string    `json:"name"`
	Type          string    `json:"type"` // flat, percentage
	PriceModifier float64   `json:"priceModifier"`
	Enabled       bool      `json:"enabled"`
}

type PricingRule struct {
	ID           uuid.UUID `json:"id"`
	ProductID    uuid.UUID `json:"productId"`
	RuleType     string    `json:"ruleType"` // minimum_charge, setup_fee, rush_fee
	Value        float64   `json:"value"`
	Description  string    `json:"description"`
}

type CalculatePriceRequest struct {
	ProductID     uuid.UUID              `json:"productId" binding:"required"`
	Configuration map[string]interface{} `json:"configuration" binding:"required"`
	Quantity      int                    `json:"quantity"`
}

type PriceBreakdown struct {
	BasePrice       float64            `json:"basePrice"`
	OptionModifiers map[string]float64 `json:"optionModifiers"`
	DimensionalCost float64            `json:"dimensionalCost,omitempty"`
	QuantityPrice   float64            `json:"quantityPrice,omitempty"`
	AddOns          map[string]float64 `json:"addOns,omitempty"`
	SetupFee        float64            `json:"setupFee,omitempty"`
	RushFee         float64            `json:"rushFee,omitempty"`
	Subtotal        float64            `json:"subtotal"`
	Total           float64            `json:"total"`
}

type CreatePricingTierRequest struct {
	MinQty int     `json:"minQty" binding:"required"`
	MaxQty int     `json:"maxQty" binding:"required"`
	Price  float64 `json:"price" binding:"required"`
}

type CreateDimensionalPricingRequest struct {
	RatePerUnit float64 `json:"ratePerUnit" binding:"required"`
	Unit        string  `json:"unit" binding:"required"`
	MinCharge   float64 `json:"minCharge"`
}

