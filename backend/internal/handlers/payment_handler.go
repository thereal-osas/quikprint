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
	fmt.Printf("DEBUG: InitializePayment called for user: %s\n", userID)

	var req models.InitializePaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		fmt.Printf("DEBUG: JSON binding error: %v\n", err)
		utils.ValidationErrorResponse(c, err.Error())
		return
	}

	fmt.Printf("DEBUG: Payment request: %+v\n", req)

	ctx := context.Background()
	order, err := h.orderRepo.GetByID(ctx, req.OrderID)
	if err != nil {
		fmt.Printf("DEBUG: Order lookup error: %v\n", err)
		utils.ErrorResponse(c, 404, "Order not found")
		return
	}
	if order == nil {
		fmt.Printf("DEBUG: Order not found for ID: %s\n", req.OrderID)
		utils.ErrorResponse(c, 404, "Order not found")
		return
	}

	fmt.Printf("DEBUG: Found order: %+v\n", order)
	fmt.Printf("DEBUG: Order details: ID=%s, Total=%.2f, Subtotal=%.2f, Shipping=%.2f, Discount=%.2f\n", order.ID, order.Total, order.Subtotal, order.Shipping, order.Discount)

	if order.UserID != userID {
		fmt.Printf("DEBUG: Access denied - user %s does not own order %s\n", userID, order.ID)
		utils.ErrorResponse(c, 403, "Access denied")
		return
	}

	if order.Status != models.OrderStatusAwaitingPayment {
		fmt.Printf("DEBUG: Invalid order status: %s\n", order.Status)
		utils.ErrorResponse(c, 400, "Order is not awaiting payment")
		return
	}

	// Get user email
	userEmail := c.MustGet("userEmail").(string)
	fmt.Printf("DEBUG: User email: %s\n", userEmail)

	// Validate email
	if userEmail == "" {
		fmt.Printf("DEBUG: User email is empty\n")
		utils.ErrorResponse(c, 400, "User email is required for payment")
		return
	}

	// Generate payment reference (order number already includes QP- prefix)
	reference := fmt.Sprintf("%s-%s", order.OrderNumber, uuid.New().String()[:8])
	fmt.Printf("DEBUG: Generated reference: %s\n", reference)

	// Amount in kobo (multiply by 100) - round to ensure integer
	amountKobo := int(order.Total * 100)
	fmt.Printf("DEBUG: Order total: %.2f, Amount in kobo: %d\n", order.Total, amountKobo)

	// Validate amount - Paystack minimum is 50 kobo (0.50 NGN)
	if amountKobo < 50 {
		fmt.Printf("DEBUG: Amount too small: %d kobo (minimum 50)\n", amountKobo)
		utils.ErrorResponse(c, 400, "Order total must be at least 0.50 NGN")
		return
	}

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

	fmt.Printf("DEBUG: Paystack request: %+v\n", paystackReq)

	paystackResp, err := h.paymentService.InitializePayment(paystackReq)
	if err != nil {
		fmt.Printf("DEBUG: Paystack initialization error: %v\n", err)
		utils.ErrorResponse(c, 500, "Failed to initialize payment: "+err.Error())
		return
	}

	fmt.Printf("DEBUG: Paystack response: %+v\n", paystackResp)

	// Validate Paystack response has all required fields
	if paystackResp.Data.AuthorizationURL == "" {
		fmt.Printf("DEBUG: Paystack response missing authorization URL\n")
		utils.ErrorResponse(c, 500, "Payment initialization failed: missing authorization URL")
		return
	}
	if paystackResp.Data.Reference == "" {
		fmt.Printf("DEBUG: Paystack response missing reference\n")
		utils.ErrorResponse(c, 500, "Payment initialization failed: missing reference")
		return
	}

	fmt.Printf("DEBUG: Authorization URL: %s\n", paystackResp.Data.AuthorizationURL)
	fmt.Printf("DEBUG: Reference: %s\n", paystackResp.Data.Reference)

	// Save payment record
	payment := &models.Payment{
		OrderID:     order.ID,
		PaystackRef: reference,
		Amount:      order.Total,
		Currency:    "NGN",
		Status:      models.PaymentStatusPending,
	}

	fmt.Printf("DEBUG: Creating payment record: %+v\n", payment)

	if err := h.paymentRepo.Create(ctx, payment); err != nil {
		fmt.Printf("DEBUG: Failed to save payment record: %v\n", err)
		utils.ErrorResponse(c, 500, "Failed to save payment record")
		return
	}

	fmt.Printf("DEBUG: Payment record created successfully\n")

	response := models.InitializePaymentResponse{
		AuthorizationURL: paystackResp.Data.AuthorizationURL,
		AccessCode:       paystackResp.Data.AccessCode,
		Reference:        reference,
	}

	fmt.Printf("DEBUG: Returning payment response: AuthURL length=%d, Ref=%s\n", len(response.AuthorizationURL), response.Reference)

	utils.SuccessResponse(c, 200, response)
}

