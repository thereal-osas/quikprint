package repository

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/quikprint/backend/internal/models"
)

type OrderRepository struct {
	db *pgxpool.Pool
}

func NewOrderRepository(db *pgxpool.Pool) *OrderRepository {
	return &OrderRepository{db: db}
}

func (r *OrderRepository) Create(ctx context.Context, order *models.Order) error {
	order.ID = uuid.New()
	order.CreatedAt = time.Now()
	order.UpdatedAt = time.Now()

	// Try to create order with discount column first
	err := r.createOrderWithSchema(ctx, order, true)
	if err != nil {
		// Check if this is a discount column not found error, if so try without discount column
		if contains(err.Error(), "discount") {
			fmt.Printf("DEBUG: Discount column not found, retrying without discount\n")
			err = r.createOrderWithSchema(ctx, order, false)
		}
		if err != nil {
			fmt.Printf("DEBUG: Order creation failed: %v\n", err)
			return err
		}
	}
	return nil
}

func (r *OrderRepository) createOrderWithSchema(ctx context.Context, order *models.Order, includeDiscount bool) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Generate order number
	var orderNumber string
	err = tx.QueryRow(ctx, `SELECT generate_order_number()`).Scan(&orderNumber)
	if err != nil {
		return err
	}
	order.OrderNumber = orderNumber

	var orderQuery string
	var queryArgs []interface{}

	if includeDiscount {
		orderQuery = `
			INSERT INTO orders (id, order_number, user_id, status, subtotal, discount, shipping, tax, total,
				shipping_name, shipping_street, shipping_city, shipping_state, shipping_zip, shipping_country,
				created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
		`
		queryArgs = []interface{}{
			order.ID, order.OrderNumber, order.UserID, order.Status, order.Subtotal, order.Discount, order.Shipping, order.Tax, order.Total,
			order.ShippingAddress.Name, order.ShippingAddress.Street, order.ShippingAddress.City,
			order.ShippingAddress.State, order.ShippingAddress.Zip, order.ShippingAddress.Country,
			order.CreatedAt, order.UpdatedAt,
		}
	} else {
		orderQuery = `
			INSERT INTO orders (id, order_number, user_id, status, subtotal, shipping, tax, total,
				shipping_name, shipping_street, shipping_city, shipping_state, shipping_zip, shipping_country,
				created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
		`
		queryArgs = []interface{}{
			order.ID, order.OrderNumber, order.UserID, order.Status, order.Subtotal, order.Shipping, order.Tax, order.Total,
			order.ShippingAddress.Name, order.ShippingAddress.Street, order.ShippingAddress.City,
			order.ShippingAddress.State, order.ShippingAddress.Zip, order.ShippingAddress.Country,
			order.CreatedAt, order.UpdatedAt,
		}
	}

	_, err = tx.Exec(ctx, orderQuery, queryArgs...)
	if err != nil {
		return err
	}

	// Insert order items
	itemQuery := `
		INSERT INTO order_items (id, order_id, product_id, quantity, configuration, unit_price, total_price, uploaded_file)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`
	for i := range order.Items {
		order.Items[i].ID = uuid.New()
		order.Items[i].OrderID = order.ID
		configJSON, _ := json.Marshal(order.Items[i].Configuration)
		_, err = tx.Exec(ctx, itemQuery,
			order.Items[i].ID, order.ID, order.Items[i].ProductID, order.Items[i].Quantity,
			configJSON, order.Items[i].UnitPrice, order.Items[i].TotalPrice, order.Items[i].UploadedFile,
		)
		if err != nil {
			return err
		}
	}

	// Add initial status history
	historyQuery := `
		INSERT INTO order_status_history (id, order_id, status, created_by, created_at)
		VALUES ($1, $2, $3, $4, $5)
	`
	_, err = tx.Exec(ctx, historyQuery, uuid.New(), order.ID, order.Status, order.UserID, time.Now())
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func contains(s, substr string) bool {
	return len(s) > 0 && len(substr) > 0 && (s == substr || len(s) > len(substr) && (s[:len(substr)] == substr || s[len(s)-len(substr):] == substr || findSubstring(s, substr)))
}

func findSubstring(s, substr string) bool {
	for i := 0; i < len(s)-len(substr)+1; i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}

