package worker

import (
	"admin-server/internal/database"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strconv"
	"time"

	"github.com/sqlc-dev/pqtype"
)

func (m *Manager) processLoop() {
	sleepSeconds, err := strconv.Atoi(os.Getenv("TASK_SLEEP_IN_SECONDS"))
	if err != nil {
		log.Fatalf("Invalid TASK_SLEEP_IN_SECONDS: %v", err)
	}
	ticker := time.NewTicker(time.Duration(sleepSeconds) * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-m.ctx.Done():
			log.Printf("Worker %s received shutdown signal", m.workerID)
			return
		case <-ticker.C:
			if err := m.processPendingTasks(); err != nil {
				m.logError(fmt.Sprintf("Error processing pending tasks: %v", err))
			}
		}
	}
}

func (m *Manager) processPendingTasks() error {
    // Begin transaction
    tx, err := m.db.BeginTx(m.ctx, &sql.TxOptions{
        Isolation: sql.LevelReadCommitted,
    })
    if err != nil {
        return fmt.Errorf("start transaction: %w", err)
    }
    defer tx.Rollback()

		now := time.Now()
		queries := database.New(m.db)
		task, err := queries.UpdateTaskProcessing(m.ctx, sql.NullTime{Time: now, Valid: true})
    // Find and lock a pending task

    if err == sql.ErrNoRows {
			return nil
    }
    if err != nil {
			return fmt.Errorf("query task: %w", err)
    }

    // Commit transaction to release lock
    if err := tx.Commit(); err != nil {
			return fmt.Errorf("commit transaction: %w", err)
    }

    // Update metrics for currently processing tasks
    m.metrics.Lock()
    m.metrics.CurrentTasks++
    m.metrics.Unlock()

    // Process task in background
    m.processingWg.Add(1)
    go func() {
			defer m.processingWg.Done()
			defer func() {
				m.metrics.Lock()
				m.metrics.CurrentTasks--
				m.metrics.Unlock()
			}()
			m.processTask(&task)
    }()

    return nil
}

func (m *Manager) processTask(task *database.UpdateTaskProcessingRow) {
	m.metrics.Lock()
	m.metrics.TasksProcessed++
	m.metrics.Unlock()

	// Call Noscope API
	noscopeResp, err := m.callNoscope(m.ctx, task)
	if err != nil {
			errMsg := err.Error()
			m.updateTaskStatus(*task, "failed", nil, &errMsg)
			return
	}

	// Call Muninn API with Noscope response
	if err := m.callMuninnUpsert(m.ctx, task, *noscopeResp); err != nil {
			errMsg := fmt.Sprintf("Muninn upsert failed: %v", err)
			// We still save the Noscope response even if Muninn fails
			noscopeRespBytes := []byte(*noscopeResp)
			m.updateTaskStatus(*task, "failed", &noscopeRespBytes, &errMsg)
			return
	}

	// Call Muninn Tag API with Noscope response
	if err := m.callMuninnTagObject(m.ctx, *task.ObjectID, *noscopeResp); err != nil {
		errMsg := fmt.Sprintf("Muninn tag failed: %v", err)
		noscopeRespBytes := []byte(*noscopeResp)
		// We still consider the task completed since tagging is optional
		m.updateTaskStatus(*task, "completed", &noscopeRespBytes, &errMsg)
		return
}

	// Update task as completed with Noscope response
	noscopeRespBytes := []byte(*noscopeResp)
	m.updateTaskStatus(*task, "completed", &noscopeRespBytes, nil)
}

func (m *Manager) updateTaskStatus(task database.UpdateTaskProcessingRow, status string, output *[]byte, errorMsg *string) {
	now := time.Now()

	var outputJSON sql.NullString
	if output != nil {
		outputJSON = sql.NullString{
			String: string(*output),
			Valid:  true,
		}
	}

	var errorNullString sql.NullString
	if errorMsg != nil {
		errorNullString = sql.NullString{
			String: *errorMsg,
			Valid:  true,
		}
	}

	queries := database.New(m.db)
	err := queries.UpdateTaskStatus(m.ctx, database.UpdateTaskStatusParams{
		Status:      status,
		Output:      pqtype.NullRawMessage{RawMessage: json.RawMessage(outputJSON.String), Valid: outputJSON.Valid},
		Error:       errorNullString,
		CompletedAt: sql.NullTime{Time: now, Valid: true},
		ID:          task.ID,
	});

	if err != nil {
		m.logError(fmt.Sprintf("Error updating task status: %v", err))
		return
	}

	queries.UpdateObjectLastSyncedAt(m.ctx, database.UpdateObjectLastSyncedAtParams{
		ID: task.ObjectID,
		LastSyncedAt: sql.NullTime{Time: now, Valid: true},
	});

	m.metrics.Lock()
	if status == "completed" {
		m.metrics.TasksSucceeded++
	} else {
		m.metrics.TasksFailed++
	}
	m.metrics.Unlock()
}
