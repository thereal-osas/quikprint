# Paystack Payment Integration Guide

This guide explains how to enable live payments in production for QuikPrint Nigeria using Paystack.

## Table of Contents

1. [Overview](#overview)
2. [Paystack Account Setup](#paystack-account-setup)
3. [Card Payments](#card-payments)
4. [Bank Transfers](#bank-transfers)
5. [Environment Variables](#environment-variables)
6. [Testing vs Production](#testing-vs-production)
7. [Webhook Configuration](#webhook-configuration)
8. [Security Considerations](#security-considerations)
9. [Troubleshooting](#troubleshooting)

---

## 1. Overview

QuikPrint uses Paystack for payment processing. Paystack supports:
- **Card Payments**: Visa, Mastercard, Verve (Nigerian cards)
- **Bank Transfers**: Customers pay via bank transfer to a dynamic virtual account
- **USSD**: Pay via USSD codes
- **Mobile Money**: Supported in Ghana

The integration flow:
1. Customer places order → Order status: `awaiting_payment`
2. Customer initiates payment → Backend creates Paystack transaction
3. Customer is redirected to Paystack checkout page
4. Customer completes payment
5. Paystack sends webhook → Backend updates order to `paid`

---

## 2. Paystack Account Setup

### Step 1: Create a Paystack Account
1. Visit [https://dashboard.paystack.com/signup](https://dashboard.paystack.com/signup)
2. Register with your business email
3. Verify your email address

### Step 2: Complete Business Verification
1. Go to **Settings** → **Preferences** → **Business Settings**
2. Provide:
   - Business name (QuikPrint Nigeria)
   - Business registration number (CAC number)
   - Business type (Sole proprietorship, LLC, etc.)
   - Business address
   - Director/Owner details
   - Bank account for settlements

### Step 3: Get API Keys
1. Go to **Settings** → **API Keys & Webhooks**
2. You'll see two sets of keys:
   - **Test Keys** (for development): `sk_test_xxx` and `pk_test_xxx`
   - **Live Keys** (for production): `sk_live_xxx` and `pk_live_xxx`

---

## 3. Card Payments

Card payments are enabled by default when you complete your Paystack account setup.

### Supported Cards
- **Visa** (International)
- **Mastercard** (International)
- **Verve** (Nigerian cards)
- **American Express** (on request)

### Configuration
No additional configuration is needed. The backend automatically supports card payments when valid API keys are provided.

### How It Works
1. Customer clicks "Pay with Card" on checkout
2. Backend calls Paystack's `/transaction/initialize` endpoint
3. Customer is redirected to Paystack's secure payment page
4. Customer enters card details on Paystack's page (PCI DSS compliant)
5. Payment is processed
6. Customer is redirected back to your callback URL
7. Webhook confirms payment and updates order status

---

## 4. Bank Transfers

Bank transfers allow customers to pay via bank transfer to a dynamically generated virtual account.

### Enabling Bank Transfers
1. Log into [Paystack Dashboard](https://dashboard.paystack.com)
2. Go to **Settings** → **Transaction & Limits**
3. Enable **Bank Transfer** as a payment channel
4. Paystack will automatically generate virtual accounts when customers select bank transfer

### How Customers Receive Bank Account Details
When a customer selects "Pay with Bank Transfer":
1. Paystack generates a **temporary virtual account number**
2. The account details (bank name, account number, account name) are displayed
3. Customer transfers exact amount to this account
4. Account expires after the specified timeout (usually 30 minutes to 24 hours)

### Configuring Bank Transfer Settings
In Paystack Dashboard → **Settings** → **Preferences**:
- **Dedicated Virtual Accounts**: Enable for recurring customers
- **Payment Timeout**: Set how long transfer accounts remain active
- **Supported Banks**: All Nigerian banks are supported by default

### Payment Verification for Bank Transfers
1. Customer completes bank transfer
2. Paystack receives the transfer (usually within 1-5 minutes)
3. Paystack sends a `charge.success` webhook to your server
4. Backend verifies the webhook signature
5. Order status is updated to `paid`

---

## 5. Environment Variables

### Required Environment Variables

```env
# Paystack Configuration
PAYSTACK_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxx
PAYSTACK_PUBLIC_KEY=pk_live_xxxxxxxxxxxxxxxx
PAYSTACK_CALLBACK_URL=https://yourdomain.com/checkout/callback

# Database
DATABASE_URL=postgres://user:password@host:5432/quikprint?sslmode=require

# JWT Security
JWT_SECRET=your-very-long-secure-random-string-here

# Server
PORT=8080
ENVIRONMENT=production

# CORS (your frontend domain)
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Variable Descriptions

| Variable | Description | Example |
|----------|-------------|---------|
| `PAYSTACK_SECRET_KEY` | Server-side API key (starts with `sk_`) | `sk_live_xxxxx` |
| `PAYSTACK_PUBLIC_KEY` | Client-side API key (starts with `pk_`) | `pk_live_xxxxx` |
| `PAYSTACK_CALLBACK_URL` | URL where customers return after payment | `https://quikprint.ng/checkout/callback` |
| `DATABASE_URL` | PostgreSQL connection string | See above |
| `JWT_SECRET` | Secret for signing JWT tokens | Random 32+ character string |
| `ENVIRONMENT` | `development` or `production` | `production` |
| `CORS_ALLOWED_ORIGINS` | Allowed frontend origins | Comma-separated list |

---

## 6. Testing vs Production

### Test Mode (Development)

Use test keys for development and testing:

```env
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxx
PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxx
PAYSTACK_CALLBACK_URL=http://localhost:5173/checkout/callback
```

**Test Card Details** (for testing only):
- Card Number: `4084084084084081`
- Expiry: Any future date (e.g., `12/30`)
- CVV: `408`
- PIN: `0000`
- OTP: `123456`

### Production Mode

1. **Complete business verification** on Paystack dashboard
2. **Replace test keys with live keys**:

```env
PAYSTACK_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxx
PAYSTACK_PUBLIC_KEY=pk_live_xxxxxxxxxxxxxxxx
PAYSTACK_CALLBACK_URL=https://quikprint.ng/checkout/callback
```

3. **Update webhook URL** in Paystack dashboard
4. **Deploy** the backend with new environment variables
5. **Test with a real transaction** (small amount like ₦100)

### Checklist for Going Live

- [ ] Business verification completed on Paystack
- [ ] Live API keys obtained
- [ ] Webhook URL configured with production domain
- [ ] SSL certificate installed on your domain
- [ ] Test transaction completed successfully
- [ ] Error handling and logging configured
- [ ] Settlement bank account verified

---

## 7. Webhook Configuration

Webhooks are crucial for confirming payments, especially bank transfers.

### Setting Up Webhooks

1. Go to Paystack Dashboard → **Settings** → **API Keys & Webhooks**
2. Click **Add Webhook URL**
3. Enter your webhook URL: `https://yourdomain.com/api/v1/payments/webhook`
4. Select events to receive (recommended: all events)
5. Save

### Webhook Events

| Event | Description |
|-------|-------------|
| `charge.success` | Payment was successful |
| `charge.failed` | Payment failed |
| `transfer.success` | Transfer to your bank was successful |
| `transfer.failed` | Transfer to your bank failed |

### How Webhooks Work in QuikPrint

```
Paystack → POST /api/v1/payments/webhook
         → Backend verifies signature
         → Updates payment and order status
         → Returns 200 OK
```

### Webhook Signature Verification

The backend verifies all webhooks using HMAC-SHA512:

```go
// From payment_handler.go
signature := c.GetHeader("x-paystack-signature")
mac := hmac.New(sha512.New, []byte(h.secretKey))
mac.Write(body)
expectedSig := hex.EncodeToString(mac.Sum(nil))

if signature != expectedSig {
    c.AbortWithStatus(401) // Reject invalid webhooks
    return
}
```

### Testing Webhooks Locally

Use [ngrok](https://ngrok.com) to expose your local server:

```bash
# Start your backend
go run cmd/api/main.go

# In another terminal
ngrok http 8080

# Use the ngrok URL in Paystack dashboard
# e.g., https://abc123.ngrok.io/api/v1/payments/webhook
```

---

## 8. Security Considerations

### 1. Never Expose Secret Keys

- **SECRET KEY** (`sk_xxx`): Only use server-side, never in frontend code
- **PUBLIC KEY** (`pk_xxx`): Safe to use in frontend (for Paystack inline JS)

```bash
# WRONG - Never commit keys to git
PAYSTACK_SECRET_KEY=sk_live_xxxxx

# CORRECT - Use environment variables
PAYSTACK_SECRET_KEY=${PAYSTACK_SECRET_KEY}
```

### 2. Always Verify Webhook Signatures

Never trust webhooks without verifying the `x-paystack-signature` header. The backend already does this.

### 3. Use HTTPS in Production

All payment-related endpoints must use HTTPS:
- Webhook URL must be HTTPS
- Callback URL must be HTTPS
- API should be served over HTTPS

### 4. Validate Amounts Server-Side

Always verify the payment amount matches the order total:

```go
if paystackResp.Data.Amount != order.Total * 100 {
    // Amount mismatch - potential fraud
    log.Warn("Payment amount mismatch")
}
```

### 5. Implement Rate Limiting

Protect your payment endpoints from abuse:
- Limit payment initialization attempts per user
- Implement CAPTCHA for suspicious activity

### 6. Secure Your JWT Secret

Use a strong, random JWT secret (32+ characters):

```bash
# Generate a secure secret
openssl rand -base64 32
```

### 7. Store Sensitive Data Securely

- Use environment variables, not code
- Use secret managers in production (AWS Secrets Manager, HashiCorp Vault)
- Never log full card numbers or CVVs

---

## 9. Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "Invalid key" error | Wrong API key type | Use `sk_live_xxx` for production, `sk_test_xxx` for testing |
| Webhook not received | Wrong URL or firewall | Check webhook URL is accessible and returns 200 |
| Payment stuck as "pending" | Webhook failed | Check server logs, verify webhook signature |
| "Currency not supported" | NGN not enabled | Contact Paystack support |
| Callback not working | Wrong callback URL | Ensure PAYSTACK_CALLBACK_URL is correct |

### Debugging Steps

1. **Check Paystack Dashboard**
   - Go to **Transactions** to see all payment attempts
   - Check **Logs** for webhook delivery status

2. **Verify Environment Variables**
   ```bash
   echo $PAYSTACK_SECRET_KEY
   echo $PAYSTACK_CALLBACK_URL
   ```

3. **Check Server Logs**
   - Look for webhook receipt confirmation
   - Check for signature verification errors

4. **Test Webhook Manually**
   ```bash
   curl -X POST https://yourdomain.com/api/v1/payments/webhook \
     -H "Content-Type: application/json" \
     -d '{"event": "charge.success", "data": {"reference": "test"}}'
   ```

### Getting Help

- **Paystack Documentation**: [https://paystack.com/docs](https://paystack.com/docs)
- **Paystack API Reference**: [https://paystack.com/docs/api](https://paystack.com/docs/api)
- **Paystack Support**: support@paystack.com or dashboard live chat

---

## Quick Reference

### API Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `POST /transaction/initialize` | Create a new payment |
| `GET /transaction/verify/:reference` | Verify payment status |

### Payment Flow Diagram

```
Customer                    QuikPrint Backend              Paystack
    |                              |                          |
    |---- Place Order ------------>|                          |
    |                              |                          |
    |---- Click Pay -------------->|                          |
    |                              |---- Initialize --------->|
    |                              |<--- Auth URL ------------|
    |<---- Redirect to Paystack ---|                          |
    |                              |                          |
    |--------------------------------- Complete Payment ------>|
    |                              |                          |
    |<---- Redirect to Callback ---|                          |
    |                              |<---- Webhook ------------|
    |                              |---- Update Order --------|
    |<---- Order Confirmed --------|                          |
```

---

*Last updated: February 2026*


