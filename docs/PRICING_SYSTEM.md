# QuikPrint Pricing System Documentation

## Overview

QuikPrint supports two types of product pricing:

1. **Static Pricing** - Products with a fixed base price
2. **Dynamic Pricing** - Products with configurable options that modify the final price

---

## 1. Static Pricing

### Description
Static pricing is the simplest pricing model. The product has a single, fixed base price that doesn't change based on customer selections.

### Use Cases
- Simple products with no variations
- Services with fixed costs
- Digital products

### How to Create a Static-Priced Product

1. Navigate to **Admin Dashboard** → **Products**
2. Click **Add Product**
3. Fill in the basic information:
   - **Name**: Product name
   - **Slug**: URL-friendly identifier (e.g., `basic-flyer`)
   - **Category**: Select the appropriate category
   - **Base Price (₦)**: Enter the fixed price in Naira
4. Under **Pricing Type**, select **Static Price**
5. Add product images by clicking the upload area
6. Fill in description and other details
7. Click **Create Product**

### Example: Static Pricing

| Field | Value |
|-------|-------|
| Name | Basic Flyer A5 |
| Base Price | ₦5,000 |
| Pricing Type | Static |

Customer always pays: **₦5,000** (plus VAT and shipping)

---

## 2. Dynamic Pricing

### Description
Dynamic pricing allows customers to configure products with various options (paper type, quantity, finish, size, etc.). Each option can have a **price modifier** that adds to or subtracts from the base price.

### How It Works

```
Final Price = Base Price + Sum of Selected Option Price Modifiers
```

### Use Cases
- Printed materials with paper/finish options
- Products with quantity tiers
- Customizable merchandise
- Any product with variations that affect cost

### How to Create a Dynamic-Priced Product

1. Navigate to **Admin Dashboard** → **Products**
2. Click **Add Product**
3. Fill in basic information including the **Base Price** (starting price)
4. Under **Pricing Type**, select **Dynamic Pricing (with options)**
5. Click **Add Option** to create pricing options

#### Configuring Product Options

Each option has:
- **Option ID**: A unique identifier (e.g., `paper`, `quantity`, `finish`)
- **Option Name**: Display name shown to customers
- **Type**: `select`, `radio`, or `checkbox`

Each option contains **values** with:
- **Value**: Internal identifier (e.g., `300gsm`, `100`, `matte`)
- **Label**: Customer-facing label (e.g., "300gsm Cardstock", "100 pieces", "Matte Finish")
- **Price Modifier**: Amount to add/subtract from base price (in Naira)

### Example: Dynamic Pricing

**Product: Premium Business Cards**
- Base Price: ₦8,500

| Option | Value | Label | Price Modifier |
|--------|-------|-------|----------------|
| Paper Stock | 300gsm | 300gsm Cardstock | ₦0 |
| Paper Stock | 350gsm | 350gsm Premium | +₦2,000 |
| Paper Stock | 400gsm | 400gsm Ultra Thick | +₦4,000 |
| Finish | matte | Matte Lamination | ₦0 |
| Finish | gloss | Gloss Lamination | +₦1,500 |
| Finish | soft-touch | Soft Touch Laminate | +₦3,500 |
| Quantity | 100 | 100 cards | ₦0 |
| Quantity | 250 | 250 cards | +₦4,000 |
| Quantity | 500 | 500 cards | +₦7,500 |

**Customer Selection Example:**
- Paper: 350gsm Premium (+₦2,000)
- Finish: Gloss Lamination (+₦1,500)
- Quantity: 250 cards (+₦4,000)

**Calculation:**
```
Base Price:     ₦8,500
+ Paper:        ₦2,000
+ Finish:       ₦1,500
+ Quantity:     ₦4,000
─────────────────────────
Subtotal:       ₦16,000
+ VAT (7.5%):   ₦1,200
─────────────────────────
Total:          ₦17,200
```

---

## 3. Product Images

### Uploading Images

1. In the product form, find the **Product Images** section
2. Click the upload area (dashed border with upload icon)
3. Select one or more images (PNG, JPG, JPEG supported)
4. Wait for upload to complete
5. Images appear as thumbnails with remove buttons

### Image Guidelines
- **Recommended size**: 800x800 pixels minimum
- **Formats**: PNG, JPG, JPEG
- **Max file size**: 10MB per image
- **First image**: Used as the primary product image

### Managing Images
- **Remove**: Hover over an image and click the X button
- **Reorder**: Currently done by removing and re-uploading in desired order

---

## 4. Backend API Reference

### Create Product with Static Pricing
```json
POST /admin/products
{
  "name": "Basic Flyer",
  "slug": "basic-flyer",
  "categoryId": "uuid-here",
  "basePrice": 5000,
  "description": "Simple A5 flyers",
  "images": ["/uploads/2024/01/01/image.jpg"],
  "options": []
}
```

### Create Product with Dynamic Pricing
```json
POST /admin/products
{
  "name": "Premium Business Cards",
  "slug": "premium-business-cards",
  "categoryId": "uuid-here",
  "basePrice": 8500,
  "description": "High-quality business cards",
  "images": ["/uploads/2024/01/01/cards.jpg"],
  "options": [
    {
      "id": "paper",
      "name": "Paper Stock",
      "type": "select",
      "options": [
        {"value": "300gsm", "label": "300gsm Cardstock", "priceModifier": 0},
        {"value": "350gsm", "label": "350gsm Premium", "priceModifier": 2000}
      ]
    }
  ]
}
```

---

## 5. Best Practices

1. **Base Price**: Set to the lowest possible configuration
2. **Price Modifiers**: Use positive values for upgrades, negative for discounts
3. **Option IDs**: Use lowercase, hyphenated identifiers
4. **Labels**: Be descriptive and include relevant details
5. **Images**: Always include at least one product image
6. **Testing**: Create test orders to verify pricing calculations

---

## 6. Troubleshooting

| Issue | Solution |
|-------|----------|
| Options not showing | Ensure "Dynamic Pricing" is selected |
| Wrong price displayed | Check all price modifiers are in Naira |
| Images not uploading | Verify file format and size limits |
| Pricing not updating | Clear browser cache and refresh |

