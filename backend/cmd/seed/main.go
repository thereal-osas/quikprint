package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/quikprint/backend/config"
	"github.com/quikprint/backend/internal/models"
	"github.com/quikprint/backend/internal/utils"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}
	ctx := context.Background()

	pool, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer pool.Close()

	fmt.Println("Seeding database...")

	// Seed admin user
	if err := seedAdminUser(ctx, pool); err != nil {
		log.Printf("Error seeding admin user: %v", err)
	}

	// Seed categories
	categoryIDs, err := seedCategories(ctx, pool)
	if err != nil {
		log.Fatalf("Failed to seed categories: %v", err)
	}

	// Seed products
	if err := seedProducts(ctx, pool, categoryIDs); err != nil {
		log.Fatalf("Failed to seed products: %v", err)
	}

	fmt.Println("Database seeding completed successfully!")
}

func seedAdminUser(ctx context.Context, pool *pgxpool.Pool) error {
	// Check if admin exists
	var count int
	err := pool.QueryRow(ctx, `SELECT COUNT(*) FROM users WHERE role = 'admin'`).Scan(&count)
	if err != nil {
		return err
	}
	if count > 0 {
		fmt.Println("Admin user already exists, skipping...")
		return nil
	}

	hashedPassword, _ := utils.HashPassword("admin123")
	query := `
		INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`
	_, err = pool.Exec(ctx, query,
		uuid.New(), "admin@quikprint.com", hashedPassword,
		"Admin", "User", "+234000000000", models.RoleAdmin,
		time.Now(), time.Now(),
	)
	if err != nil {
		return err
	}
	fmt.Println("Created admin user: admin@quikprint.com / admin123")
	return nil
}

type categoryData struct {
	Name        string
	Slug        string
	Description string
	Image       string
}

func seedCategories(ctx context.Context, pool *pgxpool.Pool) (map[string]uuid.UUID, error) {
	categories := []categoryData{
		{"Business Cards", "business-cards", "Professional business cards with premium finishes and lamination options", "/images/business-cards.jpg"},
		{"Marketing Brochures", "marketing-brochures", "High-quality brochures for marketing and corporate communications", "/images/brochures.jpg"},
		{"Flyers and Handbills", "flyers-handbills", "Eye-catching flyers for events, promotions, and marketing", "/images/flyers.jpg"},
		{"Banners and Large Format", "banners-large-format", "Large format printing including banners, roll-ups, and signage", "/images/banners.jpg"},
		{"Posters", "posters", "High-resolution posters in various sizes for advertising and decoration", "/images/posters.jpg"},
		{"Calendars", "calendars", "Custom wall and desk calendars for year-round branding", "/images/calendars.jpg"},
		{"Custom T-shirts", "custom-tshirts", "Quality custom printed t-shirts for events and branding", "/images/tshirts.jpg"},
		{"Wedding Stationery", "wedding-stationery", "Elegant wedding invitations and event stationery", "/images/wedding.jpg"},
	}

	categoryIDs := make(map[string]uuid.UUID)

	for _, cat := range categories {
		// Check if exists
		var existingID uuid.UUID
		err := pool.QueryRow(ctx, `SELECT id FROM categories WHERE slug = $1`, cat.Slug).Scan(&existingID)
		if err == nil {
			categoryIDs[cat.Slug] = existingID
			fmt.Printf("Category '%s' already exists, skipping...\n", cat.Name)
			continue
		}

		id := uuid.New()
		query := `INSERT INTO categories (id, name, slug, description, image, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7)`
		_, err = pool.Exec(ctx, query, id, cat.Name, cat.Slug, cat.Description, cat.Image, time.Now(), time.Now())
		if err != nil {
			return nil, fmt.Errorf("failed to insert category %s: %w", cat.Name, err)
		}
		categoryIDs[cat.Slug] = id
		fmt.Printf("Created category: %s\n", cat.Name)
	}

	return categoryIDs, nil
}

type productData struct {
	Name             string
	Slug             string
	CategorySlug     string
	Description      string
	ShortDescription string
	BasePrice        float64
	Images           []string
	Features         []string
	Turnaround       string
	MinQuantity      int
	Options          []models.ProductOption
}

