CREATE TABLE IF NOT EXISTS shipping_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipping_fee DECIMAL(10, 2) NOT NULL DEFAULT 5000.00,
    free_shipping_threshold DECIMAL(10, 2) NOT NULL DEFAULT 50000.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default values if table is empty
INSERT INTO shipping_config (shipping_fee, free_shipping_threshold)
SELECT 5000.00, 50000.00
WHERE NOT EXISTS (SELECT 1 FROM shipping_config);
