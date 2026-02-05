package models

import (
	"time"

	"github.com/google/uuid"
)

type OptionType string

const (
	OptionTypeSelect    OptionType = "select"
	OptionTypeRadio     OptionType = "radio"
	OptionTypeCheckbox  OptionType = "checkbox"
	OptionTypeQuantity  OptionType = "quantity"
	OptionTypeDimension OptionType = "dimension"
)

type ProductOptionValue struct {
	Value         string   `json:"value"`
	Label         string   `json:"label"`
	PriceModifier *float64 `json:"priceModifier,omitempty"`
}

type ProductOption struct {
	ID      string               `json:"id"`
	Name    string               `json:"name"`
	Type    OptionType           `json:"type"`
	Options []ProductOptionValue `json:"options,omitempty"`
	Min     *float64             `json:"min,omitempty"`
	Max     *float64             `json:"max,omitempty"`
	Step    *float64             `json:"step,omitempty"`
	Unit    *string              `json:"unit,omitempty"`
}

type Product struct {
	ID               uuid.UUID       `json:"id"`
	Name             string          `json:"name"`
	Slug             string          `json:"slug"`
	CategoryID       uuid.UUID       `json:"categoryId"`
	Category         string          `json:"category"`
	CategorySlug     string          `json:"categorySlug"`
	Description      string          `json:"description"`
	ShortDescription string          `json:"shortDescription"`
	BasePrice        float64         `json:"basePrice"`
	Images           []string        `json:"images"`
	Options          []ProductOption `json:"options"`
	Features         []string        `json:"features"`
	Turnaround       string          `json:"turnaround"`
	MinQuantity      int             `json:"minQuantity"`
	CreatedAt        time.Time       `json:"createdAt"`
	UpdatedAt        time.Time       `json:"updatedAt"`
}

type CreateProductRequest struct {
	Name             string          `json:"name" binding:"required"`
	Slug             string          `json:"slug" binding:"required"`
	CategoryID       uuid.UUID       `json:"categoryId" binding:"required"`
	Description      string          `json:"description"`
	ShortDescription string          `json:"shortDescription"`
	BasePrice        float64         `json:"basePrice" binding:"required"`
	Images           []string        `json:"images"`
	Options          []ProductOption `json:"options"`
	Features         []string        `json:"features"`
	Turnaround       string          `json:"turnaround"`
	MinQuantity      int             `json:"minQuantity"`
}

type UpdateProductRequest struct {
	Name             *string          `json:"name"`
	Slug             *string          `json:"slug"`
	CategoryID       *uuid.UUID       `json:"categoryId"`
	Description      *string          `json:"description"`
	ShortDescription *string          `json:"shortDescription"`
	BasePrice        *float64         `json:"basePrice"`
	Images           []string         `json:"images"`
	Options          *[]ProductOption `json:"options"`
	Features         []string         `json:"features"`
	Turnaround       *string          `json:"turnaround"`
	MinQuantity      *int             `json:"minQuantity"`
}

