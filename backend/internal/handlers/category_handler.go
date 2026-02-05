package handlers

import (
	"context"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/quikprint/backend/internal/models"
	"github.com/quikprint/backend/internal/repository"
	"github.com/quikprint/backend/internal/utils"
)

type CategoryHandler struct {
	categoryRepo *repository.CategoryRepository
}

func NewCategoryHandler(categoryRepo *repository.CategoryRepository) *CategoryHandler {
	return &CategoryHandler{categoryRepo: categoryRepo}
}

func (h *CategoryHandler) GetAll(c *gin.Context) {
	ctx := context.Background()
	categories, err := h.categoryRepo.GetAll(ctx)
	if err != nil {
		utils.ErrorResponse(c, 500, "Failed to fetch categories")
		return
	}
	if categories == nil {
		categories = []models.Category{}
	}
	utils.SuccessResponse(c, 200, categories)
}

func (h *CategoryHandler) GetBySlug(c *gin.Context) {
	slug := c.Param("slug")
	ctx := context.Background()

	category, err := h.categoryRepo.GetBySlug(ctx, slug)
	if err != nil {
		utils.ErrorResponse(c, 500, "Failed to fetch category")
		return
	}
	if category == nil {
		utils.ErrorResponse(c, 404, "Category not found")
		return
	}
	utils.SuccessResponse(c, 200, category)
}

func (h *CategoryHandler) Create(c *gin.Context) {
	var req models.CreateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, err.Error())
		return
	}

	ctx := context.Background()

	// Check if slug exists
	existing, _ := h.categoryRepo.GetBySlug(ctx, req.Slug)
	if existing != nil {
		utils.ErrorResponse(c, 409, "Category with this slug already exists")
		return
	}

	category := &models.Category{
		Name:        req.Name,
		Slug:        req.Slug,
		Description: req.Description,
		Image:       req.Image,
	}

	if err := h.categoryRepo.Create(ctx, category); err != nil {
		utils.ErrorResponse(c, 500, "Failed to create category")
		return
	}

	utils.SuccessResponse(c, 201, category)
}

func (h *CategoryHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.ValidationErrorResponse(c, "Invalid category ID")
		return
	}

	var req models.UpdateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, err.Error())
		return
	}

	ctx := context.Background()

	category, err := h.categoryRepo.GetByID(ctx, id)
	if err != nil || category == nil {
		utils.ErrorResponse(c, 404, "Category not found")
		return
	}

	if req.Name != nil {
		category.Name = *req.Name
	}
	if req.Slug != nil {
		category.Slug = *req.Slug
	}
	if req.Description != nil {
		category.Description = *req.Description
	}
	if req.Image != nil {
		category.Image = *req.Image
	}

	if err := h.categoryRepo.Update(ctx, category); err != nil {
		utils.ErrorResponse(c, 500, "Failed to update category")
		return
	}

	utils.SuccessResponse(c, 200, category)
}

func (h *CategoryHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.ValidationErrorResponse(c, "Invalid category ID")
		return
	}

	ctx := context.Background()

	if err := h.categoryRepo.Delete(ctx, id); err != nil {
		utils.ErrorResponse(c, 500, "Failed to delete category")
		return
	}

	utils.SuccessMessageResponse(c, 200, "Category deleted successfully")
}

