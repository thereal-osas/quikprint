package repository

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/quikprint/backend/internal/models"
)

type ReportRepository struct {
	db *pgxpool.Pool
}

func NewReportRepository(db *pgxpool.Pool) *ReportRepository {
	return &ReportRepository{db: db}
}

func (r *ReportRepository) GetDailySales(ctx context.Context, days int) ([]models.DailySalesReport, error) {
	query := `
		SELECT 
			DATE(created_at) as date,
			COUNT(*) as order_count,
			COALESCE(SUM(total), 0) as total_sales,
			COALESCE(AVG(total), 0) as avg_order_value
		FROM orders
		WHERE created_at >= CURRENT_DATE - $1::interval
		AND status NOT IN ('cancelled')
		GROUP BY DATE(created_at)
		ORDER BY date DESC
	`
	rows, err := r.db.Query(ctx, query, time.Duration(days)*24*time.Hour)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var reports []models.DailySalesReport
	for rows.Next() {
		var report models.DailySalesReport
		if err := rows.Scan(&report.Date, &report.OrderCount, &report.TotalSales, &report.AvgOrderVal); err != nil {
			return nil, err
		}
		reports = append(reports, report)
	}
	return reports, nil
}

func (r *ReportRepository) GetWeeklySales(ctx context.Context, weeks int) ([]models.WeeklySalesReport, error) {
	query := `
		SELECT 
			DATE_TRUNC('week', created_at) as week_start,
			DATE_TRUNC('week', created_at) + INTERVAL '6 days' as week_end,
			COUNT(*) as order_count,
			COALESCE(SUM(total), 0) as total_sales,
			COALESCE(AVG(total), 0) as avg_order_value
		FROM orders
		WHERE created_at >= CURRENT_DATE - $1::interval
		AND status NOT IN ('cancelled')
		GROUP BY DATE_TRUNC('week', created_at)
		ORDER BY week_start DESC
	`
	rows, err := r.db.Query(ctx, query, time.Duration(weeks*7)*24*time.Hour)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var reports []models.WeeklySalesReport
	for rows.Next() {
		var report models.WeeklySalesReport
		if err := rows.Scan(&report.WeekStart, &report.WeekEnd, &report.OrderCount, &report.TotalSales, &report.AvgOrderVal); err != nil {
			return nil, err
		}
		reports = append(reports, report)
	}
	return reports, nil
}

func (r *ReportRepository) GetOrdersByStatus(ctx context.Context) ([]models.OrdersByStatusReport, error) {
	query := `
		SELECT 
			status,
			COUNT(*) as order_count,
			COALESCE(SUM(total), 0) as total_value
		FROM orders
		GROUP BY status
		ORDER BY order_count DESC
	`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var reports []models.OrdersByStatusReport
	for rows.Next() {
		var report models.OrdersByStatusReport
		if err := rows.Scan(&report.Status, &report.OrderCount, &report.TotalValue); err != nil {
			return nil, err
		}
		reports = append(reports, report)
	}
	return reports, nil
}

