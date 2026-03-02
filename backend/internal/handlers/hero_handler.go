package handlers

import (
	"net/http"

	"github.com/quikprint/backend/internal/models"
	"github.com/quikprint/backend/internal/repository"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type HeroSlideHandler struct {
	repo *repository.HeroSlideRepository
}

func NewHeroSlideHandler(repo *repository.HeroSlideRepository) *HeroSlideHandler {
	return &HeroSlideHandler{repo: repo}
}

// GetActiveHeroSlides returns all active hero slides (public endpoint)
func (h *HeroSlideHandler) GetActiveHeroSlides(c *gin.Context) {
	slides, err := h.repo.GetActive(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to fetch hero slides"})
		return
	}
	if slides == nil {
		slides = []models.HeroSlide{}
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": slides})
}

// GetAllHeroSlides returns all hero slides (admin endpoint)
func (h *HeroSlideHandler) GetAllHeroSlides(c *gin.Context) {
	slides, err := h.repo.GetAll(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to fetch hero slides"})
		return
	}
	if slides == nil {
		slides = []models.HeroSlide{}
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": slides})
}

// GetHeroSlide returns a single hero slide by ID
func (h *HeroSlideHandler) GetHeroSlide(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "Invalid hero slide ID"})
		return
	}

	slide, err := h.repo.GetByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "error": "Hero slide not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": slide})
}

// CreateHeroSlide creates a new hero slide
func (h *HeroSlideHandler) CreateHeroSlide(c *gin.Context) {
	var req models.CreateHeroSlideRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}

	slide, err := h.repo.Create(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to create hero slide"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"success": true, "data": slide})
}

// UpdateHeroSlide updates an existing hero slide
func (h *HeroSlideHandler) UpdateHeroSlide(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "Invalid hero slide ID"})
		return
	}

	var req models.UpdateHeroSlideRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}

	slide, err := h.repo.Update(c.Request.Context(), id, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to update hero slide"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": slide})
}

// DeleteHeroSlide deletes a hero slide
func (h *HeroSlideHandler) DeleteHeroSlide(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "Invalid hero slide ID"})
		return
	}

	err = h.repo.Delete(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to delete hero slide"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Hero slide deleted successfully"})
}
