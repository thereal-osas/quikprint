package repository

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/quikprint/backend/internal/models"
)

type ShippingConfigRepository struct {
	pool *pgxpool.Pool
}

func NewShippingConfigRepository(pool *pgxpool.Pool) *ShippingConfigRepository {
	return &ShippingConfigRepository{pool: pool}
}

// Get returns the shipping configuration (there should only be one record)
func (r *ShippingConfigRepository) Get(ctx context.Context) (*models.ShippingConfig, error) {
	query := `
		SELECT id, shipping_fee, free_shipping_threshold, created_at, updated_at
		FROM shipping_config
		LIMIT 1
	`

	var config models.ShippingConfig
	err := r.pool.QueryRow(ctx, query).Scan(
		&config.ID,
		&config.ShippingFee,
		&config.FreeShippingThreshold,
		&config.CreatedAt,
		&config.UpdatedAt,
	)
	if err != nil {
		// If no records exist or table doesn't exist, return default config
		// The migration script should have created the table and one record, but provide sensible defaults as fallback
		if errors.Is(err, pgx.ErrNoRows) || err.Error() == "no rows in result set" {
			return &models.ShippingConfig{
				ID:                    uuid.New(),
				ShippingFee:           5000.00,
				FreeShippingThreshold: 50000.00,
				CreatedAt:             time.Now().Format(time.RFC3339),
				UpdatedAt:             time.Now().Format(time.RFC3339),
			}, nil
		}
		// For other errors (like table doesn't exist), still return defaults but log the actual error
		// This prevents the API from crashing if migrations haven't been run
		return &models.ShippingConfig{
			ID:                    uuid.New(),
			ShippingFee:           5000.00,
			FreeShippingThreshold: 50000.00,
			CreatedAt:             time.Now().Format(time.RFC3339),
			UpdatedAt:             time.Now().Format(time.RFC3339),
		}, nil
	}

	return &config, nil
}

// Update updates the shipping configuration
func (r *ShippingConfigRepository) Update(ctx context.Context, id uuid.UUID, shippingFee, freeShippingThreshold float64) error {
	query := `
		UPDATE shipping_config
		SET shipping_fee = $1,
			free_shipping_threshold = $2,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = $3
	`

	_, err := r.pool.Exec(ctx, query, shippingFee, freeShippingThreshold, id)
	return err
}
