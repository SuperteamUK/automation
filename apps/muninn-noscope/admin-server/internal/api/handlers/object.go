package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	"admin-server/internal/database"

	"github.com/google/uuid"
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
	var objectID *uuid.UUID
	if idStr := r.URL.Query().Get("id"); idStr != "" {
		id, err := uuid.Parse(idStr)
		if err != nil {
			http.Error(w, "invalid id", http.StatusBadRequest)
			return
		}
		objectID = &id
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

	objects, err := h.queries.ListObjects(r.Context(), database.ListObjectsParams{
		Column1:     *objectID,
		Limit:  int32(limit),
		Offset: int32(offset),
	})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(objects)
}