package handlers

import (
	"context"
	"crypto/hmac"
	"crypto/sha512"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/quikprint/backend/internal/models"
	"github.com/quikprint/backend/internal/repository"
	"github.com/quikprint/backend/internal/services"
	"github.com/quikprint/backend/internal/utils"
)

type PaymentHandler struct {
	paymentService *services.PaymentService
	paymentRepo    *repository.PaymentRepository
	orderRepo      *repository.OrderRepository
	secretKey      string
	callbackURL    string
}

func NewPaymentHandler(
	paymentService *services.PaymentService,
	paymentRepo *repository.PaymentRepository,
	orderRepo *repository.OrderRepository,
	secretKey, callbackURL string,
) *PaymentHandler {
	return &PaymentHandler{
		paymentService: paymentService,
		paymentRepo:    paymentRepo,
		orderRepo:      orderRepo,
		secretKey:      secretKey,
		callbackURL:    callbackURL,
	}
}

func (h *PaymentHandler) InitializePayment(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)

	var req models.InitializePaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, err.Error())
		return
	}

	ctx := context.Background()
	order, err := h.orderRepo.GetByID(ctx, req.OrderID)
	if err != nil || order == nil {
		utils.ErrorResponse(c, 404, "Order not found")
		return
	}

	if order.UserID != userID {
		utils.ErrorResponse(c, 403, "Access denied")
		return
	}

	if order.Status != models.OrderStatusAwaitingPayment {
		utils.ErrorResponse(c, 400, "Order is not awaiting payment")
		return
	}

	// Get user email
	userEmail := c.MustGet("userEmail").(string)

	// Generate payment reference
	reference := fmt.Sprintf("QP-%s-%s", order.OrderNumber, uuid.New().String()[:8])

	// Amount in kobo (multiply by 100)
	amountKobo := int(order.Total * 100)

	paystackReq := &services.PaystackInitRequest{
		Email:     userEmail,
		Amount:    amountKobo,
		Reference: reference,
		Callback:  h.callbackURL,
		Metadata: map[string]string{
			"order_id":     order.ID.String(),
			"order_number": order.OrderNumber,
		},
	}

	paystackResp, err := h.paymentService.InitializePayment(paystackReq)
	if err != nil {
		utils.ErrorResponse(c, 500, "Failed to initialize payment: "+err.Error())
		return
	}

	// Save payment record
	payment := &models.Payment{
		OrderID:     order.ID,
		PaystackRef: reference,
		Amount:      order.Total,
		Currency:    "NGN",
		Status:      models.PaymentStatusPending,
	}

	if err := h.paymentRepo.Create(ctx, payment); err != nil {
		utils.ErrorResponse(c, 500, "Failed to save payment record")
		return
	}

	utils.SuccessResponse(c, 200, models.InitializePaymentResponse{
		AuthorizationURL: paystackResp.Data.AuthorizationURL,
		AccessCode:       paystackResp.Data.AccessCode,
		Reference:        reference,
	})
}

func (h *PaymentHandler) VerifyPayment(c *gin.Context) {
	reference := c.Param("reference")

	ctx := context.Background()
	payment, err := h.paymentRepo.GetByReference(ctx, reference)
	if err != nil || payment == nil {
		utils.ErrorResponse(c, 404, "Payment not found")
		return
	}

	paystackResp, err := h.paymentService.VerifyPayment(reference)
	if err != nil {
		utils.ErrorResponse(c, 500, "Failed to verify payment")
		return
	}

	responseJSON, _ := json.Marshal(paystackResp)

	if paystackResp.Data.Status == "success" {
		// Update order status
		h.orderRepo.UpdateStatus(ctx, payment.OrderID, models.OrderStatusPaid, "Payment confirmed via Paystack", uuid.Nil)
		h.paymentRepo.UpdateStatus(ctx, reference, models.PaymentStatusSuccess, string(responseJSON))
	} else {
		h.paymentRepo.UpdateStatus(ctx, reference, models.PaymentStatusFailed, string(responseJSON))
	}

	utils.SuccessResponse(c, 200, gin.H{
		"status":    paystackResp.Data.Status,
		"reference": reference,
	})
}

func (h *PaymentHandler) Webhook(c *gin.Context) {
	// Verify signature
	signature := c.GetHeader("x-paystack-signature")
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.AbortWithStatus(400)
		return
	}

	mac := hmac.New(sha512.New, []byte(h.secretKey))
	mac.Write(body)
	expectedSig := hex.EncodeToString(mac.Sum(nil))

	if signature != expectedSig {
		c.AbortWithStatus(401)
		return
	}

	var payload models.PaystackWebhookPayload
	if err := json.Unmarshal(body, &payload); err != nil {
		c.AbortWithStatus(400)
		return
	}

	ctx := context.Background()

	if payload.Event == "charge.success" {
		payment, _ := h.paymentRepo.GetByReference(ctx, payload.Data.Reference)
		if payment != nil {
			h.paymentRepo.UpdateStatus(ctx, payload.Data.Reference, models.PaymentStatusSuccess, string(body))
			h.orderRepo.UpdateStatus(ctx, payment.OrderID, models.OrderStatusPaid, "Payment confirmed via webhook", uuid.Nil)
		}
	}

	c.JSON(200, gin.H{"status": "ok"})
}
