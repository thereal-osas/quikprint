package services

// emailTemplates contains HTML email templates
var emailTemplates = map[string]string{
	"order_confirmation": `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; }
        .footer { background: #1e293b; color: #94a3b8; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
        .order-details { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
        .total { font-size: 24px; font-weight: bold; color: #2563eb; }
        .btn { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Order Confirmed! 🎉</h1>
    </div>
    <div class="content">
        <p>Thank you for your order! We've received your order and will begin processing it shortly.</p>
        <div class="order-details">
            <h3>Order #{{.OrderNumber}}</h3>
            <p><strong>Items:</strong> {{.ItemCount}} item(s)</p>
            <p><strong>Subtotal:</strong> {{.Subtotal}}</p>
            <p><strong>Shipping:</strong> {{.Shipping}}</p>
            <p><strong>VAT (7.5%):</strong> {{.VAT}}</p>
            <hr>
            <p class="total">Total: {{.Total}}</p>
        </div>
        <p>We'll send you another email when your order is ready for shipping.</p>
        <a href="https://quikprint.ng/account" class="btn">Track Your Order</a>
    </div>
    <div class="footer">
        <p>QuikPrint NG - Professional Printing Services</p>
        <p>Lagos, Nigeria | info@quikprint.ng</p>
    </div>
</body>
</html>`,

	"order_status": `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; }
        .footer { background: #1e293b; color: #94a3b8; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
        .status-box { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #2563eb; }
        .btn { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Order Status Update</h1>
    </div>
    <div class="content">
        <p>Your order status has been updated.</p>
        <div class="status-box">
            <h3>Order #{{.OrderNumber}}</h3>
            <p><strong>New Status:</strong> {{.Status}}</p>
            <p>{{.StatusMessage}}</p>
        </div>
        <a href="https://quikprint.ng/account" class="btn">View Order Details</a>
    </div>
    <div class="footer">
        <p>QuikPrint NG - Professional Printing Services</p>
        <p>Lagos, Nigeria | info@quikprint.ng</p>
    </div>
</body>
</html>`,

	"welcome": `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; }
        .footer { background: #1e293b; color: #94a3b8; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
        .btn { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Welcome to QuikPrint NG! 👋</h1>
    </div>
    <div class="content">
        <p>Hi {{.FirstName}},</p>
        <p>Welcome to QuikPrint NG! We're excited to have you join us.</p>
        <p>With QuikPrint, you can:</p>
        <ul>
            <li>Order high-quality business cards, flyers, and more</li>
            <li>Get fast turnaround times</li>
            <li>Enjoy competitive pricing</li>
            <li>Track your orders in real-time</li>
        </ul>
        <a href="https://quikprint.ng/products" class="btn">Start Shopping</a>
    </div>
    <div class="footer">
        <p>QuikPrint NG - Professional Printing Services</p>
        <p>Lagos, Nigeria | info@quikprint.ng</p>
    </div>
</body>
</html>`,

	"payment_confirmation": `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #16a34a; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; }
        .footer { background: #1e293b; color: #94a3b8; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
        .payment-box { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; text-align: center; }
        .amount { font-size: 28px; font-weight: bold; color: #16a34a; }
        .btn { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Payment Confirmed ✓</h1>
    </div>
    <div class="content">
        <p>Great news! Your payment has been successfully processed.</p>
        <div class="payment-box">
            <p>Order #{{.OrderNumber}}</p>
            <p class="amount">{{.Total}}</p>
            <p style="color: #16a34a;">Payment Successful</p>
        </div>
        <p>We've started processing your order and will notify you when it's ready for shipping.</p>
        <a href="https://quikprint.ng/account" class="btn">Track Your Order</a>
    </div>
    <div class="footer">
        <p>QuikPrint NG - Professional Printing Services</p>
        <p>Lagos, Nigeria | info@quikprint.ng</p>
    </div>
</body>
</html>`,

	"broadcast": `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; }
        .footer { background: #1e293b; color: #94a3b8; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
        .btn { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{.Subject}}</h1>
    </div>
    <div class="content">
        {{.Content}}
    </div>
    <div class="footer">
        <p>QuikPrint NG - Professional Printing Services</p>
        <p>Lagos, Nigeria | info@quikprint.ng</p>
        <p style="font-size: 10px; margin-top: 10px;">You received this email because you're a customer of QuikPrint NG.</p>
    </div>
</body>
</html>`,
}
