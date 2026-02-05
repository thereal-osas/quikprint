package repository

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/quikprint/backend/internal/models"
)

type ProductRepository struct {
	db *pgxpool.Pool
}

func NewProductRepository(db *pgxpool.Pool) *ProductRepository {
	return &ProductRepository{db: db}
}

func (r *ProductRepository) Create(ctx context.Context, product *models.Product) error {
	query := `
		INSERT INTO products (id, name, slug, category_id, description, short_description, 
			base_price, images, options, features, turnaround, min_quantity, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
	`
	product.ID = uuid.New()
	product.CreatedAt = time.Now()
	product.UpdatedAt = time.Now()

	imagesJSON, _ := json.Marshal(product.Images)
	optionsJSON, _ := json.Marshal(product.Options)
	featuresJSON, _ := json.Marshal(product.Features)

	_, err := r.db.Exec(ctx, query,
		product.ID, product.Name, product.Slug, product.CategoryID, product.Description,
		product.ShortDescription, product.BasePrice, imagesJSON, optionsJSON, featuresJSON,
		product.Turnaround, product.MinQuantity, product.CreatedAt, product.UpdatedAt,
	)
	return err
}

func (r *ProductRepository) GetAll(ctx context.Context, categorySlug string) ([]models.Product, error) {
	query := `
		SELECT p.id, p.name, p.slug, p.category_id, c.name, c.slug, p.description, 
			   p.short_description, p.base_price, p.images, p.options, p.features, 
			   p.turnaround, p.min_quantity, p.created_at, p.updated_at
		FROM products p
		JOIN categories c ON c.id = p.category_id
	`
	args := []interface{}{}
	if categorySlug != "" {
		query += " WHERE c.slug = $1"
		args = append(args, categorySlug)
	}
	query += " ORDER BY p.name"

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return r.scanProducts(rows)
}

func (r *ProductRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Product, error) {
	query := `
		SELECT p.id, p.name, p.slug, p.category_id, c.name, c.slug, p.description, 
			   p.short_description, p.base_price, p.images, p.options, p.features, 
			   p.turnaround, p.min_quantity, p.created_at, p.updated_at
		FROM products p
		JOIN categories c ON c.id = p.category_id
		WHERE p.id = $1
	`
	return r.scanProduct(r.db.QueryRow(ctx, query, id))
}

func (r *ProductRepository) GetBySlug(ctx context.Context, slug string) (*models.Product, error) {
	query := `
		SELECT p.id, p.name, p.slug, p.category_id, c.name, c.slug, p.description, 
			   p.short_description, p.base_price, p.images, p.options, p.features, 
			   p.turnaround, p.min_quantity, p.created_at, p.updated_at
		FROM products p
		JOIN categories c ON c.id = p.category_id
		WHERE p.slug = $1
	`
	return r.scanProduct(r.db.QueryRow(ctx, query, slug))
}

func (r *ProductRepository) Update(ctx context.Context, product *models.Product) error {
	query := `
		UPDATE products SET name = $2, slug = $3, category_id = $4, description = $5,
			short_description = $6, base_price = $7, images = $8, options = $9, features = $10,
			turnaround = $11, min_quantity = $12, updated_at = $13
		WHERE id = $1
	`
	product.UpdatedAt = time.Now()
	imagesJSON, _ := json.Marshal(product.Images)
	optionsJSON, _ := json.Marshal(product.Options)
	featuresJSON, _ := json.Marshal(product.Features)

	_, err := r.db.Exec(ctx, query,
		product.ID, product.Name, product.Slug, product.CategoryID, product.Description,
		product.ShortDescription, product.BasePrice, imagesJSON, optionsJSON, featuresJSON,
		product.Turnaround, product.MinQuantity, product.UpdatedAt,
	)
	return err
}

func (r *ProductRepository) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.Exec(ctx, `DELETE FROM products WHERE id = $1`, id)
	return err
}

func (r *ProductRepository) scanProduct(row pgx.Row) (*models.Product, error) {
	var p models.Product
	var imagesJSON, optionsJSON, featuresJSON []byte

	err := row.Scan(
		&p.ID, &p.Name, &p.Slug, &p.CategoryID, &p.Category, &p.CategorySlug,
		&p.Description, &p.ShortDescription, &p.BasePrice, &imagesJSON, &optionsJSON,
		&featuresJSON, &p.Turnaround, &p.MinQuantity, &p.CreatedAt, &p.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	json.Unmarshal(imagesJSON, &p.Images)
	json.Unmarshal(optionsJSON, &p.Options)
	json.Unmarshal(featuresJSON, &p.Features)

	return &p, nil
}

func (r *ProductRepository) scanProducts(rows pgx.Rows) ([]models.Product, error) {
	var products []models.Product
	for rows.Next() {
		var p models.Product
		var imagesJSON, optionsJSON, featuresJSON []byte
		if err := rows.Scan(
			&p.ID, &p.Name, &p.Slug, &p.CategoryID, &p.Category, &p.CategorySlug,
			&p.Description, &p.ShortDescription, &p.BasePrice, &imagesJSON, &optionsJSON,
			&featuresJSON, &p.Turnaround, &p.MinQuantity, &p.CreatedAt, &p.UpdatedAt,
		); err != nil {
			return nil, err
		}
		json.Unmarshal(imagesJSON, &p.Images)
		json.Unmarshal(optionsJSON, &p.Options)
		json.Unmarshal(featuresJSON, &p.Features)
		products = append(products, p)
	}
	return products, nil
}

