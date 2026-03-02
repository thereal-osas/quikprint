-- Remove discount column from orders table
ALTER TABLE orders DROP COLUMN IF EXISTS discount;
