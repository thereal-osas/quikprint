package config

import (
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	Port                  string
	Environment           string
	DatabaseURL           string
	JWTSecret             string
	JWTExpiryHours        int
	JWTRefreshExpiryHours int
	PaystackSecretKey     string
	PaystackPublicKey     string
	PaystackCallbackURL   string
	UploadDir             string
	MaxUploadSizeMB       int64
	CORSAllowedOrigins    []string
	AdminEmail            string
	AdminPassword         string
	// Shipping Configuration
	ShippingFee           float64
	FreeShippingThreshold float64
	// SMTP Configuration
	SMTPHost     string
	SMTPPort     int
	SMTPUsername string
	SMTPPassword string
	SMTPFrom     string
	SMTPFromName string
}

func Load() (*Config, error) {
	// Load .env file if it exists
	_ = godotenv.Load()

	jwtExpiry, _ := strconv.Atoi(getEnv("JWT_EXPIRY_HOURS", "24"))
	jwtRefreshExpiry, _ := strconv.Atoi(getEnv("JWT_REFRESH_EXPIRY_HOURS", "168"))
	maxUploadSize, _ := strconv.ParseInt(getEnv("MAX_UPLOAD_SIZE_MB", "50"), 10, 64)
	smtpPort, _ := strconv.Atoi(getEnv("SMTP_PORT", "465"))
	shippingFee, _ := strconv.ParseFloat(getEnv("SHIPPING_FEE", "5000"), 64)
	freeShippingThreshold, _ := strconv.ParseFloat(getEnv("FREE_SHIPPING_THRESHOLD", "50000"), 64)

	corsOrigins := strings.Split(getEnv("CORS_ALLOWED_ORIGINS", "http://localhost:5173"), ",")

	return &Config{
		Port:                  getEnv("PORT", "8080"),
		Environment:           getEnv("ENVIRONMENT", "development"),
		DatabaseURL:           getEnv("DATABASE_URL", "postgres://postgres:password@localhost:5432/quikprint?sslmode=disable"),
		JWTSecret:             getEnv("JWT_SECRET", "default-secret-change-me"),
		JWTExpiryHours:        jwtExpiry,
		JWTRefreshExpiryHours: jwtRefreshExpiry,
		PaystackSecretKey:     getEnv("PAYSTACK_SECRET_KEY", ""),
		PaystackPublicKey:     getEnv("PAYSTACK_PUBLIC_KEY", ""),
		PaystackCallbackURL:   getEnv("PAYSTACK_CALLBACK_URL", "http://localhost:5173/checkout/callback"),
		UploadDir:             getEnv("UPLOAD_DIR", "./uploads"),
		MaxUploadSizeMB:       maxUploadSize,
		CORSAllowedOrigins:    corsOrigins,
		AdminEmail:            getEnv("ADMIN_EMAIL", "admin@quikprint.com"),
		AdminPassword:         getEnv("ADMIN_PASSWORD", "admin123"),
		// Shipping Configuration
		ShippingFee:           shippingFee,
		FreeShippingThreshold: freeShippingThreshold,
		// SMTP Configuration
		SMTPHost:     getEnv("SMTP_HOST", "smtp.hostinger.com"),
		SMTPPort:     smtpPort,
		SMTPUsername: getEnv("SMTP_USERNAME", ""),
		SMTPPassword: getEnv("SMTP_PASSWORD", ""),
		SMTPFrom:     getEnv("SMTP_FROM", "noreply@quikprint.ng"),
		SMTPFromName: getEnv("SMTP_FROM_NAME", "QuikPrint NG"),
	}, nil
}

func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}
