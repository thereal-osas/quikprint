package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/quikprint/backend/config"
	"github.com/quikprint/backend/internal/database"
	"github.com/quikprint/backend/internal/handlers"
	"github.com/quikprint/backend/internal/middleware"
	"github.com/quikprint/backend/internal/repository"
	"github.com/quikprint/backend/internal/services"
	"github.com/quikprint/backend/internal/utils"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Initialize database
	db, err := database.New(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Pool.Close()

	// Initialize repositories
	userRepo := repository.NewUserRepository(db.Pool)
	categoryRepo := repository.NewCategoryRepository(db.Pool)
	pricingRepo := repository.NewPricingRepository(db.Pool)
	productRepo := repository.NewProductRepository(db.Pool, pricingRepo)
	cartRepo := repository.NewCartRepository(db.Pool)
	orderRepo := repository.NewOrderRepository(db.Pool)
	paymentRepo := repository.NewPaymentRepository(db.Pool)
	fileRepo := repository.NewFileRepository(db.Pool)
	reportRepo := repository.NewReportRepository(db.Pool)
	announcementRepo := repository.NewAnnouncementRepository(db.Pool)
	heroSlideRepo := repository.NewHeroSlideRepository(db.Pool)
	couponRepo := repository.NewCouponRepository(db.Pool)
	shippingConfigRepo := repository.NewShippingConfigRepository(db.Pool)

	// Initialize services
	pricingService := services.NewPricingService(productRepo, pricingRepo)
	paymentService := services.NewPaymentService(cfg.PaystackSecretKey, cfg.PaystackPublicKey)
	emailService := services.NewEmailService(
		cfg.SMTPHost, cfg.SMTPPort, cfg.SMTPUsername, cfg.SMTPPassword, cfg.SMTPFrom, cfg.SMTPFromName,
	)

	// Initialize JWT Manager
	jwtManager := utils.NewJWTManager(cfg.JWTSecret, cfg.JWTExpiryHours, cfg.JWTRefreshExpiryHours)

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(userRepo, orderRepo, jwtManager)
	categoryHandler := handlers.NewCategoryHandler(categoryRepo)
	productHandler := handlers.NewProductHandler(productRepo)
	pricingHandler := handlers.NewPricingHandler(pricingService, pricingRepo)
	cartHandler := handlers.NewCartHandler(cartRepo, productRepo, pricingService)
	orderHandler := handlers.NewOrderHandler(orderRepo, cartRepo, productRepo, pricingService, shippingConfigRepo)
	fileHandler := handlers.NewFileHandler(fileRepo, cfg.UploadDir, cfg.MaxUploadSizeMB*1024*1024)
	paymentHandler := handlers.NewPaymentHandler(paymentService, paymentRepo, orderRepo, cfg.PaystackSecretKey, cfg.PaystackCallbackURL)
	adminHandler := handlers.NewAdminHandler(reportRepo, userRepo, orderRepo)
	announcementHandler := handlers.NewAnnouncementHandler(announcementRepo)
	heroSlideHandler := handlers.NewHeroSlideHandler(heroSlideRepo)
	twoFactorHandler := handlers.NewTwoFactorHandler(userRepo)
	emailHandler := handlers.NewEmailHandler(emailService, userRepo)
	couponHandler := handlers.NewCouponHandler(couponRepo, cartRepo)
	shippingConfigHandler := handlers.NewShippingConfigHandler(shippingConfigRepo)

	// Auth middleware
	authMiddleware := middleware.NewAuthMiddleware(jwtManager)

	// Setup router
	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}
	router := gin.Default()

	// CORS configuration
	router.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.CORSAllowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// Serve uploaded files statically
	router.Static("/uploads", cfg.UploadDir)

	// API v1 routes
	v1 := router.Group("/api/v1")
	{
		// Public routes
		v1.POST("/auth/register", authHandler.Register)
		v1.POST("/auth/login", authHandler.Login)
		v1.POST("/auth/refresh", authHandler.RefreshToken)
		v1.POST("/auth/verify-2fa", authHandler.VerifyTwoFactorLogin)

		v1.GET("/categories", categoryHandler.GetAll)
		v1.GET("/categories/:slug", categoryHandler.GetBySlug)

		v1.GET("/products", productHandler.GetAll)
		v1.GET("/products/:slug", productHandler.GetBySlug)

		v1.GET("/pricing/products/:id", pricingHandler.GetPricingRules)
		v1.POST("/pricing/calculate", pricingHandler.CalculatePrice)

		// Public shipping config endpoint
		v1.GET("/shipping-config", shippingConfigHandler.GetShippingConfigPublic)

		// Public announcements and hero slides
		v1.GET("/announcements", announcementHandler.GetActiveAnnouncements)
		v1.GET("/hero-slides", heroSlideHandler.GetActiveHeroSlides)

		// Webhook (no auth)
		v1.POST("/payments/webhook", paymentHandler.Webhook)

		// Protected routes
		protected := v1.Group("")
		protected.Use(authMiddleware.RequireAuth())
		{
			protected.GET("/auth/me", authHandler.GetProfile)

			// 2FA routes
			protected.GET("/auth/2fa/status", twoFactorHandler.GetStatus)
			protected.POST("/auth/2fa/setup", twoFactorHandler.GenerateSetup)
			protected.POST("/auth/2fa/enable", twoFactorHandler.VerifyAndEnable)
			protected.POST("/auth/2fa/disable", twoFactorHandler.Disable)

			protected.GET("/cart", cartHandler.GetCart)
			protected.POST("/cart/items", cartHandler.AddItem)
			protected.PUT("/cart/items/:id", cartHandler.UpdateItem)
			protected.DELETE("/cart/items/:id", cartHandler.DeleteItem)

			protected.POST("/orders", orderHandler.CreateOrder)
			protected.GET("/orders", orderHandler.GetOrders)
			protected.GET("/orders/:id", orderHandler.GetOrder)

			protected.POST("/files/upload", fileHandler.Upload)

			protected.POST("/payments/initialize", paymentHandler.InitializePayment)
			protected.GET("/payments/verify/:reference", paymentHandler.VerifyPayment)

			// Coupons
			protected.POST("/coupons/apply", couponHandler.Apply)
		}

		// Admin & Manager routes (most features)
		admin := v1.Group("/admin")
		admin.Use(authMiddleware.RequireAuth(), authMiddleware.RequireManagerOrAdmin())
		{
			admin.GET("/categories", categoryHandler.GetAll)
			admin.POST("/categories", categoryHandler.Create)
			admin.PUT("/categories/:id", categoryHandler.Update)
			admin.DELETE("/categories/:id", categoryHandler.Delete)

			admin.GET("/products", productHandler.GetAll)
			admin.POST("/products", productHandler.Create)
			admin.PUT("/products/:id", productHandler.Update)
			admin.DELETE("/products/:id", productHandler.Delete)
			admin.POST("/products/bulk-update-price", productHandler.BulkUpdatePrice)

			admin.GET("/orders", orderHandler.GetAllOrders)
			admin.PUT("/orders/:id/status", orderHandler.UpdateOrderStatus)

			admin.GET("/customers", adminHandler.GetCustomers)
			admin.GET("/dashboard", adminHandler.GetDashboardStats)
			admin.GET("/reports/daily", adminHandler.GetDailySalesReport)
			admin.GET("/reports/weekly", adminHandler.GetWeeklySalesReport)
			admin.GET("/reports/orders-by-status", adminHandler.GetOrdersByStatusReport)

			// Pricing management routes
			admin.GET("/products/:id/pricing", pricingHandler.GetPricingRules)
			admin.POST("/products/:id/dimensional-pricing", pricingHandler.SetDimensionalPricing)
			admin.DELETE("/products/:id/dimensional-pricing", pricingHandler.DeleteDimensionalPricing)
			admin.POST("/products/:id/pricing-tiers", pricingHandler.SetPricingTiers)
			admin.DELETE("/products/:id/pricing-tiers", pricingHandler.DeletePricingTiers)

			// Announcement management routes
			admin.GET("/announcements", announcementHandler.GetAllAnnouncements)
			admin.GET("/announcements/:id", announcementHandler.GetAnnouncement)
			admin.POST("/announcements", announcementHandler.CreateAnnouncement)
			admin.PUT("/announcements/:id", announcementHandler.UpdateAnnouncement)
			admin.DELETE("/announcements/:id", announcementHandler.DeleteAnnouncement)

			// Hero slides management routes
			admin.GET("/hero-slides", heroSlideHandler.GetAllHeroSlides)
			admin.GET("/hero-slides/:id", heroSlideHandler.GetHeroSlide)
			admin.POST("/hero-slides", heroSlideHandler.CreateHeroSlide)
			admin.PUT("/hero-slides/:id", heroSlideHandler.UpdateHeroSlide)
			admin.DELETE("/hero-slides/:id", heroSlideHandler.DeleteHeroSlide)

			// Email management routes
			admin.GET("/email/status", emailHandler.GetEmailStatus)
			admin.POST("/email/test", emailHandler.SendTestEmail)
			admin.POST("/email/broadcast", emailHandler.SendBroadcastEmail)

			// Coupon management routes
			admin.GET("/coupons", couponHandler.GetAll)
			admin.GET("/coupons/:id", couponHandler.GetByID)
			admin.POST("/coupons", couponHandler.Create)
			admin.PUT("/coupons/:id", couponHandler.Update)
			admin.DELETE("/coupons/:id", couponHandler.Delete)

			// Shipping config management routes
			admin.GET("/shipping-config", shippingConfigHandler.GetShippingConfig)
			admin.PUT("/shipping-config", shippingConfigHandler.UpdateShippingConfig)
		}

		// Admin-only routes (User Roles and Security features)
		adminOnly := v1.Group("/admin")
		adminOnly.Use(authMiddleware.RequireAuth(), authMiddleware.RequireAdmin())
		{
			// User management routes (admin only)
			adminOnly.GET("/users", adminHandler.GetAllUsers)
			adminOnly.PUT("/users/:id/role", adminHandler.UpdateUserRole)
		}
	}

	// Start server
	srv := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: router,
	}

	go func() {
		log.Printf("Server starting on port %s", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown:", err)
	}
	log.Println("Server exited")
}
