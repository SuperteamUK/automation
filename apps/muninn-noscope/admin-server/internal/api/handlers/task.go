package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"

	"admin-server/internal/database"

	"github.com/google/uuid"
)

type TaskHandler struct {
	queries *database.Queries
	logger  *log.Logger
	db 		*sql.DB
}

func NewTaskHandler(q *database.Queries, db *sql.DB, l *log.Logger) *TaskHandler {
	return &TaskHandler{
		queries: q,
		db: db,
		logger:  l,
	}
}

type CreateTaskRequest struct {
	ObjectID uuid.UUID       `json:"object_id"`
	Input    json.RawMessage `json:"input"`
}

func (h *TaskHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req CreateTaskRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Start transaction
	tx, err := h.db.BeginTx(r.Context(), nil)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	qtx := h.queries.WithTx(tx)

	// Check if object exists, create if not
	_, err = qtx.GetObject(r.Context(), &req.ObjectID)
	if err == sql.ErrNoRows {
		_, err = qtx.CreateObject(r.Context(), &req.ObjectID)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	} else if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Create task
	task, err := qtx.CreateTask(r.Context(), database.CreateTaskParams{
		ObjectID: &req.ObjectID,
		Input:    req.Input,
	})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if err := tx.Commit(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(task)
}

func (h *TaskHandler) List(w http.ResponseWriter, r *http.Request) {
	var objectID *uuid.UUID
	if idStr := r.URL.Query().Get("object_id"); idStr != "" {
		id, err := uuid.Parse(idStr)
		if err != nil {
			http.Error(w, "invalid object_id", http.StatusBadRequest)
			return
		}
		objectID = &id
	}

	var status string
	if s := r.URL.Query().Get("status"); s != "" {
		status = s
	}
	limit := 10
	if l := r.URL.Query().Get("limit"); l != "" {
		parsed, err := strconv.Atoi(l)
		if err == nil && parsed > 0 {
			limit = parsed
		}
	}

	offset := 0
	if o := r.URL.Query().Get("offset"); o != "" {
		parsed, err := strconv.Atoi(o)
		if err == nil && parsed >= 0 {
			offset = parsed
		}
	}
	listTaskParams := database.ListTasksParams{
		Column1: objectID,
		Column2: status,  // This is the issue - empty string is not NULL
		Limit:   int32(limit),
		Offset:  int32(offset),
	}
	tasks, err := h.queries.ListTasks(r.Context(), listTaskParams)
	if err != nil {
		fmt.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	// build pagination with CountTasks
	count, err := h.queries.CountTasks(r.Context(), database.CountTasksParams{
		Column1: objectID,
		Column2: status,
	})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	pagination := map[string]interface{}{
		"total": count,
		"limit": limit,
		"offset": offset,
	}
	response := map[string]interface{}{
		"tasks": tasks,
		"pagination": pagination,
	}
	json.NewEncoder(w).Encode(response)
}