func seedProducts(ctx context.Context, pool *pgxpool.Pool, categoryIDs map[string]uuid.UUID) error {
	products := getProductsData()

	for _, prod := range products {
		var existingID uuid.UUID
		err := pool.QueryRow(ctx, `SELECT id FROM products WHERE slug = $1`, prod.Slug).Scan(&existingID)
		if err == nil {
			fmt.Printf("Product '%s' already exists, skipping...\n", prod.Name)
			continue
		}

		categoryID := categoryIDs[prod.CategorySlug]
		imagesJSON, _ := json.Marshal(prod.Images)
		featuresJSON, _ := json.Marshal(prod.Features)
		optionsJSON, _ := json.Marshal(prod.Options)

		query := `
			INSERT INTO products (id, name, slug, category_id, description, short_description, base_price, images, features, options, turnaround, min_quantity, created_at, updated_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
		`
		_, err = pool.Exec(ctx, query,
			uuid.New(), prod.Name, prod.Slug, categoryID, prod.Description, prod.ShortDescription,
			prod.BasePrice, imagesJSON, featuresJSON, optionsJSON, prod.Turnaround, prod.MinQuantity,
			time.Now(), time.Now(),
		)
		if err != nil {
			return fmt.Errorf("failed to insert product %s: %w", prod.Name, err)
		}
		fmt.Printf("Created product: %s\n", prod.Name)
	}

	return nil
}

