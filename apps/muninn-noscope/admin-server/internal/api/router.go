package api

import (
	"database/sql"
	"log"

	"admin-server/internal/api/handlers"
	"admin-server/internal/database"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

func NewRouter(queries *database.Queries, logger *log.Logger, db *sql.DB) chi.Router {
	r := chi.NewRouter()

	// Middleware
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:          300,
	}))

	// Initialize handlers
	taskHandler := handlers.NewTaskHandler(queries, db, logger)
	objectHandler := handlers.NewObjectHandler(queries, logger)

	// Routes
	r.Post("/tasks", taskHandler.Create)
	r.Get("/tasks", taskHandler.List)
	r.Get("/objects", objectHandler.List)

	return r
}