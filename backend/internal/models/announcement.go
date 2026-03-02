package models

import (
	"time"

	"github.com/google/uuid"
)

type Announcement struct {
	ID           uuid.UUID `json:"id"`
	Text         string    `json:"text"`
	LinkURL      *string   `json:"linkUrl,omitempty"`
	IsActive     bool      `json:"isActive"`
	DisplayOrder int       `json:"displayOrder"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

type CreateAnnouncementRequest struct {
	Text         string  `json:"text" binding:"required"`
	LinkURL      *string `json:"linkUrl"`
	IsActive     *bool   `json:"isActive"`
	DisplayOrder *int    `json:"displayOrder"`
}

type UpdateAnnouncementRequest struct {
	Text         *string `json:"text"`
	LinkURL      *string `json:"linkUrl"`
	IsActive     *bool   `json:"isActive"`
	DisplayOrder *int    `json:"displayOrder"`
}

type HeroSlide struct {
	ID           uuid.UUID `json:"id"`
	Heading      string    `json:"heading"`
	Subheading   *string   `json:"subheading,omitempty"`
	ImageURL     string    `json:"imageUrl"`
	CTAText      *string   `json:"ctaText,omitempty"`
	CTALink      *string   `json:"ctaLink,omitempty"`
	IsActive     bool      `json:"isActive"`
	DisplayOrder int       `json:"displayOrder"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

type CreateHeroSlideRequest struct {
	Heading      string  `json:"heading" binding:"required"`
	Subheading   *string `json:"subheading"`
	ImageURL     string  `json:"imageUrl" binding:"required"`
	CTAText      *string `json:"ctaText"`
	CTALink      *string `json:"ctaLink"`
	IsActive     *bool   `json:"isActive"`
	DisplayOrder *int    `json:"displayOrder"`
}

type UpdateHeroSlideRequest struct {
	Heading      *string `json:"heading"`
	Subheading   *string `json:"subheading"`
	ImageURL     *string `json:"imageUrl"`
	CTAText      *string `json:"ctaText"`
	CTALink      *string `json:"ctaLink"`
	IsActive     *bool   `json:"isActive"`
	DisplayOrder *int    `json:"displayOrder"`
}

