// internal/worker/task/scan_task.go
package schedule_task

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	"admin-server/internal/database"

	"github.com/google/uuid"
)

type ScanObjectsResponse struct {
	Objects []struct {
		ID          uuid.UUID       `json:"id"`
		ObjectName  string         `json:"object_name"`
		CreatedAt   time.Time      `json:"created_at"`
		ContactData json.RawMessage `json:"contact_data"`
	} `json:"objects"`
	Latest time.Time `json:"latest"`
}

type ScanTask struct {
	client  *http.Client
	queries *database.Queries
	logger   *log.Logger
}

func NewScanTask(queries *database.Queries, client *http.Client, logger *log.Logger) *ScanTask {
	return &ScanTask{
		client:  client,
		queries: queries,
		logger:  logger,
	}
}

func (t *ScanTask) scanNewObjects(ctx context.Context) error {
	// Get latest scan time
	lastScan, err := t.queries.GetLatestScanTime(ctx)
	// fmt.Println("lastScan: ",lastScan)
	if err != nil && err != sql.ErrNoRows {
		return fmt.Errorf("get latest scan time: %w", err)
	}

	// If no last scan, use fallback time
	if !lastScan.Valid {
		// fallbackTime := time.Now().Add(-time.Hour) // 1 hour ago if the system is running for the first time
		fallbackTime, err := time.Parse("2006-01-02 15:04:05.000 -0700","2024-12-04 20:22:17.542 +0000")
		if err != nil {
			return fmt.Errorf("parse fallback time: %w", err)
		}
		lastScan = sql.NullTime{
			Time:  fallbackTime,
			Valid: true,
		}
	}
	// t.logger.Println("scanNewObjects, lastScan: ",lastScan.Time)
	// Call MUNINN API
	req := struct {
		CreatedAfter time.Time `json:"created_after"`
	}{
		CreatedAfter: lastScan.Time,
	}
	// t.logger.Println("scanNewObjects, req: ",req)
	resp, err := t.callMuninnScanAPI(ctx, req)
	if err != nil {
		return err
	}
	// t.logger.Println("scanNewObjects, resp.Objects.length: ",len(resp.Objects))
	// Create tasks for each object
	for _, obj := range resp.Objects {
		// check if the object existed
		if _,err := t.queries.GetObject(ctx, &obj.ID); err == sql.ErrNoRows {
			if _,err := t.queries.CreateObject(ctx, &obj.ID); err != nil {
				return fmt.Errorf("create object %s: %w", obj.ID, err)
			}
		}

		if _,err := t.queries.CreateTask(ctx, database.CreateTaskParams{
			ObjectID: &obj.ID,
			Input:    obj.ContactData,
		}); err != nil {
			return fmt.Errorf("create task for object %s: %w", obj.ID, err)
		}
	}
	if(len(resp.Objects) == 0){
		return nil
	}
	// t.logger.Println("latest scan time: ",resp.Latest)
	// Update scan log
	if err := t.queries.CreateScanLog(ctx, sql.NullTime{
		Time: resp.Latest,
		Valid: true,
	}); err != nil {
		return fmt.Errorf("update scan log: %w", err)
	}

	return nil
}

func (t *ScanTask) scanStaleObjects(ctx context.Context) error {
	// Get objects not synced in 60 days
	staleTime := time.Now().AddDate(0, 0, -60)
	staleObjects, err := t.queries.GetStaleObjects(ctx, sql.NullTime{
		Time: staleTime, Valid: true,
	})
	if err != nil {
			return fmt.Errorf("get stale objects: %w", err)
	}

	if len(staleObjects) == 0 {
		return nil
	}

	// Extract IDs
	objectIDs := make([]uuid.UUID, len(staleObjects))
	for i, obj := range staleObjects {
		objectIDs[i] = *obj
	}

	// Call MUNINN API
	req := struct {
		ObjectIDs []uuid.UUID `json:"object_ids"`
	}{
		ObjectIDs: objectIDs,
	}

	resp, err := t.callMuninnScanAPI(ctx, req)
	if err != nil {
		return err
	}

	// Create tasks for each object
	for _, obj := range resp.Objects {
		if _,err := t.queries.CreateTask(ctx, database.CreateTaskParams{
			ObjectID: &obj.ID,
			Input:    obj.ContactData,
		}); err != nil {
			return fmt.Errorf("create task for object %s: %w", obj.ID, err)
		}
	}

	return nil
}

func (t *ScanTask) callMuninnScanAPI(ctx context.Context, body interface{}) (*ScanObjectsResponse, error) {
	reqBody, err := json.Marshal(body)
	if err != nil {
		return nil, fmt.Errorf("marshal request: %w", err)
	}
	// t.logger.Println("CallMuninnScanAPI: ",os.Getenv("MUNINN_SCAN_OBJECTS_URL"))
	// t.logger.Println(body);
	req, err := http.NewRequestWithContext(ctx, "POST", os.Getenv("MUNINN_SCAN_OBJECTS_URL"), bytes.NewReader(reqBody))
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", os.Getenv("MUNINN_JWT")))

	resp, err := t.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("execute request: %w", err)
	}
	defer resp.Body.Close()

	responseBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read response: %w", err)
	}

	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("API returned status code %d: %s", resp.StatusCode, string(responseBody))
	}

	var result ScanObjectsResponse
	if err := json.Unmarshal(responseBody, &result); err != nil {
		return nil, fmt.Errorf("parse response: %w", err)
	}

	return &result, nil
}

func (t *ScanTask) Handle(ctx context.Context) error {
	t.logger.Println("Running scan task")
	if err := t.scanNewObjects(ctx); err != nil {
		return fmt.Errorf("scan new objects: %w", err)
	}

	if err := t.scanStaleObjects(ctx); err != nil {
		return fmt.Errorf("scan stale objects: %w", err)
	}

	return nil
}