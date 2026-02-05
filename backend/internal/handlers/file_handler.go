package handlers

import (
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/quikprint/backend/internal/models"
	"github.com/quikprint/backend/internal/repository"
	"github.com/quikprint/backend/internal/utils"
)

type FileHandler struct {
	fileRepo   *repository.FileRepository
	uploadPath string
	maxSize    int64 // in bytes
}

func NewFileHandler(fileRepo *repository.FileRepository, uploadPath string, maxSize int64) *FileHandler {
	return &FileHandler{fileRepo: fileRepo, uploadPath: uploadPath, maxSize: maxSize}
}

var allowedMimeTypes = map[string]bool{
	"application/pdf": true,
	"image/png":       true,
	"image/jpeg":      true,
	"image/jpg":       true,
}

var allowedExtensions = map[string]bool{
	".pdf":  true,
	".png":  true,
	".jpg":  true,
	".jpeg": true,
}

func (h *FileHandler) Upload(c *gin.Context) {
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		utils.ValidationErrorResponse(c, "No file provided")
		return
	}
	defer file.Close()

	// Check file size
	if header.Size > h.maxSize {
		utils.ErrorResponse(c, 400, fmt.Sprintf("File too large. Maximum size is %d MB", h.maxSize/(1024*1024)))
		return
	}

	// Check file extension
	ext := strings.ToLower(filepath.Ext(header.Filename))
	if !allowedExtensions[ext] {
		utils.ErrorResponse(c, 400, "Invalid file type. Allowed: PDF, PNG, JPG, JPEG")
		return
	}

	// Check MIME type
	contentType := header.Header.Get("Content-Type")
	if !allowedMimeTypes[contentType] {
		utils.ErrorResponse(c, 400, "Invalid file type")
		return
	}

	// Generate unique filename
	fileID := uuid.New()
	filename := fmt.Sprintf("%s%s", fileID.String(), ext)
	datePath := time.Now().Format("2006/01/02")
	fullDir := filepath.Join(h.uploadPath, datePath)

	// Create directory if not exists
	if err := os.MkdirAll(fullDir, 0755); err != nil {
		utils.ErrorResponse(c, 500, "Failed to create upload directory")
		return
	}

	fullPath := filepath.Join(fullDir, filename)

	// Create destination file
	dst, err := os.Create(fullPath)
	if err != nil {
		utils.ErrorResponse(c, 500, "Failed to save file")
		return
	}
	defer dst.Close()

	// Copy file content
	if _, err := io.Copy(dst, file); err != nil {
		utils.ErrorResponse(c, 500, "Failed to save file")
		return
	}

	// Store relative path (used in UploadForOrderItem, but here we just return the ID)
	_ = filepath.Join(datePath, filename)

	utils.SuccessResponse(c, 201, models.FileUploadResponse{
		ID:       fileID,
		FileName: header.Filename,
		FileSize: header.Size,
		FileType: contentType,
	})
}

func (h *FileHandler) UploadForOrderItem(c *gin.Context) {
	orderItemID, err := uuid.Parse(c.Param("orderItemId"))
	if err != nil {
		utils.ValidationErrorResponse(c, "Invalid order item ID")
		return
	}

	file, header, err := c.Request.FormFile("file")
	if err != nil {
		utils.ValidationErrorResponse(c, "No file provided")
		return
	}
	defer file.Close()

	if header.Size > h.maxSize {
		utils.ErrorResponse(c, 400, fmt.Sprintf("File too large. Maximum size is %d MB", h.maxSize/(1024*1024)))
		return
	}

	ext := strings.ToLower(filepath.Ext(header.Filename))
	if !allowedExtensions[ext] {
		utils.ErrorResponse(c, 400, "Invalid file type. Allowed: PDF, PNG, JPG, JPEG")
		return
	}

	fileID := uuid.New()
	filename := fmt.Sprintf("%s%s", fileID.String(), ext)
	datePath := time.Now().Format("2006/01/02")
	fullDir := filepath.Join(h.uploadPath, datePath)

	if err := os.MkdirAll(fullDir, 0755); err != nil {
		utils.ErrorResponse(c, 500, "Failed to create upload directory")
		return
	}

	fullPath := filepath.Join(fullDir, filename)
	dst, err := os.Create(fullPath)
	if err != nil {
		utils.ErrorResponse(c, 500, "Failed to save file")
		return
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		utils.ErrorResponse(c, 500, "Failed to save file")
		return
	}

	relativePath := filepath.Join(datePath, filename)
	ctx := context.Background()

	uploadedFile := &models.UploadedFile{
		OrderItemID: orderItemID,
		FileName:    header.Filename,
		FilePath:    relativePath,
		FileSize:    header.Size,
		FileType:    header.Header.Get("Content-Type"),
	}

	if err := h.fileRepo.Create(ctx, uploadedFile); err != nil {
		utils.ErrorResponse(c, 500, "Failed to save file record")
		return
	}

	utils.SuccessResponse(c, 201, uploadedFile)
}

func (h *FileHandler) GetFile(c *gin.Context) {
	fileID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.ValidationErrorResponse(c, "Invalid file ID")
		return
	}

	ctx := context.Background()
	file, err := h.fileRepo.GetByID(ctx, fileID)
	if err != nil || file == nil {
		utils.ErrorResponse(c, 404, "File not found")
		return
	}

	fullPath := filepath.Join(h.uploadPath, file.FilePath)
	c.File(fullPath)
}

func (h *FileHandler) GetFilesByOrderItem(c *gin.Context) {
	orderItemID, err := uuid.Parse(c.Param("orderItemId"))
	if err != nil {
		utils.ValidationErrorResponse(c, "Invalid order item ID")
		return
	}

	ctx := context.Background()
	files, err := h.fileRepo.GetByOrderItemID(ctx, orderItemID)
	if err != nil {
		utils.ErrorResponse(c, 500, "Failed to fetch files")
		return
	}
	if files == nil {
		files = []models.UploadedFile{}
	}

	utils.SuccessResponse(c, 200, files)
}

func (h *FileHandler) DeleteFile(c *gin.Context) {
	fileID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.ValidationErrorResponse(c, "Invalid file ID")
		return
	}

	ctx := context.Background()
	file, err := h.fileRepo.GetByID(ctx, fileID)
	if err != nil || file == nil {
		utils.ErrorResponse(c, 404, "File not found")
		return
	}

	// Delete physical file
	fullPath := filepath.Join(h.uploadPath, file.FilePath)
	os.Remove(fullPath)

	// Delete database record
	if err := h.fileRepo.Delete(ctx, fileID); err != nil {
		utils.ErrorResponse(c, 500, "Failed to delete file")
		return
	}

	utils.SuccessMessageResponse(c, 200, "File deleted successfully")
}