func (r *OrderRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Order, error) {
	// Try with discount column first
	query := `
		SELECT id, order_number, user_id, status, subtotal, discount, shipping, tax, total,
			shipping_name, shipping_street, shipping_city, shipping_state, shipping_zip, shipping_country,
			created_at, updated_at
		FROM orders WHERE id = $1
	`
	order, err := r.scanOrder(r.db.QueryRow(ctx, query, id))
	if err != nil {
		// If discount column error, try without discount
		if contains(err.Error(), "discount") {
			queryFallback := `
				SELECT id, order_number, user_id, status, subtotal, 0::decimal, shipping, tax, total,
					shipping_name, shipping_street, shipping_city, shipping_state, shipping_zip, shipping_country,
					created_at, updated_at
				FROM orders WHERE id = $1
			`
			order, err = r.scanOrder(r.db.QueryRow(ctx, queryFallback, id))
		}
		if err != nil || order == nil {
			return order, err
		}
	}

	items, err := r.getOrderItems(ctx, order.ID)
	if err != nil {
		return nil, err
	}
	order.Items = items
	return order, nil
}

func (r *OrderRepository) GetByUserID(ctx context.Context, userID uuid.UUID) ([]models.Order, error) {
	query := `
		SELECT id, order_number, user_id, status, subtotal, discount, shipping, tax, total,
			shipping_name, shipping_street, shipping_city, shipping_state, shipping_zip, shipping_country,
			created_at, updated_at
		FROM orders WHERE user_id = $1 ORDER BY created_at DESC
	`
	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		// Try without discount
		if contains(err.Error(), "discount") {
			queryFallback := `
				SELECT id, order_number, user_id, status, subtotal, 0::decimal, shipping, tax, total,
					shipping_name, shipping_street, shipping_city, shipping_state, shipping_zip, shipping_country,
					created_at, updated_at
				FROM orders WHERE user_id = $1 ORDER BY created_at DESC
			`
			rows, err = r.db.Query(ctx, queryFallback, userID)
		}
		if err != nil {
			return nil, err
		}
	}
	defer rows.Close()

	orders, err := r.scanOrders(rows)
	if err != nil {
		return nil, err
	}

	// Load items for each order
	for i := range orders {
		items, err := r.getOrderItems(ctx, orders[i].ID)
		if err != nil {
			// Log error but continue loading other orders
			fmt.Printf("ERROR: Failed to load items for order %s: %v\n", orders[i].ID, err)
			orders[i].Items = []models.OrderItem{}
		} else {
			orders[i].Items = items
		}
	}

	return orders, nil
}

func (r *OrderRepository) GetAll(ctx context.Context, status string) ([]models.Order, error) {
	query := `
		SELECT id, order_number, user_id, status, subtotal, discount, shipping, tax, total,
			shipping_name, shipping_street, shipping_city, shipping_state, shipping_zip, shipping_country,
			created_at, updated_at
		FROM orders
	`
	args := []interface{}{}
	if status != "" {
		query += " WHERE status = $1"
		args = append(args, status)
	}
	query += " ORDER BY created_at DESC"

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		// Try without discount
		if contains(err.Error(), "discount") {
			query = `
				SELECT id, order_number, user_id, status, subtotal, 0::decimal, shipping, tax, total,
					shipping_name, shipping_street, shipping_city, shipping_state, shipping_zip, shipping_country,
					created_at, updated_at
				FROM orders
			`
			args = []interface{}{}
			if status != "" {
				query += " WHERE status = $1"
				args = append(args, status)
			}
			query += " ORDER BY created_at DESC"
			rows, err = r.db.Query(ctx, query, args...)
		}
		if err != nil {
			return nil, err
		}
	}
	defer rows.Close()

	orders, err := r.scanOrders(rows)
	if err != nil {
		return nil, err
	}

	// Load items for each order
	for i := range orders {
		items, err := r.getOrderItems(ctx, orders[i].ID)
		if err != nil {
			// Log error but continue loading other orders
			fmt.Printf("ERROR: Failed to load items for order %s: %v\n", orders[i].ID, err)
			orders[i].Items = []models.OrderItem{}
		} else {
			orders[i].Items = items
		}
	}

	return orders, nil
}

