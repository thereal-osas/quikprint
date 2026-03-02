package models

import (
	"time"

	"github.com/google/uuid"
)

type UserRole string

const (
	RoleCustomer UserRole = "customer"
	RoleManager  UserRole = "manager"
	RoleAdmin    UserRole = "admin"
)

// IsValidRole checks if a role string is valid
func IsValidRole(role string) bool {
	switch UserRole(role) {
	case RoleCustomer, RoleManager, RoleAdmin:
		return true
	}
	return false
}

// RoleHierarchy returns the permission level of a role (higher = more permissions)
func RoleHierarchy(role UserRole) int {
	switch role {
	case RoleAdmin:
		return 3
	case RoleManager:
		return 2
	case RoleCustomer:
		return 1
	default:
		return 0
	}
}

type User struct {
	ID               uuid.UUID `json:"id"`
	Email            string    `json:"email"`
	PasswordHash     string    `json:"-"`
	FirstName        string    `json:"firstName"`
	LastName         string    `json:"lastName"`
	Phone            string    `json:"phone,omitempty"`
	Role             UserRole  `json:"role"`
	TwoFactorEnabled bool      `json:"twoFactorEnabled"`
	TwoFactorSecret  string    `json:"-"`
	CreatedAt        time.Time `json:"createdAt"`
	UpdatedAt        time.Time `json:"updatedAt"`
}

type UserProfile struct {
	ID               uuid.UUID `json:"id"`
	Email            string    `json:"email"`
	FirstName        string    `json:"firstName"`
	LastName         string    `json:"lastName"`
	Phone            string    `json:"phone,omitempty"`
	Role             UserRole  `json:"role"`
	TwoFactorEnabled bool      `json:"twoFactorEnabled"`
	CreatedAt        time.Time `json:"createdAt"`
	TotalOrders      int       `json:"totalOrders,omitempty"`
	TotalSpent       float64   `json:"totalSpent,omitempty"`
}

type RegisterRequest struct {
	Email     string `json:"email" binding:"required,email"`
	Password  string `json:"password" binding:"required,min=6"`
	FirstName string `json:"firstName" binding:"required"`
	LastName  string `json:"lastName" binding:"required"`
	Phone     string `json:"phone"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type AuthResponse struct {
	User         UserProfile `json:"user"`
	AccessToken  string      `json:"accessToken"`
	RefreshToken string      `json:"refreshToken"`
}

type RefreshTokenRequest struct {
	RefreshToken string `json:"refreshToken" binding:"required"`
}

type RefreshToken struct {
	ID        uuid.UUID `json:"id"`
	UserID    uuid.UUID `json:"userId"`
	Token     string    `json:"token"`
	ExpiresAt time.Time `json:"expiresAt"`
	CreatedAt time.Time `json:"createdAt"`
}

// UpdateUserRoleRequest for admin to change user roles
type UpdateUserRoleRequest struct {
	Role string `json:"role" binding:"required,oneof=customer manager admin"`
}

// UserListResponse for listing users with role management
type UserListResponse struct {
	ID               uuid.UUID `json:"id"`
	Email            string    `json:"email"`
	FirstName        string    `json:"firstName"`
	LastName         string    `json:"lastName"`
	Phone            string    `json:"phone,omitempty"`
	Role             UserRole  `json:"role"`
	TwoFactorEnabled bool      `json:"twoFactorEnabled"`
	CreatedAt        time.Time `json:"createdAt"`
	UpdatedAt        time.Time `json:"updatedAt"`
}

// 2FA Models

// TwoFactorSetupResponse contains the secret and QR code for 2FA setup
type TwoFactorSetupResponse struct {
	Secret    string `json:"secret"`
	QRCodeURL string `json:"qrCodeUrl"`
}

// TwoFactorVerifyRequest for verifying TOTP codes
type TwoFactorVerifyRequest struct {
	Code string `json:"code" binding:"required,len=6"`
}

// TwoFactorLoginRequest for 2FA verification during login
type TwoFactorLoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
	Code     string `json:"code" binding:"required,len=6"`
}

// LoginResponse for login that may require 2FA
type LoginResponse struct {
	User           *UserProfile `json:"user,omitempty"`
	AccessToken    string       `json:"accessToken,omitempty"`
	RefreshToken   string       `json:"refreshToken,omitempty"`
	RequiresTwoFA  bool         `json:"requiresTwoFA"`
	TwoFASessionID string       `json:"twoFASessionId,omitempty"`
}

// Email-related requests
type SendTestEmailRequest struct {
	Email string `json:"email" binding:"required,email"`
}

type BroadcastEmailRequest struct {
	Subject    string   `json:"subject" binding:"required"`
	Content    string   `json:"content" binding:"required"`
	Recipients []string `json:"recipients"`
	SendToAll  bool     `json:"sendToAll"`
}
