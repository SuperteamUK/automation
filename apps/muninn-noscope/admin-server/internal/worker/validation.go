package worker

import (
	"fmt"
	"log"
	"os"
	"time"
)

func (m *Manager) validateConfig() error {
	required := []struct {
			name  string
			value string
	}{
		{"NOSCOPE_ENRICH_URL", os.Getenv("NOSCOPE_ENRICH_URL")},
		{"NOSCOPE_KEY", os.Getenv("NOSCOPE_KEY")},
		{"MUNINN_UPSERT_OBJTYPE_URL", os.Getenv("MUNINN_UPSERT_OBJTYPE_URL")},
		{"MUNINN_JWT", os.Getenv("MUNINN_JWT")},
		{"MUNINN_NOSCOPE_OBJTYPE_ID", os.Getenv("MUNINN_NOSCOPE_OBJTYPE_ID")},
	}

	var missing []string
	for _, req := range required {
		if req.value == "" {
			missing = append(missing, req.name)
		}
	}

	if len(missing) > 0 {
		return fmt.Errorf("missing required environment variables: %v", missing)
	}

	return nil
}

func (m *Manager) logError(errMsg string) {
	m.metrics.Lock()
	m.metrics.LastErrorTime = time.Now()
	m.metrics.LastError = errMsg
	m.metrics.Unlock()
	log.Printf("Worker %s error: %s", m.workerID, errMsg)
}