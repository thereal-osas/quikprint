package services

import (
	"bytes"
	"crypto/tls"
	"fmt"
	"html/template"
	"net/smtp"
	"strings"

	"github.com/quikprint/backend/internal/models"
)

// EmailService handles sending emails via SMTP
type EmailService struct {
	host     string
	port     int
	username string
	password string
	from     string
	fromName string
}

// NewEmailService creates a new email service
func NewEmailService(host string, port int, username, password, from, fromName string) *EmailService {
	return &EmailService{
		host:     host,
		port:     port,
		username: username,
		password: password,
		from:     from,
		fromName: fromName,
	}
}

// IsConfigured returns true if SMTP is properly configured
func (s *EmailService) IsConfigured() bool {
	return s.host != "" && s.username != "" && s.password != ""
}

// SendEmail sends an email using SMTP with TLS
func (s *EmailService) SendEmail(to, subject, htmlBody string) error {
	if !s.IsConfigured() {
		return fmt.Errorf("SMTP not configured")
	}

	// Build email headers
	headers := make(map[string]string)
	headers["From"] = fmt.Sprintf("%s <%s>", s.fromName, s.from)
	headers["To"] = to
	headers["Subject"] = subject
	headers["MIME-Version"] = "1.0"
	headers["Content-Type"] = "text/html; charset=\"utf-8\""

	var msg strings.Builder
	for k, v := range headers {
		msg.WriteString(fmt.Sprintf("%s: %s\r\n", k, v))
	}
	msg.WriteString("\r\n")
	msg.WriteString(htmlBody)

	// Connect with TLS (Hostinger uses port 465 with SSL)
	tlsConfig := &tls.Config{
		ServerName: s.host,
	}

	conn, err := tls.Dial("tcp", fmt.Sprintf("%s:%d", s.host, s.port), tlsConfig)
	if err != nil {
		return fmt.Errorf("failed to connect to SMTP server: %w", err)
	}
	defer conn.Close()

	client, err := smtp.NewClient(conn, s.host)
	if err != nil {
		return fmt.Errorf("failed to create SMTP client: %w", err)
	}
	defer client.Close()

	// Authenticate
	auth := smtp.PlainAuth("", s.username, s.password, s.host)
	if err := client.Auth(auth); err != nil {
		return fmt.Errorf("SMTP authentication failed: %w", err)
	}

	// Set sender and recipient
	if err := client.Mail(s.from); err != nil {
		return fmt.Errorf("failed to set sender: %w", err)
	}
	if err := client.Rcpt(to); err != nil {
		return fmt.Errorf("failed to set recipient: %w", err)
	}

	// Send email body
	w, err := client.Data()
	if err != nil {
		return fmt.Errorf("failed to get data writer: %w", err)
	}
	_, err = w.Write([]byte(msg.String()))
	if err != nil {
		return fmt.Errorf("failed to write email body: %w", err)
	}
	err = w.Close()
	if err != nil {
		return fmt.Errorf("failed to close data writer: %w", err)
	}

	return client.Quit()
}

// SendBulkEmail sends the same email to multiple recipients
func (s *EmailService) SendBulkEmail(recipients []string, subject, htmlBody string) (int, []error) {
	successCount := 0
	var errors []error

	for _, to := range recipients {
		if err := s.SendEmail(to, subject, htmlBody); err != nil {
			errors = append(errors, fmt.Errorf("failed to send to %s: %w", to, err))
		} else {
			successCount++
		}
	}

	return successCount, errors
}

// SendOrderConfirmation sends order confirmation email to customer
func (s *EmailService) SendOrderConfirmation(order *models.Order, customerEmail string) error {
	data := map[string]interface{}{
		"OrderNumber": order.OrderNumber,
		"Total":       fmt.Sprintf("₦%.2f", order.Total),
		"Subtotal":    fmt.Sprintf("₦%.2f", order.Subtotal),
		"Shipping":    fmt.Sprintf("₦%.2f", order.Shipping),
		"VAT":         fmt.Sprintf("₦%.2f", order.Tax),
		"ItemCount":   len(order.Items),
	}

	html, err := s.renderTemplate("order_confirmation", data)
	if err != nil {
		return err
	}

	return s.SendEmail(customerEmail, fmt.Sprintf("Order Confirmation - %s", order.OrderNumber), html)
}

// SendOrderStatusUpdate sends order status update email to customer
func (s *EmailService) SendOrderStatusUpdate(order *models.Order, customerEmail, statusMessage string) error {
	data := map[string]interface{}{
		"OrderNumber":   order.OrderNumber,
		"Status":        string(order.Status),
		"StatusMessage": statusMessage,
	}

	html, err := s.renderTemplate("order_status", data)
	if err != nil {
		return err
	}

	return s.SendEmail(customerEmail, fmt.Sprintf("Order Status Update - %s", order.OrderNumber), html)
}

// SendWelcomeEmail sends welcome email to new users
func (s *EmailService) SendWelcomeEmail(email, firstName string) error {
	data := map[string]interface{}{
		"FirstName": firstName,
	}

	html, err := s.renderTemplate("welcome", data)
	if err != nil {
		return err
	}

	return s.SendEmail(email, "Welcome to QuikPrint NG!", html)
}

// SendPaymentConfirmation sends payment confirmation email
func (s *EmailService) SendPaymentConfirmation(order *models.Order, customerEmail string) error {
	data := map[string]interface{}{
		"OrderNumber": order.OrderNumber,
		"Total":       fmt.Sprintf("₦%.2f", order.Total),
	}

	html, err := s.renderTemplate("payment_confirmation", data)
	if err != nil {
		return err
	}

	return s.SendEmail(customerEmail, fmt.Sprintf("Payment Confirmed - %s", order.OrderNumber), html)
}

// SendBroadcast sends a broadcast email to multiple recipients
func (s *EmailService) SendBroadcast(recipients []string, subject, content string) (int, []error) {
	data := map[string]interface{}{
		"Subject": subject,
		"Content": template.HTML(content), // Allow HTML content
	}

	html, err := s.renderTemplate("broadcast", data)
	if err != nil {
		return 0, []error{err}
	}

	return s.SendBulkEmail(recipients, subject, html)
}

// renderTemplate renders an email template with data
func (s *EmailService) renderTemplate(templateName string, data map[string]interface{}) (string, error) {
	tmpl, ok := emailTemplates[templateName]
	if !ok {
		return "", fmt.Errorf("template %s not found", templateName)
	}

	t, err := template.New(templateName).Parse(tmpl)
	if err != nil {
		return "", fmt.Errorf("failed to parse template: %w", err)
	}

	var buf bytes.Buffer
	if err := t.Execute(&buf, data); err != nil {
		return "", fmt.Errorf("failed to execute template: %w", err)
	}

	return buf.String(), nil
}
