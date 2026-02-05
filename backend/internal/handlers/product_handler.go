package handlers

import (
	"context"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/quikprint/backend/internal/models"
	"github.com/quikprint/backend/internal/repository"
	"github.com/quikprint/backend/internal/utils"
)

type ProductHandler struct {
	productRepo *repository.ProductRepository
}

func NewProductHandler(productRepo *repository.ProductRepository) *ProductHandler {
	return &ProductHandler{productRepo: productRepo}
}

func (h *ProductHandler) GetAll(c *gin.Context) {
	categorySlug := c.Query("category")
	ctx := context.Background()

	products, err := h.productRepo.GetAll(ctx, categorySlug)
	if err != nil {
		utils.ErrorResponse(c, 500, "Failed to fetch products")
		return
	}
	if products == nil {
		products = []models.Product{}
	}
	utils.SuccessResponse(c, 200, products)
}

func (h *ProductHandler) GetBySlug(c *gin.Context) {
	slug := c.Param("slug")
	ctx := context.Background()

	product, err := h.productRepo.GetBySlug(ctx, slug)
	if err != nil {
		utils.ErrorResponse(c, 500, "Failed to fetch product")
		return
	}
	if product == nil {
		utils.ErrorResponse(c, 404, "Product not found")
		return
	}
	utils.SuccessResponse(c, 200, product)
}

func (h *ProductHandler) Create(c *gin.Context) {
	var req models.CreateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, err.Error())
		return
	}

	ctx := context.Background()

	existing, _ := h.productRepo.GetBySlug(ctx, req.Slug)
	if existing != nil {
		utils.ErrorResponse(c, 409, "Product with this slug already exists")
		return
	}

	product := &models.Product{
		Name:             req.Name,
		Slug:             req.Slug,
		CategoryID:       req.CategoryID,
		Description:      req.Description,
		ShortDescription: req.ShortDescription,
		BasePrice:        req.BasePrice,
		Images:           req.Images,
		Options:          req.Options,
		Features:         req.Features,
		Turnaround:       req.Turnaround,
		MinQuantity:      req.MinQuantity,
	}

	if product.Images == nil {
		product.Images = []string{}
	}
	if product.Options == nil {
		product.Options = []models.ProductOption{}
	}
	if product.Features == nil {
		product.Features = []string{}
	}
	if product.MinQuantity == 0 {
		product.MinQuantity = 1
	}

	if err := h.productRepo.Create(ctx, product); err != nil {
		utils.ErrorResponse(c, 500, "Failed to create product")
		return
	}

	// Fetch with category info
	product, _ = h.productRepo.GetByID(ctx, product.ID)
	utils.SuccessResponse(c, 201, product)
}

func (h *ProductHandler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.ValidationErrorResponse(c, "Invalid product ID")
		return
	}

	var req models.UpdateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, err.Error())
		return
	}

	ctx := context.Background()

	product, err := h.productRepo.GetByID(ctx, id)
	if err != nil || product == nil {
		utils.ErrorResponse(c, 404, "Product not found")
		return
	}

	if req.Name != nil {
		product.Name = *req.Name
	}
	if req.Slug != nil {
		product.Slug = *req.Slug
	}
	if req.CategoryID != nil {
		product.CategoryID = *req.CategoryID
	}
	if req.Description != nil {
		product.Description = *req.Description
	}
	if req.ShortDescription != nil {
		product.ShortDescription = *req.ShortDescription
	}
	if req.BasePrice != nil {
		product.BasePrice = *req.BasePrice
	}
	if req.Images != nil {
		product.Images = req.Images
	}
	if req.Options != nil {
		product.Options = *req.Options
	}
	if req.Features != nil {
		product.Features = req.Features
	}
	if req.Turnaround != nil {
		product.Turnaround = *req.Turnaround
	}
	if req.MinQuantity != nil {
		product.MinQuantity = *req.MinQuantity
	}

	if err := h.productRepo.Update(ctx, product); err != nil {
		utils.ErrorResponse(c, 500, "Failed to update product")
		return
	}

	product, _ = h.productRepo.GetByID(ctx, product.ID)
	utils.SuccessResponse(c, 200, product)
}

func (h *ProductHandler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.ValidationErrorResponse(c, "Invalid product ID")
		return
	}

	ctx := context.Background()
	if err := h.productRepo.Delete(ctx, id); err != nil {
		utils.ErrorResponse(c, 500, "Failed to delete product")
		return
	}

	utils.SuccessMessageResponse(c, 200, "Product deleted successfully")
}

