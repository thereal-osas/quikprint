-- Remove coupon-related columns from orders table
ALTER TABLE orders DROP COLUMN IF EXISTS discount_amount;
ALTER TABLE orders DROP COLUMN IF EXISTS coupon_code;
ALTER TABLE orders DROP COLUMN IF EXISTS coupon_id;

-- Drop coupon tables
DROP TABLE IF EXISTS coupon_usage;
DROP TABLE IF EXISTS coupons;

