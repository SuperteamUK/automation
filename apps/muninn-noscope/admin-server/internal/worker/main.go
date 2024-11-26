package worker

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/google/uuid"
)

type Task struct {
	ID          uuid.UUID       `json:"id"`
	ObjectID    uuid.UUID       `json:"object_id"`
	Status      string          `json:"status"`
	Input       json.RawMessage `json:"input"`
	Output      json.RawMessage `json:"output,omitempty"`
	Error       *string         `json:"error,omitempty"`
	CreatedAt   time.Time       `json:"created_at"`
	StartedAt   *time.Time      `json:"started_at,omitempty"`
	CompletedAt *time.Time      `json:"completed_at,omitempty"`
}

type Metrics struct {
	TasksProcessed   int64     `json:"tasks_processed"`
	TasksSucceeded   int64     `json:"tasks_succeeded"`
	TasksFailed      int64     `json:"tasks_failed"`
	WorkerStatus     string    `json:"worker_status"`
	LastStartTime    time.Time `json:"last_start_time,omitempty"`
	LastErrorTime    time.Time `json:"last_error_time,omitempty"`
	LastError        string    `json:"last_error,omitempty"`
	CurrentTasks     int       `json:"current_tasks"`
	sync.Mutex
}

type Manager struct {
    db           *sql.DB
    client       *http.Client
    workerID     string
    processingWg sync.WaitGroup
    metrics      *Metrics
    cancel       context.CancelFunc
    ctx          context.Context
    isRunning    bool
    mu           sync.Mutex
}

func NewManager(db *sql.DB) *Manager {
	return &Manager{
		db: db,
		client: &http.Client{
				Timeout: 30 * time.Second,
		},
		workerID: uuid.New().String(),
		metrics: &Metrics{
				WorkerStatus: "stopped",
		},
		isRunning: false,
	}
}

func (m *Manager) Start() error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if m.isRunning {
		return fmt.Errorf("worker is already running")
	}

  // Validate configuration before starting
	if err := m.validateConfig(); err != nil {
		return fmt.Errorf("invalid configuration: %w", err)
	}

	// Create new context for this run
	ctx, cancel := context.WithCancel(context.Background())
	m.ctx = ctx
	m.cancel = cancel
	m.isRunning = true

	// Update metrics
	m.metrics.Lock()
	m.metrics.WorkerStatus = "running"
	m.metrics.LastStartTime = time.Now()
	m.metrics.Unlock()

	// Start processing in background
	go m.processLoop()

	log.Printf("Worker %s started", m.workerID)
	return nil
}

func (m *Manager) Stop() error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if !m.isRunning {
		return fmt.Errorf("worker is not running")
	}

	log.Printf("Worker %s stopping - waiting for tasks to complete", m.workerID)

	// Cancel context and wait for all processing to complete
	m.cancel()
	m.processingWg.Wait()

	// Update status
	m.isRunning = false
	m.metrics.Lock()
	m.metrics.WorkerStatus = "stopped"
	m.metrics.Unlock()

	log.Printf("Worker %s stopped", m.workerID)
	return nil
}

func (m *Manager) GetMetrics() *Metrics {
	m.metrics.Lock()
	defer m.metrics.Unlock()
	return m.metrics
}

// Run starts the manager and blocks until context is cancelled
func (m *Manager) Run(ctx context.Context) error {
	// Start the worker
	if err := m.Start(); err != nil {
		return fmt.Errorf("start worker: %w", err)
	}

	// Wait for context cancellation
	<-ctx.Done()

	// Stop the worker
	if err := m.Stop(); err != nil {
		return fmt.Errorf("stop worker: %w", err)
	}

	return nil
}