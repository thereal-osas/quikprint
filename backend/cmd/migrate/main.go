package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"

	"github.com/quikprint/backend/config"

	"github.com/jackc/pgx/v5"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	ctx := context.Background()
	conn, err := pgx.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer conn.Close(ctx)

	// Get migration file from command line or default to latest
	migrationFile := "migrations/003_announcements_hero.up.sql"
	if len(os.Args) > 1 {
		migrationFile = os.Args[1]
	}

	// Read migration file
	absPath, err := filepath.Abs(migrationFile)
	if err != nil {
		log.Fatalf("Failed to get absolute path: %v", err)
	}

	content, err := os.ReadFile(absPath)
	if err != nil {
		log.Fatalf("Failed to read migration file %s: %v", absPath, err)
	}

	fmt.Printf("Running migration: %s\n", migrationFile)
	fmt.Println("---")

	// Execute migration
	_, err = conn.Exec(ctx, string(content))
	if err != nil {
		log.Fatalf("Failed to execute migration: %v", err)
	}

	fmt.Println("Migration completed successfully!")
}