func getProductsData() []productData {
	return []productData{
		{
			Name:             "Premium Business Cards",
			Slug:             "premium-business-cards",
			CategorySlug:     "business-cards",
			Description:      "Make a lasting impression with our premium business cards. Printed on high-quality cardstock with vibrant colors and sharp details. Choose from multiple paper stocks and lamination options.",
			ShortDescription: "Professional business cards that make lasting impressions",
			BasePrice:        8500,
			Images:           []string{"/images/business-cards.jpg"},
			Features:         []string{"Full color printing (CMYK)", "Premium 350gsm cardstock", "Matte or gloss lamination", "Fast 2-3 day turnaround"},
			Turnaround:       "2-3 business days",
			MinQuantity:      100,
			Options: []models.ProductOption{
				{ID: "paper", Name: "Paper Stock", Type: models.OptionTypeSelect, Options: []models.ProductOptionValue{
					{Value: "300gsm", Label: "300gsm Cardstock", PriceModifier: ptrFloat(0)},
					{Value: "350gsm", Label: "350gsm Premium", PriceModifier: ptrFloat(2000)},
					{Value: "400gsm", Label: "400gsm Ultra Thick", PriceModifier: ptrFloat(4000)},
				}},
				{ID: "finish", Name: "Finish", Type: models.OptionTypeSelect, Options: []models.ProductOptionValue{
					{Value: "matte", Label: "Matte Lamination", PriceModifier: ptrFloat(0)},
					{Value: "gloss", Label: "Gloss Lamination", PriceModifier: ptrFloat(1500)},
					{Value: "soft-touch", Label: "Soft Touch Laminate", PriceModifier: ptrFloat(3500)},
				}},
				{ID: "quantity", Name: "Quantity", Type: models.OptionTypeSelect, Options: []models.ProductOptionValue{
					{Value: "100", Label: "100 cards", PriceModifier: ptrFloat(0)},
					{Value: "250", Label: "250 cards", PriceModifier: ptrFloat(4000)},
					{Value: "500", Label: "500 cards", PriceModifier: ptrFloat(7500)},
					{Value: "1000", Label: "1,000 cards", PriceModifier: ptrFloat(12000)},
				}},
			},
		},
		{
			Name:             "A3 Bi-Fold Brochures",
			Slug:             "a3-bifold-brochures",
			CategorySlug:     "marketing-brochures",
			Description:      "Professional A3 bi-fold brochures perfect for marketing campaigns, product catalogs, and company profiles. Printed on premium art paper with sharp, vivid colors.",
			ShortDescription: "Professional A3 bi-fold brochures for marketing",
			BasePrice:        19000,
			Images:           []string{"/images/brochures.jpg"},
			Features:         []string{"Full color printing both sides", "Professional folding included", "Art paper or cardstock options", "High-resolution printing"},
			Turnaround:       "3-5 business days",
			MinQuantity:      50,
			Options: []models.ProductOption{
				{ID: "paper", Name: "Paper Stock", Type: models.OptionTypeSelect, Options: []models.ProductOptionValue{
					{Value: "art-150", Label: "150gsm Art Paper", PriceModifier: ptrFloat(0)},
					{Value: "art-200", Label: "200gsm Art Paper", PriceModifier: ptrFloat(5000)},
					{Value: "card-300", Label: "300gsm Cardstock", PriceModifier: ptrFloat(8000)},
				}},
				{ID: "quantity", Name: "Quantity", Type: models.OptionTypeSelect, Options: []models.ProductOptionValue{
					{Value: "50", Label: "50 brochures", PriceModifier: ptrFloat(0)},
					{Value: "100", Label: "100 brochures", PriceModifier: ptrFloat(12000)},
					{Value: "250", Label: "250 brochures", PriceModifier: ptrFloat(28000)},
				}},
			},
		},
		{
			Name:             "Custom Flyers and Handbills",
			Slug:             "flyers-handbills",
			CategorySlug:     "flyers-handbills",
			Description:      "High-impact flyers and handbills for events, promotions, and marketing campaigns. Printed on quality paper with vibrant colors.",
			ShortDescription: "Eye-catching flyers for effective marketing",
			BasePrice:        12000,
			Images:           []string{"/images/flyers.jpg"},
			Features:         []string{"Full color printing", "Multiple size options", "Fast turnaround available", "Bulk discounts"},
			Turnaround:       "2-3 business days",
			MinQuantity:      100,
			Options: []models.ProductOption{
				{ID: "size", Name: "Size", Type: models.OptionTypeSelect, Options: []models.ProductOptionValue{
					{Value: "a5", Label: "A5 (148 x 210mm)", PriceModifier: ptrFloat(0)},
					{Value: "a4", Label: "A4 (210 x 297mm)", PriceModifier: ptrFloat(5000)},
					{Value: "dl", Label: "DL (99 x 210mm)", PriceModifier: ptrFloat(-2000)},
				}},
				{ID: "quantity", Name: "Quantity", Type: models.OptionTypeSelect, Options: []models.ProductOptionValue{
					{Value: "100", Label: "100 flyers", PriceModifier: ptrFloat(0)},
					{Value: "250", Label: "250 flyers", PriceModifier: ptrFloat(8000)},
					{Value: "500", Label: "500 flyers", PriceModifier: ptrFloat(15000)},
					{Value: "1000", Label: "1,000 flyers", PriceModifier: ptrFloat(25000)},
				}},
			},
		},
		{
			Name:             "A-Frame Signs",
			Slug:             "a-frame-signs",
			CategorySlug:     "banners-large-format",
			Description:      "Durable A-frame signs perfect for storefronts, events, and outdoor promotions. Double-sided display with weather-resistant materials.",
			ShortDescription: "Double-sided A-frame signs for outdoor advertising",
			BasePrice:        8250,
			Images:           []string{"/images/banners.jpg"},
			Features:         []string{"Double-sided display", "Weather-resistant material", "Easy to set up and fold", "Portable and lightweight"},
			Turnaround:       "3-5 business days",
			MinQuantity:      1,
			Options: []models.ProductOption{
				{ID: "size", Name: "Size", Type: models.OptionTypeSelect, Options: []models.ProductOptionValue{
					{Value: "small", Label: "Small (60x90cm)", PriceModifier: ptrFloat(0)},
					{Value: "medium", Label: "Medium (80x120cm)", PriceModifier: ptrFloat(5000)},
					{Value: "large", Label: "Large (100x150cm)", PriceModifier: ptrFloat(10000)},
				}},
			},
		},
		{
			Name:             "A1 Posters",
			Slug:             "a1-posters",
			CategorySlug:     "posters",
			Description:      "High-quality A1 size posters perfect for advertising, events, and decorations. Printed with vibrant colors on premium poster paper.",
			ShortDescription: "Large format A1 posters for maximum visibility",
			BasePrice:        8000,
			Images:           []string{"/images/posters.jpg"},
			Features:         []string{"A1 size (594 x 841mm)", "Full color high-resolution printing", "Premium poster paper", "Indoor use recommended"},
			Turnaround:       "2-3 business days",
			MinQuantity:      1,
			Options: []models.ProductOption{
				{ID: "paper", Name: "Paper Type", Type: models.OptionTypeSelect, Options: []models.ProductOptionValue{
					{Value: "gloss", Label: "Gloss Art Paper", PriceModifier: ptrFloat(0)},
					{Value: "matte", Label: "Matte Art Paper", PriceModifier: ptrFloat(1000)},
					{Value: "photo", Label: "Photo Paper", PriceModifier: ptrFloat(3000)},
				}},
				{ID: "quantity", Name: "Quantity", Type: models.OptionTypeSelect, Options: []models.ProductOptionValue{
					{Value: "1", Label: "1 poster", PriceModifier: ptrFloat(0)},
					{Value: "5", Label: "5 posters", PriceModifier: ptrFloat(25000)},
					{Value: "10", Label: "10 posters", PriceModifier: ptrFloat(45000)},
				}},
			},
		},
		{
			Name:             "A2 Wall Calendars",
			Slug:             "a2-wall-calendars",
			CategorySlug:     "calendars",
			Description:      "Beautiful custom A2 wall calendars perfect for year-round branding. Each month features your custom design. Great for corporate gifts.",
			ShortDescription: "Custom A2 wall calendars with 7 or 13 sheets",
			BasePrice:        19000,
			Images:           []string{"/images/calendars.jpg"},
			Features:         []string{"A2 size for high visibility", "Full color printing", "Wire-O binding included", "Custom design each month"},
			Turnaround:       "5-7 business days",
			MinQuantity:      25,
			Options: []models.ProductOption{
				{ID: "sheets", Name: "Number of Sheets", Type: models.OptionTypeSelect, Options: []models.ProductOptionValue{
					{Value: "7", Label: "7 Sheets (Bi-monthly)", PriceModifier: ptrFloat(0)},
					{Value: "13", Label: "13 Sheets (Monthly)", PriceModifier: ptrFloat(5000)},
				}},
				{ID: "quantity", Name: "Quantity", Type: models.OptionTypeSelect, Options: []models.ProductOptionValue{
					{Value: "25", Label: "25 calendars", PriceModifier: ptrFloat(0)},
					{Value: "50", Label: "50 calendars", PriceModifier: ptrFloat(35000)},
					{Value: "100", Label: "100 calendars", PriceModifier: ptrFloat(65000)},
				}},
			},
		},
		{
			Name:             "Custom T-Shirts",
			Slug:             "custom-tshirts",
			CategorySlug:     "custom-tshirts",
			Description:      "High-quality custom printed t-shirts for events, corporate branding, and promotional use. Available in various colors and sizes.",
			ShortDescription: "Quality custom printed t-shirts for all occasions",
			BasePrice:        4500,
			Images:           []string{"/images/tshirts.jpg"},
			Features:         []string{"Premium cotton material", "Durable screen printing", "Multiple color options", "Sizes from S to 3XL"},
			Turnaround:       "5-7 business days",
			MinQuantity:      12,
			Options: []models.ProductOption{
				{ID: "color", Name: "T-Shirt Color", Type: models.OptionTypeSelect, Options: []models.ProductOptionValue{
					{Value: "white", Label: "White", PriceModifier: ptrFloat(0)},
					{Value: "black", Label: "Black", PriceModifier: ptrFloat(500)},
					{Value: "navy", Label: "Navy Blue", PriceModifier: ptrFloat(500)},
				}},
				{ID: "quantity", Name: "Quantity", Type: models.OptionTypeSelect, Options: []models.ProductOptionValue{
					{Value: "12", Label: "12 shirts", PriceModifier: ptrFloat(0)},
					{Value: "25", Label: "25 shirts", PriceModifier: ptrFloat(45000)},
					{Value: "50", Label: "50 shirts", PriceModifier: ptrFloat(95000)},
				}},
			},
		},
		{
			Name:             "Wedding Invitation Cards",
			Slug:             "wedding-invitations",
			CategorySlug:     "wedding-stationery",
			Description:      "Beautiful custom wedding invitation cards to make your special day even more memorable. Elegant designs printed on premium cardstock.",
			ShortDescription: "Elegant wedding invitations for your special day",
			BasePrice:        35000,
			Images:           []string{"/images/wedding.jpg"},
			Features:         []string{"Premium cardstock", "Elegant design options", "Matching envelopes included", "Custom foil stamping available"},
			Turnaround:       "7-10 business days",
			MinQuantity:      50,
			Options: []models.ProductOption{
				{ID: "paper", Name: "Card Stock", Type: models.OptionTypeSelect, Options: []models.ProductOptionValue{
					{Value: "ivory", Label: "Ivory 300gsm", PriceModifier: ptrFloat(0)},
					{Value: "pearl", Label: "Pearl 300gsm", PriceModifier: ptrFloat(8000)},
					{Value: "textured", Label: "Textured 350gsm", PriceModifier: ptrFloat(12000)},
				}},
				{ID: "quantity", Name: "Quantity", Type: models.OptionTypeSelect, Options: []models.ProductOptionValue{
					{Value: "50", Label: "50 invitations", PriceModifier: ptrFloat(0)},
					{Value: "100", Label: "100 invitations", PriceModifier: ptrFloat(28000)},
					{Value: "150", Label: "150 invitations", PriceModifier: ptrFloat(52000)},
				}},
			},
		},
	}
}

func ptrFloat(f float64) *float64 {
	return &f
}
