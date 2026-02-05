package models

import (
	"time"

	"github.com/google/uuid"
)

type UploadedFile struct {
	ID          uuid.UUID `json:"id"`
	OrderItemID uuid.UUID `json:"orderItemId"`
	FileName    string    `json:"fileName"`
	FilePath    string    `json:"filePath"`
	FileSize    int64     `json:"fileSize"`
	FileType    string    `json:"fileType"`
	UploadedAt  time.Time `json:"uploadedAt"`
}

type FileUploadResponse struct {
	ID       uuid.UUID `json:"id"`
	FileName string    `json:"fileName"`
	FileSize int64     `json:"fileSize"`
	FileType string    `json:"fileType"`
}

