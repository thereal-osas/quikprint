package repository

import (
	"context"
	"database/sql"
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

	// Handle empty paystack_response - use NULL instead of empty string for JSONB field
	var paystackResponse interface{} = nil
	if payment.PaystackResponse != "" {
		paystackResponse = payment.PaystackResponse
	}

	_, err := r.db.Exec(ctx, query,
		payment.ID, payment.OrderID, payment.PaystackRef, payment.Amount, payment.Currency,
		payment.Status, paystackResponse, payment.CreatedAt, payment.UpdatedAt,
	)
	return err
}

func (r *PaymentRepository) GetByReference(ctx context.Context, ref string) (*models.Payment, error) {
	query := `
		SELECT id, order_id, paystack_ref, amount, currency, status, paystack_response, created_at, updated_at
		FROM payments WHERE paystack_ref = $1
	`
	var p models.Payment
	var paystackResponse sql.NullString
	err := r.db.QueryRow(ctx, query, ref).Scan(
		&p.ID, &p.OrderID, &p.PaystackRef, &p.Amount, &p.Currency,
		&p.Status, &paystackResponse, &p.CreatedAt, &p.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if paystackResponse.Valid {
		p.PaystackResponse = paystackResponse.String
	}
	return &p, err
}

func (r *PaymentRepository) GetByOrderID(ctx context.Context, orderID uuid.UUID) (*models.Payment, error) {
	query := `
		SELECT id, order_id, paystack_ref, amount, currency, status, paystack_response, created_at, updated_at
		FROM payments WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1
	`
	var p models.Payment
	var paystackResponse sql.NullString
	err := r.db.QueryRow(ctx, query, orderID).Scan(
		&p.ID, &p.OrderID, &p.PaystackRef, &p.Amount, &p.Currency,
		&p.Status, &paystackResponse, &p.CreatedAt, &p.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if paystackResponse.Valid {
		p.PaystackResponse = paystackResponse.String
	}
	return &p, err
}

func (r *PaymentRepository) UpdateStatus(ctx context.Context, ref string, status models.PaymentStatus, response string) error {
	query := `UPDATE payments SET status = $2, paystack_response = $3, updated_at = $4 WHERE paystack_ref = $1`
	_, err := r.db.Exec(ctx, query, ref, status, response, time.Now())
	return err
}

func (r *PaymentRepository) GetAllPayments(ctx context.Context) ([]models.Payment, error) {
	query := `
		SELECT id, order_id, paystack_ref, amount, currency, status, paystack_response, created_at, updated_at
		FROM payments
		ORDER BY created_at DESC
	`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var payments []models.Payment
	for rows.Next() {
		var p models.Payment
		var paystackResponse sql.NullString
		err := rows.Scan(
			&p.ID, &p.OrderID, &p.PaystackRef, &p.Amount, &p.Currency,
			&p.Status, &paystackResponse, &p.CreatedAt, &p.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		// Handle NULL paystack_response
		if paystackResponse.Valid {
			p.PaystackResponse = paystackResponse.String
		}

		payments = append(payments, p)
	}

	return payments, nil
}
