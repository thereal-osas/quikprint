package repository

import (
	"context"
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/quikprint/backend/internal/models"
)

type CartRepository struct {
	db *pgxpool.Pool
}

func NewCartRepository(db *pgxpool.Pool) *CartRepository {
	return &CartRepository{db: db}
}

func (r *CartRepository) AddItem(ctx context.Context, item *models.CartItem) error {
	query := `
		INSERT INTO cart_items (id, user_id, product_id, quantity, configuration, total_price, uploaded_file, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`
	item.ID = uuid.New()
	item.CreatedAt = time.Now()
	item.UpdatedAt = time.Now()

	configJSON, _ := json.Marshal(item.Configuration)

	_, err := r.db.Exec(ctx, query,
		item.ID, item.UserID, item.ProductID, item.Quantity, configJSON,
		item.TotalPrice, item.UploadedFile, item.CreatedAt, item.UpdatedAt,
	)
	return err
}

func (r *CartRepository) GetByUserID(ctx context.Context, userID uuid.UUID) ([]models.CartItem, error) {
	query := `
		SELECT ci.id, ci.user_id, ci.product_id, ci.quantity, ci.configuration, 
			   ci.total_price, ci.uploaded_file, ci.created_at, ci.updated_at
		FROM cart_items ci
		WHERE ci.user_id = $1
		ORDER BY ci.created_at DESC
	`
	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []models.CartItem
	for rows.Next() {
		var item models.CartItem
		var configJSON []byte
		if err := rows.Scan(
			&item.ID, &item.UserID, &item.ProductID, &item.Quantity, &configJSON,
			&item.TotalPrice, &item.UploadedFile, &item.CreatedAt, &item.UpdatedAt,
		); err != nil {
			return nil, err
		}
		json.Unmarshal(configJSON, &item.Configuration)
		items = append(items, item)
	}
	return items, nil
}

func (r *CartRepository) GetItemByID(ctx context.Context, id uuid.UUID, userID uuid.UUID) (*models.CartItem, error) {
	query := `
		SELECT id, user_id, product_id, quantity, configuration, total_price, uploaded_file, created_at, updated_at
		FROM cart_items WHERE id = $1 AND user_id = $2
	`
	var item models.CartItem
	var configJSON []byte
	err := r.db.QueryRow(ctx, query, id, userID).Scan(
		&item.ID, &item.UserID, &item.ProductID, &item.Quantity, &configJSON,
		&item.TotalPrice, &item.UploadedFile, &item.CreatedAt, &item.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	json.Unmarshal(configJSON, &item.Configuration)
	return &item, nil
}

func (r *CartRepository) UpdateItem(ctx context.Context, item *models.CartItem) error {
	query := `
		UPDATE cart_items SET quantity = $2, configuration = $3, total_price = $4, updated_at = $5
		WHERE id = $1
	`
	item.UpdatedAt = time.Now()
	configJSON, _ := json.Marshal(item.Configuration)
	_, err := r.db.Exec(ctx, query, item.ID, item.Quantity, configJSON, item.TotalPrice, item.UpdatedAt)
	return err
}

func (r *CartRepository) DeleteItem(ctx context.Context, id uuid.UUID, userID uuid.UUID) error {
	_, err := r.db.Exec(ctx, `DELETE FROM cart_items WHERE id = $1 AND user_id = $2`, id, userID)
	return err
}

func (r *CartRepository) ClearCart(ctx context.Context, userID uuid.UUID) error {
	_, err := r.db.Exec(ctx, `DELETE FROM cart_items WHERE user_id = $1`, userID)
	return err
}

