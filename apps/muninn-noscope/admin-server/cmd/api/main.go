package main

import (
	"database/sql"
	"log"
	"net/http"
	"os"

	"admin-server/internal/api"
	"admin-server/internal/api/config"
	"admin-server/internal/database"

	_ "github.com/lib/pq"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}
	logger := log.New(os.Stdout, "", log.LstdFlags)

	// Initialize database connection
	db, err := sql.Open("postgres", cfg.DatabaseURL)
	if err != nil {
		logger.Fatal(err)
	}
	defer db.Close()

	// Create queries
	queries := database.New(db)

	// Initialize router
	router := api.NewRouter(queries, logger, db)

	// Start server
	logger.Printf("Server starting on :8181")
	if err := http.ListenAndServe(":8181", router); err != nil {
		logger.Fatal(err)
	}
}