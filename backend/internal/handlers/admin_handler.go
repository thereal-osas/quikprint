package handlers

import (
	"context"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/quikprint/backend/internal/models"
	"github.com/quikprint/backend/internal/repository"
	"github.com/quikprint/backend/internal/utils"
)

type AdminHandler struct {
	reportRepo *repository.ReportRepository
	userRepo   *repository.UserRepository
	orderRepo  *repository.OrderRepository
}

func NewAdminHandler(reportRepo *repository.ReportRepository, userRepo *repository.UserRepository, orderRepo *repository.OrderRepository) *AdminHandler {
	return &AdminHandler{reportRepo: reportRepo, userRepo: userRepo, orderRepo: orderRepo}
}

func (h *AdminHandler) GetDailySalesReport(c *gin.Context) {
	days := 30
	if d := c.Query("days"); d != "" {
		if parsed, err := strconv.Atoi(d); err == nil && parsed > 0 {
			days = parsed
		}
	}

	ctx := context.Background()
	reports, err := h.reportRepo.GetDailySales(ctx, days)
	if err != nil {
		utils.ErrorResponse(c, 500, "Failed to fetch daily sales report")
		return
	}

	utils.SuccessResponse(c, 200, reports)
}

func (h *AdminHandler) GetWeeklySalesReport(c *gin.Context) {
	weeks := 12
	if w := c.Query("weeks"); w != "" {
		if parsed, err := strconv.Atoi(w); err == nil && parsed > 0 {
			weeks = parsed
		}
	}

	ctx := context.Background()
	reports, err := h.reportRepo.GetWeeklySales(ctx, weeks)
	if err != nil {
		utils.ErrorResponse(c, 500, "Failed to fetch weekly sales report")
		return
	}

	utils.SuccessResponse(c, 200, reports)
}

func (h *AdminHandler) GetOrdersByStatusReport(c *gin.Context) {
	ctx := context.Background()
	reports, err := h.reportRepo.GetOrdersByStatus(ctx)
	if err != nil {
		utils.ErrorResponse(c, 500, "Failed to fetch orders by status report")
		return
	}

	utils.SuccessResponse(c, 200, reports)
}

func (h *AdminHandler) GetCustomers(c *gin.Context) {
	ctx := context.Background()
	users, err := h.userRepo.GetAllCustomers(ctx)
	if err != nil {
		utils.ErrorResponse(c, 500, "Failed to fetch customers")
		return
	}

	// Create response with order stats for each customer
	type CustomerWithStats struct {
		ID          uuid.UUID   `json:"id"`
		Email       string      `json:"email"`
		FirstName   string      `json:"firstName"`
		LastName    string      `json:"lastName"`
		Phone       string      `json:"phone,omitempty"`
		Role        string      `json:"role"`
		CreatedAt   interface{} `json:"createdAt"`
		TotalOrders int         `json:"totalOrders"`
		TotalSpent  float64     `json:"totalSpent"`
	}

	var customersWithStats []CustomerWithStats
	for _, user := range users {
		stats, _ := h.orderRepo.GetUserOrderStats(ctx, user.ID)
		totalOrders := 0
		totalSpent := 0.0
		if stats != nil {
			totalOrders = stats.TotalOrders
			totalSpent = stats.TotalSpent
		}

		customersWithStats = append(customersWithStats, CustomerWithStats{
			ID:          user.ID,
			Email:       user.Email,
			FirstName:   user.FirstName,
			LastName:    user.LastName,
			Phone:       user.Phone,
			Role:        string(user.Role),
			CreatedAt:   user.CreatedAt,
			TotalOrders: totalOrders,
			TotalSpent:  totalSpent,
		})
	}

	utils.SuccessResponse(c, 200, customersWithStats)
}

