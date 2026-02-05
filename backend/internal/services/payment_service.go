package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

const paystackBaseURL = "https://api.paystack.co"

type PaymentService struct {
	secretKey  string
	publicKey  string
	httpClient *http.Client
}

func NewPaymentService(secretKey, publicKey string) *PaymentService {
	return &PaymentService{
		secretKey:  secretKey,
		publicKey:  publicKey,
		httpClient: &http.Client{},
	}
}

type PaystackInitRequest struct {
	Email     string            `json:"email"`
	Amount    int               `json:"amount"` // Amount in kobo (smallest currency unit)
	Reference string            `json:"reference"`
	Callback  string            `json:"callback_url,omitempty"`
	Metadata  map[string]string `json:"metadata,omitempty"`
}

type PaystackInitResponse struct {
	Status  bool   `json:"status"`
	Message string `json:"message"`
	Data    struct {
		AuthorizationURL string `json:"authorization_url"`
		AccessCode       string `json:"access_code"`
		Reference        string `json:"reference"`
	} `json:"data"`
}

type PaystackVerifyResponse struct {
	Status  bool   `json:"status"`
	Message string `json:"message"`
	Data    struct {
		ID              int    `json:"id"`
		Status          string `json:"status"`
		Reference       string `json:"reference"`
		Amount          int    `json:"amount"`
		GatewayResponse string `json:"gateway_response"`
		PaidAt          string `json:"paid_at"`
		Channel         string `json:"channel"`
		Currency        string `json:"currency"`
		Customer        struct {
			Email string `json:"email"`
		} `json:"customer"`
		Metadata map[string]interface{} `json:"metadata"`
	} `json:"data"`
}

func (s *PaymentService) InitializePayment(req *PaystackInitRequest) (*PaystackInitResponse, error) {
	jsonData, err := json.Marshal(req)
	if err != nil {
		return nil, err
	}

	httpReq, err := http.NewRequest("POST", paystackBaseURL+"/transaction/initialize", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}

	httpReq.Header.Set("Authorization", "Bearer "+s.secretKey)
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := s.httpClient.Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var paystackResp PaystackInitResponse
	if err := json.Unmarshal(body, &paystackResp); err != nil {
		return nil, err
	}

	if !paystackResp.Status {
		return nil, fmt.Errorf("paystack error: %s", paystackResp.Message)
	}

	return &paystackResp, nil
}

func (s *PaymentService) VerifyPayment(reference string) (*PaystackVerifyResponse, error) {
	httpReq, err := http.NewRequest("GET", paystackBaseURL+"/transaction/verify/"+reference, nil)
	if err != nil {
		return nil, err
	}

	httpReq.Header.Set("Authorization", "Bearer "+s.secretKey)

	resp, err := s.httpClient.Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var paystackResp PaystackVerifyResponse
	if err := json.Unmarshal(body, &paystackResp); err != nil {
		return nil, err
	}

	return &paystackResp, nil
}

func (s *PaymentService) GetPublicKey() string {
	return s.publicKey
}

