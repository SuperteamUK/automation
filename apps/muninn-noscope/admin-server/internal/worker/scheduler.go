// internal/worker/scheduler.go
package worker

import (
	"admin-server/internal/worker/schedule_task"
	"context"
	"fmt"
	"log"
	"sync"
	"time"
)

type Scheduler struct {
	tasks     map[string]*ScheduledTask
	logger    *log.Logger
	wg        sync.WaitGroup      // Add WaitGroup for tracking running tasks
	mu        sync.RWMutex        // Add mutex for tasks map
	isRunning bool
}

type ScheduledTask struct {
	Handler  schedule_task.TaskHandler
	Interval time.Duration
	LastRun  time.Time
}

func NewScheduler(logger *log.Logger) *Scheduler {
	return &Scheduler{
		tasks:     make(map[string]*ScheduledTask),
		logger:    logger,
		isRunning: false,
	}
}

func (s *Scheduler) AddTask(name string, handler schedule_task.TaskHandler, interval time.Duration) {
	s.mu.Lock()
	defer s.mu.Unlock()
	
	s.tasks[name] = &ScheduledTask{
		Handler:  handler,
		Interval: interval,
		LastRun:  time.Time{},
	}
}

func (s *Scheduler) Start(ctx context.Context) error {
	s.mu.Lock()
	if s.isRunning {
		s.mu.Unlock()
		return fmt.Errorf("scheduler is already running")
	}
	s.isRunning = true
	s.mu.Unlock()
	// todo: change to 1 minute again
	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			s.logger.Println("Scheduler received shutdown signal, waiting for tasks to complete...")
			s.wg.Wait()
			s.mu.Lock()
			s.isRunning = false
			s.mu.Unlock()
			s.logger.Println("Scheduler shutdown complete")
			return nil
		case <-ticker.C:
			s.runDueTasks(ctx)
		}
	}
}

func (s *Scheduler) runDueTasks(ctx context.Context) {
	now := time.Now()
	
	// Use RLock for reading the tasks map
	s.mu.RLock()
	tasksCopy := make(map[string]*ScheduledTask, len(s.tasks))
	for name, task := range s.tasks {
		tasksCopy[name] = task
	}
	s.mu.RUnlock()

	for name, task := range tasksCopy {
		if now.Sub(task.LastRun) >= task.Interval {
			s.wg.Add(1)
			go func(name string, task *ScheduledTask) {
				defer s.wg.Done()
				
				// Create a timeout context for the task
				taskCtx, cancel := context.WithTimeout(ctx, task.Interval/2)
				defer cancel()

				s.logger.Printf("Running scheduled task: %s\n", name)
				
				if err := task.Handler.Handle(taskCtx); err != nil {
					s.logger.Printf("Error running task %s: %v\n", name, err)
					return
				}

				// Update LastRun time under lock
				s.mu.Lock()
				if t, exists := s.tasks[name]; exists {
					t.LastRun = now
				}
				s.mu.Unlock()
				
				s.logger.Printf("Completed scheduled task: %s\n", name)
			}(name, task)
		}
	}
}

// Add method to check if scheduler is running
func (s *Scheduler) IsRunning() bool {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.isRunning
}

// Add method to wait for shutdown
func (s *Scheduler) WaitForShutdown() {
	s.wg.Wait()
}