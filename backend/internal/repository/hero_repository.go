package repository

import (
	"context"

	"github.com/quikprint/backend/internal/models"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type HeroSlideRepository struct {
	db *pgxpool.Pool
}

func NewHeroSlideRepository(db *pgxpool.Pool) *HeroSlideRepository {
	return &HeroSlideRepository{db: db}
}

func (r *HeroSlideRepository) GetAll(ctx context.Context) ([]models.HeroSlide, error) {
	query := `SELECT id, heading, subheading, image_url, cta_text, cta_link, is_active, display_order, created_at, updated_at
              FROM hero_slides ORDER BY display_order ASC, created_at DESC`

	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var slides []models.HeroSlide
	for rows.Next() {
		var s models.HeroSlide
		err := rows.Scan(&s.ID, &s.Heading, &s.Subheading, &s.ImageURL, &s.CTAText, &s.CTALink, &s.IsActive, &s.DisplayOrder, &s.CreatedAt, &s.UpdatedAt)
		if err != nil {
			return nil, err
		}
		slides = append(slides, s)
	}
	return slides, nil
}

func (r *HeroSlideRepository) GetActive(ctx context.Context) ([]models.HeroSlide, error) {
	query := `SELECT id, heading, subheading, image_url, cta_text, cta_link, is_active, display_order, created_at, updated_at
              FROM hero_slides WHERE is_active = true ORDER BY display_order ASC`

	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var slides []models.HeroSlide
	for rows.Next() {
		var s models.HeroSlide
		err := rows.Scan(&s.ID, &s.Heading, &s.Subheading, &s.ImageURL, &s.CTAText, &s.CTALink, &s.IsActive, &s.DisplayOrder, &s.CreatedAt, &s.UpdatedAt)
		if err != nil {
			return nil, err
		}
		slides = append(slides, s)
	}
	return slides, nil
}

func (r *HeroSlideRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.HeroSlide, error) {
	query := `SELECT id, heading, subheading, image_url, cta_text, cta_link, is_active, display_order, created_at, updated_at
              FROM hero_slides WHERE id = $1`

	var s models.HeroSlide
	err := r.db.QueryRow(ctx, query, id).Scan(&s.ID, &s.Heading, &s.Subheading, &s.ImageURL, &s.CTAText, &s.CTALink, &s.IsActive, &s.DisplayOrder, &s.CreatedAt, &s.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *HeroSlideRepository) Create(ctx context.Context, req *models.CreateHeroSlideRequest) (*models.HeroSlide, error) {
	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}
	displayOrder := 0
	if req.DisplayOrder != nil {
		displayOrder = *req.DisplayOrder
	}

	query := `INSERT INTO hero_slides (heading, subheading, image_url, cta_text, cta_link, is_active, display_order)
              VALUES ($1, $2, $3, $4, $5, $6, $7)
              RETURNING id, heading, subheading, image_url, cta_text, cta_link, is_active, display_order, created_at, updated_at`

	var s models.HeroSlide
	err := r.db.QueryRow(ctx, query, req.Heading, req.Subheading, req.ImageURL, req.CTAText, req.CTALink, isActive, displayOrder).
		Scan(&s.ID, &s.Heading, &s.Subheading, &s.ImageURL, &s.CTAText, &s.CTALink, &s.IsActive, &s.DisplayOrder, &s.CreatedAt, &s.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *HeroSlideRepository) Update(ctx context.Context, id uuid.UUID, req *models.UpdateHeroSlideRequest) (*models.HeroSlide, error) {
	existing, err := r.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if req.Heading != nil {
		existing.Heading = *req.Heading
	}
	if req.Subheading != nil {
		existing.Subheading = req.Subheading
	}
	if req.ImageURL != nil {
		existing.ImageURL = *req.ImageURL
	}
	if req.CTAText != nil {
		existing.CTAText = req.CTAText
	}
	if req.CTALink != nil {
		existing.CTALink = req.CTALink
	}
	if req.IsActive != nil {
		existing.IsActive = *req.IsActive
	}
	if req.DisplayOrder != nil {
		existing.DisplayOrder = *req.DisplayOrder
	}

	query := `UPDATE hero_slides SET heading = $1, subheading = $2, image_url = $3, cta_text = $4, cta_link = $5, is_active = $6, display_order = $7, updated_at = NOW()
              WHERE id = $8 RETURNING id, heading, subheading, image_url, cta_text, cta_link, is_active, display_order, created_at, updated_at`

	var s models.HeroSlide
	err = r.db.QueryRow(ctx, query, existing.Heading, existing.Subheading, existing.ImageURL, existing.CTAText, existing.CTALink, existing.IsActive, existing.DisplayOrder, id).
		Scan(&s.ID, &s.Heading, &s.Subheading, &s.ImageURL, &s.CTAText, &s.CTALink, &s.IsActive, &s.DisplayOrder, &s.CreatedAt, &s.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *HeroSlideRepository) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.Exec(ctx, "DELETE FROM hero_slides WHERE id = $1", id)
	return err
}
