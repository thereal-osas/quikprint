-- Add discount column to orders table if it doesn't exist
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount DECIMAL(10, 2) NOT NULL DEFAULT 0;

