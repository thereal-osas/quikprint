package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/quikprint/backend/internal/models"
)

type PricingRepository struct {
	db *pgxpool.Pool
}

func NewPricingRepository(db *pgxpool.Pool) *PricingRepository {
	return &PricingRepository{db: db}
}

func (r *PricingRepository) GetPricingTiers(ctx context.Context, productID uuid.UUID) ([]models.PricingTier, error) {
	query := `SELECT id, product_id, min_qty, max_qty, price FROM pricing_tiers WHERE product_id = $1 ORDER BY min_qty`
	rows, err := r.db.Query(ctx, query, productID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tiers []models.PricingTier
	for rows.Next() {
		var t models.PricingTier
		if err := rows.Scan(&t.ID, &t.ProductID, &t.MinQty, &t.MaxQty, &t.Price); err != nil {
			return nil, err
		}
		tiers = append(tiers, t)
	}
	return tiers, nil
}

func (r *PricingRepository) GetDimensionalPricing(ctx context.Context, productID uuid.UUID) (*models.DimensionalPricing, error) {
	query := `SELECT id, product_id, rate_per_unit, unit, min_charge FROM dimensional_pricing WHERE product_id = $1`
	var dp models.DimensionalPricing
	err := r.db.QueryRow(ctx, query, productID).Scan(&dp.ID, &dp.ProductID, &dp.RatePerUnit, &dp.Unit, &dp.MinCharge)
	if err != nil {
		return nil, nil
	}
	return &dp, nil
}

func (r *PricingRepository) GetAddOns(ctx context.Context, productID uuid.UUID) ([]models.AddOn, error) {
	query := `SELECT id, product_id, name, type, price_modifier, enabled FROM add_ons WHERE product_id = $1 AND enabled = true`
	rows, err := r.db.Query(ctx, query, productID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var addOns []models.AddOn
	for rows.Next() {
		var a models.AddOn
		if err := rows.Scan(&a.ID, &a.ProductID, &a.Name, &a.Type, &a.PriceModifier, &a.Enabled); err != nil {
			return nil, err
		}
		addOns = append(addOns, a)
	}
	return addOns, nil
}

func (r *PricingRepository) GetPricingRules(ctx context.Context, productID uuid.UUID) ([]models.PricingRule, error) {
	query := `SELECT id, product_id, rule_type, value, description FROM pricing_rules WHERE product_id = $1`
	rows, err := r.db.Query(ctx, query, productID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var rules []models.PricingRule
	for rows.Next() {
		var pr models.PricingRule
		if err := rows.Scan(&pr.ID, &pr.ProductID, &pr.RuleType, &pr.Value, &pr.Description); err != nil {
			return nil, err
		}
		rules = append(rules, pr)
	}
	return rules, nil
}

func (r *PricingRepository) CreatePricingTier(ctx context.Context, productID uuid.UUID, tier *models.PricingTier) error {
	query := `INSERT INTO pricing_tiers (id, product_id, min_qty, max_qty, price) VALUES ($1, $2, $3, $4, $5)`
	tier.ID = uuid.New()
	tier.ProductID = productID
	_, err := r.db.Exec(ctx, query, tier.ID, tier.ProductID, tier.MinQty, tier.MaxQty, tier.Price)
	return err
}

func (r *PricingRepository) CreateDimensionalPricing(ctx context.Context, productID uuid.UUID, dp *models.DimensionalPricing) error {
	// Delete existing first
	r.db.Exec(ctx, `DELETE FROM dimensional_pricing WHERE product_id = $1`, productID)
	
	query := `INSERT INTO dimensional_pricing (id, product_id, rate_per_unit, unit, min_charge) VALUES ($1, $2, $3, $4, $5)`
	dp.ID = uuid.New()
	dp.ProductID = productID
	_, err := r.db.Exec(ctx, query, dp.ID, dp.ProductID, dp.RatePerUnit, dp.Unit, dp.MinCharge)
	return err
}

func (r *PricingRepository) DeletePricingTiers(ctx context.Context, productID uuid.UUID) error {
	_, err := r.db.Exec(ctx, `DELETE FROM pricing_tiers WHERE product_id = $1`, productID)
	return err
}

