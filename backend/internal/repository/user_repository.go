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

type UserRepository struct {
	db *pgxpool.Pool
}

func NewUserRepository(db *pgxpool.Pool) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(ctx context.Context, user *models.User) error {
	query := `
		INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`
	user.ID = uuid.New()
	user.CreatedAt = time.Now()
	user.UpdatedAt = time.Now()

	_, err := r.db.Exec(ctx, query,
		user.ID, user.Email, user.PasswordHash, user.FirstName, user.LastName,
		user.Phone, user.Role, user.CreatedAt, user.UpdatedAt,
	)
	return err
}

func (r *UserRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.User, error) {
	query := `
		SELECT id, email, password_hash, first_name, last_name, phone, role, created_at, updated_at
		FROM users WHERE id = $1
	`
	var user models.User
	err := r.db.QueryRow(ctx, query, id).Scan(
		&user.ID, &user.Email, &user.PasswordHash, &user.FirstName, &user.LastName,
		&user.Phone, &user.Role, &user.CreatedAt, &user.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	return &user, err
}

func (r *UserRepository) GetByEmail(ctx context.Context, email string) (*models.User, error) {
	query := `
		SELECT id, email, password_hash, first_name, last_name, phone, role, created_at, updated_at
		FROM users WHERE email = $1
	`
	var user models.User
	err := r.db.QueryRow(ctx, query, email).Scan(
		&user.ID, &user.Email, &user.PasswordHash, &user.FirstName, &user.LastName,
		&user.Phone, &user.Role, &user.CreatedAt, &user.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	return &user, err
}

func (r *UserRepository) Update(ctx context.Context, user *models.User) error {
	query := `
		UPDATE users SET first_name = $2, last_name = $3, phone = $4, updated_at = $5
		WHERE id = $1
	`
	user.UpdatedAt = time.Now()
	_, err := r.db.Exec(ctx, query, user.ID, user.FirstName, user.LastName, user.Phone, user.UpdatedAt)
	return err
}

func (r *UserRepository) GetAllCustomers(ctx context.Context) ([]models.User, error) {
	query := `
		SELECT id, email, password_hash, first_name, last_name, phone, role, created_at, updated_at
		FROM users WHERE role = 'customer' ORDER BY created_at DESC
	`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var user models.User
		if err := rows.Scan(
			&user.ID, &user.Email, &user.PasswordHash, &user.FirstName, &user.LastName,
			&user.Phone, &user.Role, &user.CreatedAt, &user.UpdatedAt,
		); err != nil {
			return nil, err
		}
		users = append(users, user)
	}
	return users, nil
}

func (r *UserRepository) SaveRefreshToken(ctx context.Context, token *models.RefreshToken) error {
	query := `
		INSERT INTO refresh_tokens (id, user_id, token, expires_at, created_at)
		VALUES ($1, $2, $3, $4, $5)
	`
	token.ID = uuid.New()
	token.CreatedAt = time.Now()
	_, err := r.db.Exec(ctx, query, token.ID, token.UserID, token.Token, token.ExpiresAt, token.CreatedAt)
	return err
}

func (r *UserRepository) GetRefreshToken(ctx context.Context, token string) (*models.RefreshToken, error) {
	query := `SELECT id, user_id, token, expires_at, created_at FROM refresh_tokens WHERE token = $1`
	var rt models.RefreshToken
	err := r.db.QueryRow(ctx, query, token).Scan(&rt.ID, &rt.UserID, &rt.Token, &rt.ExpiresAt, &rt.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	return &rt, err
}

func (r *UserRepository) DeleteRefreshToken(ctx context.Context, token string) error {
	_, err := r.db.Exec(ctx, `DELETE FROM refresh_tokens WHERE token = $1`, token)
	return err
}

func (r *UserRepository) DeleteUserRefreshTokens(ctx context.Context, userID uuid.UUID) error {
	_, err := r.db.Exec(ctx, `DELETE FROM refresh_tokens WHERE user_id = $1`, userID)
	return err
}