// GetAllAdmin returns orders with user information for admin views
func (r *OrderRepository) GetAllAdmin(ctx context.Context, status string) ([]models.AdminOrderResponse, error) {
	query := `
		SELECT o.id, o.order_number, o.user_id, o.status, o.subtotal, o.discount, o.shipping, o.tax, o.total,
			o.shipping_name, o.shipping_street, o.shipping_city, o.shipping_state, o.shipping_zip, o.shipping_country,
			o.created_at, o.updated_at,
			u.email as user_email, u.first_name, u.last_name
		FROM orders o
		JOIN users u ON o.user_id = u.id
	`
	args := []interface{}{}
	if status != "" {
		query += " WHERE o.status = $1"
		args = append(args, status)
	}
	query += " ORDER BY o.created_at DESC"

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		// Try without discount
		if contains(err.Error(), "discount") {
			query = `
				SELECT o.id, o.order_number, o.user_id, o.status, o.subtotal, 0::decimal, o.shipping, o.tax, o.total,
					o.shipping_name, o.shipping_street, o.shipping_city, o.shipping_state, o.shipping_zip, o.shipping_country,
					o.created_at, o.updated_at,
					u.email as user_email, u.first_name, u.last_name
				FROM orders o
				JOIN users u ON o.user_id = u.id
			`
			args = []interface{}{}
			if status != "" {
				query += " WHERE o.status = $1"
				args = append(args, status)
			}
			query += " ORDER BY o.created_at DESC"
			rows, err = r.db.Query(ctx, query, args...)
		}
		if err != nil {
			return nil, err
		}
	}
	defer rows.Close()

	var orders []models.AdminOrderResponse
	for rows.Next() {
		var o models.AdminOrderResponse
		var firstName, lastName sql.NullString
		if err := rows.Scan(
			&o.ID, &o.OrderNumber, &o.UserID, &o.Status, &o.Subtotal, &o.Discount, &o.Shipping, &o.Tax, &o.Total,
			&o.ShippingAddress.Name, &o.ShippingAddress.Street, &o.ShippingAddress.City,
			&o.ShippingAddress.State, &o.ShippingAddress.Zip, &o.ShippingAddress.Country,
			&o.CreatedAt, &o.UpdatedAt,
			&o.UserEmail, &firstName, &lastName,
		); err != nil {
			return nil, err
		}
		if firstName.Valid && lastName.Valid {
			o.CustomerName = firstName.String + " " + lastName.String
		}
		o.CustomerEmail = o.UserEmail
		orders = append(orders, o)
	}
	return orders, nil
}

// GetUserOrderStats returns aggregated order stats for a user
// Only counts PAID orders for total_spent
func (r *OrderRepository) GetUserOrderStats(ctx context.Context, userID uuid.UUID) (*models.UserOrderStats, error) {
	query := `
		SELECT COUNT(*) as total_orders, COALESCE(SUM(total), 0) as total_spent
		FROM orders
		WHERE user_id = $1 AND status = 'paid'
	`
	var stats models.UserOrderStats
	err := r.db.QueryRow(ctx, query, userID).Scan(&stats.TotalOrders, &stats.TotalSpent)
	if err != nil {
		return nil, err
	}
	return &stats, nil
}

func (r *OrderRepository) UpdateStatus(ctx context.Context, orderID uuid.UUID, status models.OrderStatus, note string, userID uuid.UUID) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	_, err = tx.Exec(ctx, `UPDATE orders SET status = $2, updated_at = $3 WHERE id = $1`, orderID, status, time.Now())
	if err != nil {
		return err
	}

	_, err = tx.Exec(ctx,
		`INSERT INTO order_status_history (id, order_id, status, note, created_by, created_at) VALUES ($1, $2, $3, $4, $5, $6)`,
		uuid.New(), orderID, status, note, userID, time.Now(),
	)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func (r *OrderRepository) AddNote(ctx context.Context, orderID uuid.UUID, note string, userID uuid.UUID) error {
	query := `INSERT INTO order_notes (id, order_id, note, created_by, created_at) VALUES ($1, $2, $3, $4, $5)`
	_, err := r.db.Exec(ctx, query, uuid.New(), orderID, note, userID, time.Now())
	return err
}

