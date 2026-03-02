package handlers

import (
	"net/http"

	"github.com/quikprint/backend/internal/models"
	"github.com/quikprint/backend/internal/repository"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type AnnouncementHandler struct {
	repo *repository.AnnouncementRepository
}

func NewAnnouncementHandler(repo *repository.AnnouncementRepository) *AnnouncementHandler {
	return &AnnouncementHandler{repo: repo}
}

// GetActiveAnnouncements returns all active announcements (public endpoint)
func (h *AnnouncementHandler) GetActiveAnnouncements(c *gin.Context) {
	announcements, err := h.repo.GetActive(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to fetch announcements"})
		return
	}
	if announcements == nil {
		announcements = []models.Announcement{}
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": announcements})
}

// GetAllAnnouncements returns all announcements (admin endpoint)
func (h *AnnouncementHandler) GetAllAnnouncements(c *gin.Context) {
	announcements, err := h.repo.GetAll(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to fetch announcements"})
		return
	}
	if announcements == nil {
		announcements = []models.Announcement{}
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": announcements})
}

// GetAnnouncement returns a single announcement by ID
func (h *AnnouncementHandler) GetAnnouncement(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "Invalid announcement ID"})
		return
	}

	announcement, err := h.repo.GetByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "error": "Announcement not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": announcement})
}

// CreateAnnouncement creates a new announcement
func (h *AnnouncementHandler) CreateAnnouncement(c *gin.Context) {
	var req models.CreateAnnouncementRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}

	announcement, err := h.repo.Create(c.Request.Context(), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to create announcement"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"success": true, "data": announcement})
}

// UpdateAnnouncement updates an existing announcement
func (h *AnnouncementHandler) UpdateAnnouncement(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "Invalid announcement ID"})
		return
	}

	var req models.UpdateAnnouncementRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": err.Error()})
		return
	}

	announcement, err := h.repo.Update(c.Request.Context(), id, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to update announcement"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": announcement})
}

// DeleteAnnouncement deletes an announcement
func (h *AnnouncementHandler) DeleteAnnouncement(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": "Invalid announcement ID"})
		return
	}

	err = h.repo.Delete(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": "Failed to delete announcement"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Announcement deleted successfully"})
}