func (h *PaymentHandler) VerifyPayment(c *gin.Context) {
	userID := c.MustGet("userID").(uuid.UUID)
	reference := c.Param("reference")
	fmt.Printf("DEBUG: VerifyPayment called by user %s with reference: %s\n", userID, reference)

	ctx := context.Background()

	// First, let's check if any payments exist at all
	allPayments, err := h.paymentRepo.GetAllPayments(ctx)
	if err != nil {
		fmt.Printf("DEBUG: Error getting all payments: %v\n", err)
	} else {
		fmt.Printf("DEBUG: Total payments in database: %d\n", len(allPayments))
		for _, p := range allPayments {
			fmt.Printf("DEBUG: Payment: ID=%s, Ref=%s, Status=%s\n", p.ID, p.PaystackRef, p.Status)
		}
	}

	payment, err := h.paymentRepo.GetByReference(ctx, reference)
	if err != nil {
		fmt.Printf("DEBUG: Database error looking up payment: %v\n", err)
		utils.ErrorResponse(c, 500, "Database error")
		return
	}
	if payment == nil {
		fmt.Printf("DEBUG: Payment not found in database for reference: %s\n", reference)
		utils.ErrorResponse(c, 404, "Payment not found")
		return
	}

	fmt.Printf("DEBUG: Found payment: %+v\n", payment)

	// Verify user owns this order
	order, err := h.orderRepo.GetByID(ctx, payment.OrderID)
	if err != nil || order == nil {
		fmt.Printf("DEBUG: Order not found for payment: %v\n", err)
		utils.ErrorResponse(c, 404, "Order not found")
		return
	}

	if order.UserID != userID {
		fmt.Printf("DEBUG: Access denied - user %s does not own order %s\n", userID, order.ID)
		utils.ErrorResponse(c, 403, "Access denied")
		return
	}

	paystackResp, err := h.paymentService.VerifyPayment(reference)
	if err != nil {
		fmt.Printf("DEBUG: Paystack verification failed: %v\n", err)
		utils.ErrorResponse(c, 500, "Failed to verify payment")
		return
	}

	responseJSON, _ := json.Marshal(paystackResp)
	fmt.Printf("DEBUG: Paystack response: %s\n", string(responseJSON))

	if paystackResp.Data.Status == "success" {
		fmt.Printf("DEBUG: Payment successful, updating order status to paid\n")
		// Update order status - this should succeed
		err = h.orderRepo.UpdateStatus(ctx, payment.OrderID, models.OrderStatusPaid, "Payment confirmed via Paystack", userID)
		if err != nil {
			fmt.Printf("DEBUG: Failed to update order status: %v\n", err)
			utils.ErrorResponse(c, 500, "Failed to update order status")
			return
		}
		fmt.Printf("DEBUG: Order status updated to paid successfully\n")

		// Update payment status
		err = h.paymentRepo.UpdateStatus(ctx, reference, models.PaymentStatusSuccess, string(responseJSON))
		if err != nil {
			fmt.Printf("DEBUG: Failed to update payment status: %v\n", err)
			// Don't return error here, order status was already updated
		}
	} else {
		fmt.Printf("DEBUG: Payment failed, status: %s\n", paystackResp.Data.Status)
		// Update order back to pending so user can retry
		err = h.orderRepo.UpdateStatus(ctx, payment.OrderID, models.OrderStatusPending, fmt.Sprintf("Payment verification failed: %s", paystackResp.Data.Status), userID)
		if err != nil {
			fmt.Printf("DEBUG: Failed to update order status to pending: %v\n", err)
		}

		// Update payment status to failed
		err = h.paymentRepo.UpdateStatus(ctx, reference, models.PaymentStatusFailed, string(responseJSON))
		if err != nil {
			fmt.Printf("DEBUG: Failed to update payment status to failed: %v\n", err)
		}
	}

	utils.SuccessResponse(c, 200, gin.H{
		"status":    paystackResp.Data.Status,
		"reference": reference,
		"message":   fmt.Sprintf("Payment %s", paystackResp.Data.Status),
	})
}

