// cmd/api/main.go
package main

import (
	"context"
	"database/sql"
	"log"
	"net/http"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"time"

	"admin-server/internal/api"
	"admin-server/internal/api/config"
	"admin-server/internal/database"
	"admin-server/internal/util"
	"admin-server/internal/worker"

	_ "github.com/lib/pq"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}
	// logger := log.New(os.Stdout, "", log.LstdFlags)
	fileLogger, err :=  util.NewFileLogger("./logs")
	if err != nil {
		log.Fatalf("Failed to create file logger: %v", err)
	}
	logger := fileLogger.Logger
	defer fileLogger.Close()


	// Initialize database connection
	db, err := sql.Open("postgres", cfg.DatabaseURL)
	if err != nil {
		logger.Fatal(err)
	}
	defer db.Close()

	// Create queries
	queries := database.New(db)

	// Create context that listens for interrupt signals
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Handle OS signals
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)

	// WaitGroup to track all services
	var wg sync.WaitGroup

	// Start worker manager
	mgr := worker.NewManager(db,fileLogger.Logger)
	wg.Add(1)
	go func() {
		defer wg.Done()
		if err := mgr.Run(ctx); err != nil {
			logger.Printf("Worker manager error: %v", err)
		}
	}()

	// Initialize router
	router := api.NewRouter(queries, logger, db, mgr)

	// Create server
	server := &http.Server{
		Addr:    ":8181",
		Handler: router,
	}

	// Start server in goroutine
	wg.Add(1)
	go func() {
		defer wg.Done()
		logger.Printf("Server starting on :8181, start writing to file")
		if err := server.ListenAndServe(); err != http.ErrServerClosed {
			logger.Printf("Server error: %v", err)
		}
	}()

	// Wait for shutdown signal
	<-sigChan
	logger.Println("Received shutdown signal")

	// Create shutdown context with timeout
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer shutdownCancel()

	// Cancel main context to stop worker
	cancel()

	// Shutdown server gracefully
	if err := server.Shutdown(shutdownCtx); err != nil {
		logger.Printf("Server shutdown error: %v", err)
	}

	// Wait for all services to complete
	wg.Wait()
	logger.Println("Graceful shutdown completed")
}