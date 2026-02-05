package services

import (
	"context"

	"github.com/google/uuid"
	"github.com/quikprint/backend/internal/models"
	"github.com/quikprint/backend/internal/repository"
)

type PricingService struct {
	productRepo *repository.ProductRepository
	pricingRepo *repository.PricingRepository
}

func NewPricingService(productRepo *repository.ProductRepository, pricingRepo *repository.PricingRepository) *PricingService {
	return &PricingService{productRepo: productRepo, pricingRepo: pricingRepo}
}

func (s *PricingService) CalculatePrice(ctx context.Context, req *models.CalculatePriceRequest) (*models.PriceBreakdown, error) {
	product, err := s.productRepo.GetByID(ctx, req.ProductID)
	if err != nil || product == nil {
		return nil, err
	}

	breakdown := &models.PriceBreakdown{
		BasePrice:       product.BasePrice,
		OptionModifiers: make(map[string]float64),
		AddOns:          make(map[string]float64),
	}

	// Calculate option modifiers from product options
	for _, option := range product.Options {
		if val, ok := req.Configuration[option.ID]; ok {
			switch option.Type {
			case models.OptionTypeSelect, models.OptionTypeRadio:
				if strVal, ok := val.(string); ok {
					for _, opt := range option.Options {
						if opt.Value == strVal && opt.PriceModifier != nil {
							breakdown.OptionModifiers[option.Name] = *opt.PriceModifier
						}
					}
				}
			case models.OptionTypeDimension:
				// Handle dimensional pricing
				if floatVal, ok := val.(float64); ok {
					breakdown.OptionModifiers[option.Name] = floatVal
				}
			}
		}
	}

	// Check for dimensional pricing
	dimPricing, _ := s.pricingRepo.GetDimensionalPricing(ctx, req.ProductID)
	if dimPricing != nil {
		width := getFloatFromConfig(req.Configuration, "width")
		height := getFloatFromConfig(req.Configuration, "height")
		if width > 0 && height > 0 {
			area := width * height
			dimCost := area * dimPricing.RatePerUnit
			if dimCost < dimPricing.MinCharge {
				dimCost = dimPricing.MinCharge
			}
			breakdown.DimensionalCost = dimCost
		}
	}

	// Check for quantity-based pricing tiers
	tiers, _ := s.pricingRepo.GetPricingTiers(ctx, req.ProductID)
	quantity := req.Quantity
	if quantity == 0 {
		quantity = getIntFromConfig(req.Configuration, "quantity")
	}
	if quantity == 0 {
		quantity = product.MinQuantity
	}

	for _, tier := range tiers {
		if quantity >= tier.MinQty && quantity <= tier.MaxQty {
			breakdown.QuantityPrice = tier.Price
			break
		}
	}

	// Get pricing rules (setup fees, rush fees, etc.)
	rules, _ := s.pricingRepo.GetPricingRules(ctx, req.ProductID)
	for _, rule := range rules {
		switch rule.RuleType {
		case "setup_fee":
			breakdown.SetupFee = rule.Value
		case "rush_fee":
			if isRush, ok := req.Configuration["rush"].(bool); ok && isRush {
				breakdown.RushFee = rule.Value
			}
		}
	}

	// Calculate subtotal
	subtotal := breakdown.BasePrice
	for _, mod := range breakdown.OptionModifiers {
		subtotal += mod
	}

	// Use quantity price if available, otherwise use base calculation
	if breakdown.QuantityPrice > 0 {
		subtotal = breakdown.QuantityPrice
		for _, mod := range breakdown.OptionModifiers {
			subtotal += mod
		}
	}

	// Add dimensional cost
	if breakdown.DimensionalCost > 0 {
		subtotal = breakdown.DimensionalCost
		for _, mod := range breakdown.OptionModifiers {
			subtotal += mod
		}
	}

	breakdown.Subtotal = subtotal
	breakdown.Total = subtotal + breakdown.SetupFee + breakdown.RushFee

	// Add add-ons
	for name, price := range breakdown.AddOns {
		breakdown.Total += price
		_ = name
	}

	return breakdown, nil
}

func getFloatFromConfig(config map[string]interface{}, key string) float64 {
	if val, ok := config[key]; ok {
		if f, ok := val.(float64); ok {
			return f
		}
	}
	return 0
}

func getIntFromConfig(config map[string]interface{}, key string) int {
	if val, ok := config[key]; ok {
		switch v := val.(type) {
		case float64:
			return int(v)
		case int:
			return v
		case string:
			// Try to parse quantity from string like "250"
			var qty int
			if _, err := uuid.Parse(v); err != nil {
				// Not a UUID, might be a number string
				for _, c := range v {
					if c >= '0' && c <= '9' {
						qty = qty*10 + int(c-'0')
					}
				}
			}
			return qty
		}
	}
	return 0
}

