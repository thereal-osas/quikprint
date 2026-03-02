-- Announcements table for top banner carousel
CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    text VARCHAR(500) NOT NULL,
    link_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_announcements_active ON announcements(is_active);
CREATE INDEX idx_announcements_order ON announcements(display_order);

-- Hero slides table for homepage carousel
CREATE TABLE hero_slides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    heading VARCHAR(200) NOT NULL,
    subheading TEXT,
    image_url VARCHAR(500) NOT NULL,
    cta_text VARCHAR(100),
    cta_link VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_hero_slides_active ON hero_slides(is_active);
CREATE INDEX idx_hero_slides_order ON hero_slides(display_order);

-- Insert default announcement
INSERT INTO announcements (text, link_url, is_active, display_order) VALUES
('Free shipping on orders over ₦50,000', '/products', true, 1),
('New arrivals! Check out our latest products', '/products', true, 2),
('Quality printing at affordable prices', '/about', true, 3);

-- Insert default hero slides
INSERT INTO hero_slides (heading, subheading, image_url, cta_text, cta_link, is_active, display_order) VALUES
('Premium Print Solutions', 'From business cards to large format banners, we deliver quality prints that make your brand stand out.', '/placeholder.svg', 'Shop Now', '/products', true, 1),
('Fast Turnaround', 'Get your prints delivered in as little as 24 hours with our express printing service.', '/placeholder.svg', 'Learn More', '/about', true, 2),
('Custom Designs', 'Work with our design team to create stunning visuals for your business.', '/placeholder.svg', 'Contact Us', '/contact', true, 3);

