package handlers

import (
	"context"
	"fmt"
	"strings"

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

	fmt.Printf("DEBUG: Attempting to delete product with ID: %s\n", id)

	ctx := context.Background()
	if err := h.productRepo.Delete(ctx, id); err != nil {
		fmt.Printf("DEBUG: Delete failed with error: %v\n", err)
		// Check if it's a foreign key constraint error
		if strings.Contains(strings.ToLower(err.Error()), "violates foreign key constraint") ||
			strings.Contains(strings.ToLower(err.Error()), "is still referenced") {
			utils.ErrorResponse(c, 400, "Cannot delete product: it is referenced by existing orders. Consider archiving it instead.")
			return
		}
		utils.ErrorResponse(c, 500, "Failed to delete product")
		return
	}

	fmt.Printf("DEBUG: Successfully deleted product with ID: %s\n", id)
	utils.SuccessMessageResponse(c, 200, "Product deleted successfully")
}

// BulkUpdatePrice updates prices for multiple products at once
func (h *ProductHandler) BulkUpdatePrice(c *gin.Context) {
	var req models.BulkUpdatePriceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, err.Error())
		return
	}

	ctx := context.Background()
	var updatedCount, failedCount int
	var failedIDs []string

	for _, productID := range req.ProductIDs {
		product, err := h.productRepo.GetByID(ctx, productID)
		if err != nil || product == nil {
			failedCount++
			failedIDs = append(failedIDs, productID.String())
			continue
		}

		// Calculate new price based on update type
		var newPrice float64
		switch req.UpdateType {
		case "set":
			// Set exact price
			newPrice = req.Value
		case "increase":
			// Increase by fixed amount
			newPrice = product.BasePrice + req.Value
		case "decrease":
			// Decrease by fixed amount
			newPrice = product.BasePrice - req.Value
			if newPrice < 0 {
				newPrice = 0
			}
		case "percentage":
			// Adjust by percentage (positive = increase, negative = decrease)
			newPrice = product.BasePrice * (1 + req.Value/100)
			if newPrice < 0 {
				newPrice = 0
			}
		default:
			failedCount++
			failedIDs = append(failedIDs, productID.String())
			continue
		}

		product.BasePrice = newPrice
		if err := h.productRepo.Update(ctx, product); err != nil {
			failedCount++
			failedIDs = append(failedIDs, productID.String())
			continue
		}

		updatedCount++
	}

	response := models.BulkUpdatePriceResponse{
		UpdatedCount: updatedCount,
		FailedCount:  failedCount,
		FailedIDs:    failedIDs,
	}

	utils.SuccessResponse(c, 200, response)
}
