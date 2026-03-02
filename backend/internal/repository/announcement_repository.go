package repository

import (
	"context"

	"github.com/quikprint/backend/internal/models"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type AnnouncementRepository struct {
	db *pgxpool.Pool
}

func NewAnnouncementRepository(db *pgxpool.Pool) *AnnouncementRepository {
	return &AnnouncementRepository{db: db}
}

func (r *AnnouncementRepository) GetAll(ctx context.Context) ([]models.Announcement, error) {
	query := `SELECT id, text, link_url, is_active, display_order, created_at, updated_at
              FROM announcements ORDER BY display_order ASC, created_at DESC`

	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var announcements []models.Announcement
	for rows.Next() {
		var a models.Announcement
		err := rows.Scan(&a.ID, &a.Text, &a.LinkURL, &a.IsActive, &a.DisplayOrder, &a.CreatedAt, &a.UpdatedAt)
		if err != nil {
			return nil, err
		}
		announcements = append(announcements, a)
	}
	return announcements, nil
}

func (r *AnnouncementRepository) GetActive(ctx context.Context) ([]models.Announcement, error) {
	query := `SELECT id, text, link_url, is_active, display_order, created_at, updated_at
              FROM announcements WHERE is_active = true ORDER BY display_order ASC`

	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var announcements []models.Announcement
	for rows.Next() {
		var a models.Announcement
		err := rows.Scan(&a.ID, &a.Text, &a.LinkURL, &a.IsActive, &a.DisplayOrder, &a.CreatedAt, &a.UpdatedAt)
		if err != nil {
			return nil, err
		}
		announcements = append(announcements, a)
	}
	return announcements, nil
}

func (r *AnnouncementRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Announcement, error) {
	query := `SELECT id, text, link_url, is_active, display_order, created_at, updated_at
              FROM announcements WHERE id = $1`

	var a models.Announcement
	err := r.db.QueryRow(ctx, query, id).Scan(&a.ID, &a.Text, &a.LinkURL, &a.IsActive, &a.DisplayOrder, &a.CreatedAt, &a.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &a, nil
}

func (r *AnnouncementRepository) Create(ctx context.Context, req *models.CreateAnnouncementRequest) (*models.Announcement, error) {
	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}
	displayOrder := 0
	if req.DisplayOrder != nil {
		displayOrder = *req.DisplayOrder
	}

	query := `INSERT INTO announcements (text, link_url, is_active, display_order)
              VALUES ($1, $2, $3, $4)
              RETURNING id, text, link_url, is_active, display_order, created_at, updated_at`

	var a models.Announcement
	err := r.db.QueryRow(ctx, query, req.Text, req.LinkURL, isActive, displayOrder).
		Scan(&a.ID, &a.Text, &a.LinkURL, &a.IsActive, &a.DisplayOrder, &a.CreatedAt, &a.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &a, nil
}

func (r *AnnouncementRepository) Update(ctx context.Context, id uuid.UUID, req *models.UpdateAnnouncementRequest) (*models.Announcement, error) {
	existing, err := r.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if req.Text != nil {
		existing.Text = *req.Text
	}
	if req.LinkURL != nil {
		existing.LinkURL = req.LinkURL
	}
	if req.IsActive != nil {
		existing.IsActive = *req.IsActive
	}
	if req.DisplayOrder != nil {
		existing.DisplayOrder = *req.DisplayOrder
	}

	query := `UPDATE announcements SET text = $1, link_url = $2, is_active = $3, display_order = $4, updated_at = NOW()
              WHERE id = $5 RETURNING id, text, link_url, is_active, display_order, created_at, updated_at`

	var a models.Announcement
	err = r.db.QueryRow(ctx, query, existing.Text, existing.LinkURL, existing.IsActive, existing.DisplayOrder, id).
		Scan(&a.ID, &a.Text, &a.LinkURL, &a.IsActive, &a.DisplayOrder, &a.CreatedAt, &a.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &a, nil
}

func (r *AnnouncementRepository) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.Exec(ctx, "DELETE FROM announcements WHERE id = $1", id)
	return err
}
