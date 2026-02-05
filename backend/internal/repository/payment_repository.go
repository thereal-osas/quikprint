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

type PaymentRepository struct {
	db *pgxpool.Pool
}

func NewPaymentRepository(db *pgxpool.Pool) *PaymentRepository {
	return &PaymentRepository{db: db}
}

func (r *PaymentRepository) Create(ctx context.Context, payment *models.Payment) error {
	query := `
		INSERT INTO payments (id, order_id, paystack_ref, amount, currency, status, paystack_response, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`
	payment.ID = uuid.New()
	payment.CreatedAt = time.Now()
	payment.UpdatedAt = time.Now()

	_, err := r.db.Exec(ctx, query,
		payment.ID, payment.OrderID, payment.PaystackRef, payment.Amount, payment.Currency,
		payment.Status, payment.PaystackResponse, payment.CreatedAt, payment.UpdatedAt,
	)
	return err
}

func (r *PaymentRepository) GetByReference(ctx context.Context, ref string) (*models.Payment, error) {
	query := `
		SELECT id, order_id, paystack_ref, amount, currency, status, paystack_response, created_at, updated_at
		FROM payments WHERE paystack_ref = $1
	`
	var p models.Payment
	err := r.db.QueryRow(ctx, query, ref).Scan(
		&p.ID, &p.OrderID, &p.PaystackRef, &p.Amount, &p.Currency,
		&p.Status, &p.PaystackResponse, &p.CreatedAt, &p.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	return &p, err
}

func (r *PaymentRepository) GetByOrderID(ctx context.Context, orderID uuid.UUID) (*models.Payment, error) {
	query := `
		SELECT id, order_id, paystack_ref, amount, currency, status, paystack_response, created_at, updated_at
		FROM payments WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1
	`
	var p models.Payment
	err := r.db.QueryRow(ctx, query, orderID).Scan(
		&p.ID, &p.OrderID, &p.PaystackRef, &p.Amount, &p.Currency,
		&p.Status, &p.PaystackResponse, &p.CreatedAt, &p.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	return &p, err
}

func (r *PaymentRepository) UpdateStatus(ctx context.Context, ref string, status models.PaymentStatus, response string) error {
	query := `UPDATE payments SET status = $2, paystack_response = $3, updated_at = $4 WHERE paystack_ref = $1`
	_, err := r.db.Exec(ctx, query, ref, status, response, time.Now())
	return err
}

