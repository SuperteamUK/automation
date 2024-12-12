package api

import (
	"database/sql"
	"log"
	"net/http"
	"os"

	"admin-server/internal/api/handlers"
	"admin-server/internal/database"
	"admin-server/internal/worker"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

func NewRouter(queries *database.Queries, logger *log.Logger, db *sql.DB, workerMgr *worker.Manager) chi.Router {
	r := chi.NewRouter()

	// Middleware
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "x-control-key", "x-user-secret"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:          300,
	}))

	// Initialize handlers
	taskHandler := handlers.NewTaskHandler(queries, db, logger)
	objectHandler := handlers.NewObjectHandler(queries, logger)
	workerCtrl := handlers.NewWorkerControlHandler(workerMgr)
	authCtrl := handlers.NewAuthHandler(queries, logger)

	// Routes
	r.Post("/tasks", taskHandler.Create)
	r.Get("/tasks", taskHandler.List)
	r.Get("/objects", objectHandler.List)
	r.Post("/login", authCtrl.Login)

	r.Get("/stats", handlers.HealthCheck(queries))
	
	r.Route("/api/worker", func(r chi.Router) {
		r.Use(authenticateWorkerControl)
		r.Post("/start", workerCtrl.HandleStart)
		r.Post("/stop", workerCtrl.HandleStop)
		r.Get("/metrics", workerCtrl.HandleMetrics)
	})

	return r

}


func authenticateWorkerControl(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		key := r.Header.Get("X-Control-Key")
		if key == "" {
			http.Error(w, "missing control key", http.StatusUnauthorized)
			return
		}
		if key != os.Getenv("CONTROL_SECRET_KEY") {
			http.Error(w, "invalid control key", http.StatusUnauthorized)
			return
		}
		next.ServeHTTP(w, r)
	})
}