package repository

import (
	"context"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/quikprint/backend/internal/models"
)

type CouponRepository struct {
	db *pgxpool.Pool
}

func NewCouponRepository(db *pgxpool.Pool) *CouponRepository {
	return &CouponRepository{db: db}
}

func (r *CouponRepository) Create(ctx context.Context, coupon *models.Coupon) error {
	query := `
		INSERT INTO coupons (id, code, description, discount_type, discount_value, min_order_amount, 
			max_discount_amount, usage_limit, used_count, per_user_limit, valid_from, valid_until, 
			is_active, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
	`
	coupon.ID = uuid.New()
	coupon.UsedCount = 0
	coupon.CreatedAt = time.Now()
	coupon.UpdatedAt = time.Now()

	_, err := r.db.Exec(ctx, query,
		coupon.ID, strings.ToUpper(coupon.Code), coupon.Description, coupon.DiscountType,
		coupon.DiscountValue, coupon.MinOrderAmount, coupon.MaxDiscountAmount, coupon.UsageLimit,
		coupon.UsedCount, coupon.PerUserLimit, coupon.ValidFrom, coupon.ValidUntil,
		coupon.IsActive, coupon.CreatedAt, coupon.UpdatedAt,
	)
	return err
}

func (r *CouponRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Coupon, error) {
	query := `
		SELECT id, code, description, discount_type, discount_value, min_order_amount, 
			max_discount_amount, usage_limit, used_count, per_user_limit, valid_from, valid_until, 
			is_active, created_at, updated_at
		FROM coupons WHERE id = $1
	`
	var coupon models.Coupon
	err := r.db.QueryRow(ctx, query, id).Scan(
		&coupon.ID, &coupon.Code, &coupon.Description, &coupon.DiscountType,
		&coupon.DiscountValue, &coupon.MinOrderAmount, &coupon.MaxDiscountAmount,
		&coupon.UsageLimit, &coupon.UsedCount, &coupon.PerUserLimit, &coupon.ValidFrom,
		&coupon.ValidUntil, &coupon.IsActive, &coupon.CreatedAt, &coupon.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &coupon, nil
}

func (r *CouponRepository) GetByCode(ctx context.Context, code string) (*models.Coupon, error) {
	query := `
		SELECT id, code, description, discount_type, discount_value, min_order_amount, 
			max_discount_amount, usage_limit, used_count, per_user_limit, valid_from, valid_until, 
			is_active, created_at, updated_at
		FROM coupons WHERE UPPER(code) = UPPER($1)
	`
	var coupon models.Coupon
	err := r.db.QueryRow(ctx, query, code).Scan(
		&coupon.ID, &coupon.Code, &coupon.Description, &coupon.DiscountType,
		&coupon.DiscountValue, &coupon.MinOrderAmount, &coupon.MaxDiscountAmount,
		&coupon.UsageLimit, &coupon.UsedCount, &coupon.PerUserLimit, &coupon.ValidFrom,
		&coupon.ValidUntil, &coupon.IsActive, &coupon.CreatedAt, &coupon.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &coupon, nil
}

func (r *CouponRepository) GetAll(ctx context.Context) ([]models.Coupon, error) {
	query := `
		SELECT id, code, description, discount_type, discount_value, min_order_amount, 
			max_discount_amount, usage_limit, used_count, per_user_limit, valid_from, valid_until, 
			is_active, created_at, updated_at
		FROM coupons ORDER BY created_at DESC
	`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var coupons []models.Coupon
	for rows.Next() {
		var coupon models.Coupon
		if err := rows.Scan(
			&coupon.ID, &coupon.Code, &coupon.Description, &coupon.DiscountType,
			&coupon.DiscountValue, &coupon.MinOrderAmount, &coupon.MaxDiscountAmount,
			&coupon.UsageLimit, &coupon.UsedCount, &coupon.PerUserLimit, &coupon.ValidFrom,
			&coupon.ValidUntil, &coupon.IsActive, &coupon.CreatedAt, &coupon.UpdatedAt,
		); err != nil {
			return nil, err
		}
		coupons = append(coupons, coupon)
	}
	return coupons, nil
}

func (r *CouponRepository) Update(ctx context.Context, coupon *models.Coupon) error {
	query := `
		UPDATE coupons SET description = $2, discount_type = $3, discount_value = $4, 
			min_order_amount = $5, max_discount_amount = $6, usage_limit = $7, per_user_limit = $8, 
			valid_from = $9, valid_until = $10, is_active = $11, updated_at = $12
		WHERE id = $1
	`
	coupon.UpdatedAt = time.Now()
	_, err := r.db.Exec(ctx, query,
		coupon.ID, coupon.Description, coupon.DiscountType, coupon.DiscountValue,
		coupon.MinOrderAmount, coupon.MaxDiscountAmount, coupon.UsageLimit, coupon.PerUserLimit,
		coupon.ValidFrom, coupon.ValidUntil, coupon.IsActive, coupon.UpdatedAt,
	)
	return err
}

func (r *CouponRepository) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.Exec(ctx, `DELETE FROM coupons WHERE id = $1`, id)
	return err
}

func (r *CouponRepository) IncrementUsedCount(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.Exec(ctx, `UPDATE coupons SET used_count = used_count + 1, updated_at = $2 WHERE id = $1`, id, time.Now())
	return err
}

// GetUserUsageCount returns the number of times a user has used a specific coupon
func (r *CouponRepository) GetUserUsageCount(ctx context.Context, couponID, userID uuid.UUID) (int, error) {
	var count int
	err := r.db.QueryRow(ctx,
		`SELECT COUNT(*) FROM coupon_usage WHERE coupon_id = $1 AND user_id = $2`,
		couponID, userID,
	).Scan(&count)
	return count, err
}

// RecordUsage records a coupon usage
func (r *CouponRepository) RecordUsage(ctx context.Context, usage *models.CouponUsage) error {
	query := `
		INSERT INTO coupon_usage (id, coupon_id, user_id, order_id, discount_amount, used_at)
		VALUES ($1, $2, $3, $4, $5, $6)
	`
	usage.ID = uuid.New()
	usage.UsedAt = time.Now()
	_, err := r.db.Exec(ctx, query,
		usage.ID, usage.CouponID, usage.UserID, usage.OrderID, usage.DiscountAmount, usage.UsedAt,
	)
	return err
}