func (h *AdminHandler) GetDashboardStats(c *gin.Context) {
	ctx := context.Background()

	// Get today's stats
	dailySales, _ := h.reportRepo.GetDailySales(ctx, 1)
	ordersByStatus, _ := h.reportRepo.GetOrdersByStatus(ctx)

	var todayOrders int
	var todaySales float64
	if len(dailySales) > 0 {
		todayOrders = dailySales[0].OrderCount
		todaySales = dailySales[0].TotalSales
	}

	// Calculate totals from status report
	var totalOrders int
	var pendingOrders int
	for _, s := range ordersByStatus {
		totalOrders += s.OrderCount
		if s.Status == "pending" || s.Status == "awaiting_payment" || s.Status == "processing" {
			pendingOrders += s.OrderCount
		}
	}

	utils.SuccessResponse(c, 200, gin.H{
		"todayOrders":    todayOrders,
		"todaySales":     todaySales,
		"totalOrders":    totalOrders,
		"pendingOrders":  pendingOrders,
		"ordersByStatus": ordersByStatus,
	})
}

// GetAllUsers returns all users for role management (admin only)
func (h *AdminHandler) GetAllUsers(c *gin.Context) {
	ctx := context.Background()
	users, err := h.userRepo.GetAll(ctx)
	if err != nil {
		utils.ErrorResponse(c, 500, "Failed to fetch users")
		return
	}

	// Convert to UserListResponse to exclude sensitive data
	var response []models.UserListResponse
	for _, u := range users {
		response = append(response, models.UserListResponse{
			ID:        u.ID,
			Email:     u.Email,
			FirstName: u.FirstName,
			LastName:  u.LastName,
			Phone:     u.Phone,
			Role:      u.Role,
			CreatedAt: u.CreatedAt,
			UpdatedAt: u.UpdatedAt,
		})
	}

	utils.SuccessResponse(c, 200, response)
}

// UpdateUserRole changes a user's role (admin only)
func (h *AdminHandler) UpdateUserRole(c *gin.Context) {
	userIDStr := c.Param("id")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		utils.ValidationErrorResponse(c, "Invalid user ID")
		return
	}

	var req models.UpdateUserRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, err.Error())
		return
	}

	// Validate role
	if !models.IsValidRole(req.Role) {
		utils.ValidationErrorResponse(c, "Invalid role. Must be customer, manager, or admin")
		return
	}

	ctx := context.Background()

	// Get current user (the one making the request)
	currentUserID, _ := c.Get("userID")
	currentRole, _ := c.Get("userRole")

	// Prevent users from changing their own role
	if currentUserID == userID {
		utils.ErrorResponse(c, 403, "You cannot change your own role")
		return
	}

	// Get target user
	targetUser, err := h.userRepo.GetByID(ctx, userID)
	if err != nil || targetUser == nil {
		utils.ErrorResponse(c, 404, "User not found")
		return
	}

	// Only admins can create other admins
	newRole := models.UserRole(req.Role)
	if newRole == models.RoleAdmin && currentRole != models.RoleAdmin {
		utils.ErrorResponse(c, 403, "Only admins can promote users to admin")
		return
	}

	// Prevent demoting other admins (only the super-admin or themselves should be able to)
	if targetUser.Role == models.RoleAdmin && currentRole != models.RoleAdmin {
		utils.ErrorResponse(c, 403, "Cannot modify admin users")
		return
	}

	// Update the role
	if err := h.userRepo.UpdateRole(ctx, userID, newRole); err != nil {
		utils.ErrorResponse(c, 500, "Failed to update user role")
		return
	}

	// Return updated user
	targetUser.Role = newRole
	utils.SuccessResponse(c, 200, models.UserListResponse{
		ID:        targetUser.ID,
		Email:     targetUser.Email,
		FirstName: targetUser.FirstName,
		LastName:  targetUser.LastName,
		Phone:     targetUser.Phone,
		Role:      targetUser.Role,
		CreatedAt: targetUser.CreatedAt,
		UpdatedAt: targetUser.UpdatedAt,
	})
}
