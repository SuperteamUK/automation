// internal/worker/task/task.go
package schedule_task

import (
	"context"
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// TaskHandler interface for all task handlers
type TaskHandler interface {
    Handle(ctx context.Context) error
}

// BaseTask contains common fields for all tasks
type BaseTask struct {
    ID          uuid.UUID
    ObjectID    uuid.UUID
    Status      string
    Input       json.RawMessage
    Output      json.RawMessage
    Error       *string
    CreatedAt   time.Time
    StartedAt   *time.Time
    CompletedAt *time.Time
}