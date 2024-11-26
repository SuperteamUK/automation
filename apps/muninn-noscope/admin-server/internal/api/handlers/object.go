package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	"admin-server/internal/database"
)

type ObjectHandler struct {
	queries *database.Queries
	logger  *log.Logger
}

func NewObjectHandler(q *database.Queries, l *log.Logger) *ObjectHandler {
	return &ObjectHandler{
		queries: q,
		logger:  l,
	}
}

func (h *ObjectHandler) List(w http.ResponseWriter, r *http.Request) {
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

	objects, err := h.queries.ListObjects(r.Context(), database.ListObjectsParams{
		Limit:  int32(limit),
		Offset: int32(offset),
	})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// build pagination with CountTasks
	count, err := h.queries.CountObjects(r.Context())
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
		"objects": objects,
		"pagination": pagination,
	}
	json.NewEncoder(w).Encode(response)
}