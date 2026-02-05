package handlers

import (
	"context"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/quikprint/backend/internal/repository"
	"github.com/quikprint/backend/internal/utils"
)

type AdminHandler struct {
	reportRepo *repository.ReportRepository
	userRepo   *repository.UserRepository
}

func NewAdminHandler(reportRepo *repository.ReportRepository, userRepo *repository.UserRepository) *AdminHandler {
	return &AdminHandler{reportRepo: reportRepo, userRepo: userRepo}
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

	utils.SuccessResponse(c, 200, users)
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