func (r *OrderRepository) GetNotes(ctx context.Context, orderID uuid.UUID) ([]models.OrderNote, error) {
	query := `SELECT id, order_id, note, created_by, created_at FROM order_notes WHERE order_id = $1 ORDER BY created_at DESC`
	rows, err := r.db.Query(ctx, query, orderID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var notes []models.OrderNote
	for rows.Next() {
		var n models.OrderNote
		if err := rows.Scan(&n.ID, &n.OrderID, &n.Note, &n.CreatedBy, &n.CreatedAt); err != nil {
			return nil, err
		}
		notes = append(notes, n)
	}
	return notes, nil
}

func (r *OrderRepository) getOrderItems(ctx context.Context, orderID uuid.UUID) ([]models.OrderItem, error) {
	query := `
		SELECT id, order_id, product_id, quantity, configuration, unit_price, total_price, uploaded_file
		FROM order_items WHERE order_id = $1
	`
	rows, err := r.db.Query(ctx, query, orderID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []models.OrderItem
	for rows.Next() {
		var item models.OrderItem
		var configJSON []byte
		if err := rows.Scan(
			&item.ID, &item.OrderID, &item.ProductID, &item.Quantity,
			&configJSON, &item.UnitPrice, &item.TotalPrice, &item.UploadedFile,
		); err != nil {
			return nil, err
		}
		json.Unmarshal(configJSON, &item.Configuration)
		items = append(items, item)
	}
	return items, nil
}

func (r *OrderRepository) scanOrder(row pgx.Row) (*models.Order, error) {
	var o models.Order
	err := row.Scan(
		&o.ID, &o.OrderNumber, &o.UserID, &o.Status, &o.Subtotal, &o.Discount, &o.Shipping, &o.Tax, &o.Total,
		&o.ShippingAddress.Name, &o.ShippingAddress.Street, &o.ShippingAddress.City,
		&o.ShippingAddress.State, &o.ShippingAddress.Zip, &o.ShippingAddress.Country,
		&o.CreatedAt, &o.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	return &o, err
}

func (r *OrderRepository) scanOrders(rows pgx.Rows) ([]models.Order, error) {
	var orders []models.Order
	for rows.Next() {
		var o models.Order
		if err := rows.Scan(
			&o.ID, &o.OrderNumber, &o.UserID, &o.Status, &o.Subtotal, &o.Discount, &o.Shipping, &o.Tax, &o.Total,
			&o.ShippingAddress.Name, &o.ShippingAddress.Street, &o.ShippingAddress.City,
			&o.ShippingAddress.State, &o.ShippingAddress.Zip, &o.ShippingAddress.Country,
			&o.CreatedAt, &o.UpdatedAt,
		); err != nil {
			return nil, err
		}
		orders = append(orders, o)
	}
	return orders, nil
}

func (r *OrderRepository) GetStatusHistory(ctx context.Context, orderID uuid.UUID) ([]models.OrderStatusHistory, error) {
	query := `SELECT id, order_id, status, COALESCE(note, ''), created_by, created_at FROM order_status_history WHERE order_id = $1 ORDER BY created_at DESC`
	rows, err := r.db.Query(ctx, query, orderID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var history []models.OrderStatusHistory
	for rows.Next() {
		var h models.OrderStatusHistory
		if err := rows.Scan(&h.ID, &h.OrderID, &h.Status, &h.Note, &h.CreatedBy, &h.CreatedAt); err != nil {
			return nil, err
		}
		history = append(history, h)
	}
	return history, nil
}

func (r *OrderRepository) GetByOrderNumber(ctx context.Context, orderNumber string) (*models.Order, error) {
	query := `
		SELECT id, order_number, user_id, status, subtotal, discount, shipping, tax, total,
			shipping_name, shipping_street, shipping_city, shipping_state, shipping_zip, shipping_country,
			created_at, updated_at
		FROM orders WHERE order_number = $1
	`
	order, err := r.scanOrder(r.db.QueryRow(ctx, query, orderNumber))
	if err != nil || order == nil {
		return order, err
	}

	items, err := r.getOrderItems(ctx, order.ID)
	if err != nil {
		return nil, err
	}
	order.Items = items
	return order, nil
}