func (h *PaymentHandler) Webhook(c *gin.Context) {
	fmt.Printf("DEBUG: Webhook received\n")

	// Verify signature
	signature := c.GetHeader("x-paystack-signature")
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		fmt.Printf("DEBUG: Failed to read webhook body: %v\n", err)
		c.AbortWithStatus(400)
		return
	}

	fmt.Printf("DEBUG: Webhook signature: %s\n", signature)
	fmt.Printf("DEBUG: Webhook body: %s\n", string(body))

	mac := hmac.New(sha512.New, []byte(h.secretKey))
	mac.Write(body)
	expectedSig := hex.EncodeToString(mac.Sum(nil))

	fmt.Printf("DEBUG: Expected signature: %s\n", expectedSig)

	if signature != expectedSig {
		fmt.Printf("DEBUG: Invalid webhook signature\n")
		c.AbortWithStatus(401)
		return
	}

	var payload models.PaystackWebhookPayload
	if err := json.Unmarshal(body, &payload); err != nil {
		fmt.Printf("DEBUG: Failed to unmarshal webhook payload: %v\n", err)
		c.AbortWithStatus(400)
		return
	}

	fmt.Printf("DEBUG: Webhook event: %s\n", payload.Event)
	fmt.Printf("DEBUG: Webhook data: %+v\n", payload.Data)

	ctx := context.Background()

	if payload.Event == "charge.success" {
		payment, err := h.paymentRepo.GetByReference(ctx, payload.Data.Reference)
		if err != nil {
			fmt.Printf("DEBUG: Error looking up payment in webhook: %v\n", err)
			c.JSON(200, gin.H{"status": "ok"})
			return
		}
		if payment != nil {
			fmt.Printf("DEBUG: Processing successful charge for reference: %s\n", payload.Data.Reference)
			err = h.paymentRepo.UpdateStatus(ctx, payload.Data.Reference, models.PaymentStatusSuccess, string(body))
			if err != nil {
				fmt.Printf("DEBUG: Failed to update payment status in webhook: %v\n", err)
			}
			// Use system user (uuid.Nil) since this is from webhook
			err = h.orderRepo.UpdateStatus(ctx, payment.OrderID, models.OrderStatusPaid, "Payment confirmed via webhook", uuid.Nil)
			if err != nil {
				fmt.Printf("DEBUG: Failed to update order status in webhook: %v\n", err)
			}
			fmt.Printf("DEBUG: Order %s status updated to paid via webhook\n", payment.OrderID)
		} else {
			fmt.Printf("DEBUG: Payment not found for reference in webhook: %s\n", payload.Data.Reference)
		}
	}

	c.JSON(200, gin.H{"status": "ok"})
}
