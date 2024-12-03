package worker

import (
	"admin-server/internal/database"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"

	"github.com/google/uuid"
)

type MuninnUpsertRequest struct {
	ObjectID      uuid.UUID       `json:"object_id"`
	ObjectTypeID  string         `json:"object_type_id"`
	TypeValues    json.RawMessage `json:"type_values"`
}

// Separate the API calls into their own functions
func (m *Manager) callNoscope(ctx context.Context, task *database.UpdateTaskProcessingRow) (*json.RawMessage, error) {
	requestBody := map[string]interface{}{
		"input": task.Input,
		"data_models": []string{"name", "github", "labels", "caption", "summary", "linkedin", "framework", "blockchain", "product_category", "professional_dev", "organisation", "organisation_url"},
	}

	// Create request to NOSCOPE_ENRICH_URL
	requestBodyBytes, err := json.Marshal(requestBody)
	if err != nil {
		errMsg := err.Error()
		m.updateTaskStatus(*task, "failed", nil, &errMsg)
		return nil, fmt.Errorf("marshal noscope request: %w", err)
	}
	req, err := http.NewRequestWithContext(ctx, "POST", os.Getenv("NOSCOPE_ENRICH_URL"), bytes.NewReader(requestBodyBytes))
	if err != nil {
			return nil, fmt.Errorf("create noscope request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", os.Getenv("NOSCOPE_KEY"))

	resp, err := m.client.Do(req)
	if err != nil {
			return nil, fmt.Errorf("execute noscope request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
			return nil, fmt.Errorf("read noscope response: %w", err)
	}

	if resp.StatusCode >= 400 {
			return nil, fmt.Errorf("noscope API returned status code %d: %s", resp.StatusCode, string(body))
	}

	rawMsg := json.RawMessage(body)
	return &rawMsg, nil
}

func (m *Manager) callMuninnUpsert(ctx context.Context, task *database.UpdateTaskProcessingRow, typeValues json.RawMessage) error {
	muninnReq := MuninnUpsertRequest{
		ObjectID:     *task.ObjectID,
		ObjectTypeID: os.Getenv("MUNINN_NOSCOPE_OBJTYPE_ID"),
		TypeValues:   typeValues,
	}

	reqBody, err := json.Marshal(muninnReq)
	if err != nil {
		return fmt.Errorf("marshal muninn request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", os.Getenv("MUNINN_UPSERT_OBJTYPE_URL"), bytes.NewReader(reqBody))
	if err != nil {
			return fmt.Errorf("create muninn request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", os.Getenv("MUNINN_JWT")))

	resp, err := m.client.Do(req)
	if err != nil {
			return fmt.Errorf("execute muninn request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
			return fmt.Errorf("read muninn response: %w", err)
	}

	if resp.StatusCode >= 400 {
			return fmt.Errorf("muninn API returned status code %d: %s", resp.StatusCode, string(body))
	}

	return nil
}

// Add this structure for the Noscope response and Muninn tag request
type NoscopeResponse struct {
	Labels string       `json:"labels"`
	// other fields that might be in the response...
}

type MuninnTagRequest struct {
	ObjectID uuid.UUID `json:"object_id"`
	Tags     []string  `json:"tags"`
}

func Split(r rune) bool {
	return r == ',' || r == '#' || r == '@' || r == ';' || r == '/'
}

// Add the new function to call Muninn tag API
func (m *Manager) callMuninnTagObject(ctx context.Context, objID uuid.UUID, noscopeResp json.RawMessage) error {
	// Parse the Noscope response to get labels
	var noscope NoscopeResponse
	if err := json.Unmarshal(noscopeResp, &noscope); err != nil {
		return fmt.Errorf("parse noscope response: %w", err)
	}

	// Skip if no labels
	if noscope.Labels == "" {
		return nil
	}
	// split noscope.Labels into tags
	tags := strings.FieldsFunc(noscope.Labels, Split)

	// Prepare tag request
	tagReq := MuninnTagRequest{
		ObjectID: objID,
		Tags:     tags,
	}

	reqBody, err := json.Marshal(tagReq)
	if err != nil {
			return fmt.Errorf("marshal tag request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", os.Getenv("MUNINN_TAGS_OBJ_URL"), bytes.NewReader(reqBody))
	if err != nil {
			return fmt.Errorf("create tag request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", os.Getenv("MUNINN_JWT")))

	resp, err := m.client.Do(req)
	if err != nil {
			return fmt.Errorf("execute tag request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
			return fmt.Errorf("read tag response: %w", err)
	}

	if resp.StatusCode >= 400 {
			return fmt.Errorf("muninn tag API returned status code %d: %s", resp.StatusCode, string(body))
	}

	return nil
}