package models

import "time"

type DailySalesReport struct {
	Date        time.Time `json:"date"`
	OrderCount  int       `json:"orderCount"`
	TotalSales  float64   `json:"totalSales"`
	AvgOrderVal float64   `json:"avgOrderValue"`
}

type WeeklySalesReport struct {
	WeekStart   time.Time `json:"weekStart"`
	WeekEnd     time.Time `json:"weekEnd"`
	OrderCount  int       `json:"orderCount"`
	TotalSales  float64   `json:"totalSales"`
	AvgOrderVal float64   `json:"avgOrderValue"`
}

type OrdersByStatusReport struct {
	Status     string `json:"status"`
	OrderCount int    `json:"orderCount"`
	TotalValue float64 `json:"totalValue"`
}

