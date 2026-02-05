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

type CategoryRepository struct {
	db *pgxpool.Pool
}

func NewCategoryRepository(db *pgxpool.Pool) *CategoryRepository {
	return &CategoryRepository{db: db}
}

func (r *CategoryRepository) Create(ctx context.Context, category *models.Category) error {
	query := `
		INSERT INTO categories (id, name, slug, description, image, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`
	category.ID = uuid.New()
	category.CreatedAt = time.Now()
	category.UpdatedAt = time.Now()

	_, err := r.db.Exec(ctx, query,
		category.ID, category.Name, category.Slug, category.Description,
		category.Image, category.CreatedAt, category.UpdatedAt,
	)
	return err
}

func (r *CategoryRepository) GetAll(ctx context.Context) ([]models.Category, error) {
	query := `
		SELECT c.id, c.name, c.slug, c.description, c.image, c.created_at, c.updated_at,
			   COALESCE(COUNT(p.id), 0) as product_count
		FROM categories c
		LEFT JOIN products p ON p.category_id = c.id
		GROUP BY c.id
		ORDER BY c.name
	`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var categories []models.Category
	for rows.Next() {
		var cat models.Category
		if err := rows.Scan(
			&cat.ID, &cat.Name, &cat.Slug, &cat.Description, &cat.Image,
			&cat.CreatedAt, &cat.UpdatedAt, &cat.ProductCount,
		); err != nil {
			return nil, err
		}
		categories = append(categories, cat)
	}
	return categories, nil
}

func (r *CategoryRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Category, error) {
	query := `
		SELECT c.id, c.name, c.slug, c.description, c.image, c.created_at, c.updated_at,
			   COALESCE(COUNT(p.id), 0) as product_count
		FROM categories c
		LEFT JOIN products p ON p.category_id = c.id
		WHERE c.id = $1
		GROUP BY c.id
	`
	var cat models.Category
	err := r.db.QueryRow(ctx, query, id).Scan(
		&cat.ID, &cat.Name, &cat.Slug, &cat.Description, &cat.Image,
		&cat.CreatedAt, &cat.UpdatedAt, &cat.ProductCount,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	return &cat, err
}

func (r *CategoryRepository) GetBySlug(ctx context.Context, slug string) (*models.Category, error) {
	query := `
		SELECT c.id, c.name, c.slug, c.description, c.image, c.created_at, c.updated_at,
			   COALESCE(COUNT(p.id), 0) as product_count
		FROM categories c
		LEFT JOIN products p ON p.category_id = c.id
		WHERE c.slug = $1
		GROUP BY c.id
	`
	var cat models.Category
	err := r.db.QueryRow(ctx, query, slug).Scan(
		&cat.ID, &cat.Name, &cat.Slug, &cat.Description, &cat.Image,
		&cat.CreatedAt, &cat.UpdatedAt, &cat.ProductCount,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	return &cat, err
}

func (r *CategoryRepository) Update(ctx context.Context, category *models.Category) error {
	query := `
		UPDATE categories SET name = $2, slug = $3, description = $4, image = $5, updated_at = $6
		WHERE id = $1
	`
	category.UpdatedAt = time.Now()
	_, err := r.db.Exec(ctx, query,
		category.ID, category.Name, category.Slug, category.Description,
		category.Image, category.UpdatedAt,
	)
	return err
}

func (r *CategoryRepository) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.Exec(ctx, `DELETE FROM categories WHERE id = $1`, id)
	return err
}

