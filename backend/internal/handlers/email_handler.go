package handlers

import (
	"context"

	"github.com/gin-gonic/gin"
	"github.com/quikprint/backend/internal/models"
	"github.com/quikprint/backend/internal/repository"
	"github.com/quikprint/backend/internal/services"
	"github.com/quikprint/backend/internal/utils"
)

type EmailHandler struct {
	emailService *services.EmailService
	userRepo     *repository.UserRepository
}

func NewEmailHandler(emailService *services.EmailService, userRepo *repository.UserRepository) *EmailHandler {
	return &EmailHandler{
		emailService: emailService,
		userRepo:     userRepo,
	}
}

// GetEmailStatus returns whether email service is configured
func (h *EmailHandler) GetEmailStatus(c *gin.Context) {
	utils.SuccessResponse(c, 200, gin.H{
		"configured": h.emailService.IsConfigured(),
	})
}

// SendTestEmail sends a test email to verify SMTP configuration
func (h *EmailHandler) SendTestEmail(c *gin.Context) {
	var req models.SendTestEmailRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, err.Error())
		return
	}

	if !h.emailService.IsConfigured() {
		utils.ErrorResponse(c, 500, "Email service is not configured. Please check SMTP settings.")
		return
	}

	err := h.emailService.SendEmail(
		req.Email,
		"Test Email from QuikPrint",
		`<html><body>
		<h1>Test Email</h1>
		<p>This is a test email from QuikPrint NG.</p>
		<p>If you received this email, your SMTP configuration is working correctly!</p>
		</body></html>`,
	)

	if err != nil {
		utils.ErrorResponse(c, 500, "Failed to send test email: "+err.Error())
		return
	}

	utils.SuccessResponse(c, 200, gin.H{
		"message": "Test email sent successfully to " + req.Email,
	})
}

// SendBroadcastEmail sends an email to all customers or selected recipients
func (h *EmailHandler) SendBroadcastEmail(c *gin.Context) {
	var req models.BroadcastEmailRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, err.Error())
		return
	}

	if !h.emailService.IsConfigured() {
		utils.ErrorResponse(c, 500, "Email service is not configured. Please check SMTP settings.")
		return
	}

	ctx := context.Background()
	var recipients []string

	if req.SendToAll {
		// Get all customer emails
		users, err := h.userRepo.GetAllCustomerEmails(ctx)
		if err != nil {
			utils.ErrorResponse(c, 500, "Failed to fetch customer emails: "+err.Error())
			return
		}
		recipients = users
	} else if len(req.Recipients) > 0 {
		recipients = req.Recipients
	} else {
		utils.ValidationErrorResponse(c, "Either sendToAll must be true or recipients must be provided")
		return
	}

	if len(recipients) == 0 {
		utils.ErrorResponse(c, 400, "No recipients found")
		return
	}

	successCount, errors := h.emailService.SendBroadcast(recipients, req.Subject, req.Content)

	var errorMessages []string
	for _, err := range errors {
		errorMessages = append(errorMessages, err.Error())
	}

	utils.SuccessResponse(c, 200, gin.H{
		"message":      "Broadcast completed",
		"totalSent":    len(recipients),
		"successCount": successCount,
		"failedCount":  len(errors),
		"errors":       errorMessages,
	})
}

