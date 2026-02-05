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

type FileRepository struct {
	db *pgxpool.Pool
}

func NewFileRepository(db *pgxpool.Pool) *FileRepository {
	return &FileRepository{db: db}
}

func (r *FileRepository) Create(ctx context.Context, file *models.UploadedFile) error {
	query := `
		INSERT INTO uploaded_files (id, order_item_id, file_name, file_path, file_size, file_type, uploaded_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`
	file.ID = uuid.New()
	file.UploadedAt = time.Now()

	_, err := r.db.Exec(ctx, query,
		file.ID, file.OrderItemID, file.FileName, file.FilePath, file.FileSize, file.FileType, file.UploadedAt,
	)
	return err
}

func (r *FileRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.UploadedFile, error) {
	query := `
		SELECT id, order_item_id, file_name, file_path, file_size, file_type, uploaded_at
		FROM uploaded_files WHERE id = $1
	`
	var f models.UploadedFile
	err := r.db.QueryRow(ctx, query, id).Scan(
		&f.ID, &f.OrderItemID, &f.FileName, &f.FilePath, &f.FileSize, &f.FileType, &f.UploadedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	return &f, err
}

func (r *FileRepository) GetByOrderItemID(ctx context.Context, orderItemID uuid.UUID) ([]models.UploadedFile, error) {
	query := `
		SELECT id, order_item_id, file_name, file_path, file_size, file_type, uploaded_at
		FROM uploaded_files WHERE order_item_id = $1 ORDER BY uploaded_at DESC
	`
	rows, err := r.db.Query(ctx, query, orderItemID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var files []models.UploadedFile
	for rows.Next() {
		var f models.UploadedFile
		if err := rows.Scan(&f.ID, &f.OrderItemID, &f.FileName, &f.FilePath, &f.FileSize, &f.FileType, &f.UploadedAt); err != nil {
			return nil, err
		}
		files = append(files, f)
	}
	return files, nil
}

func (r *FileRepository) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.Exec(ctx, `DELETE FROM uploaded_files WHERE id = $1`, id)
	return err
}

