package handlers

import (
	"encoding/json"
	"net/http"

	"admin-server/internal/worker"
)

type WorkerControlHandler struct {
    manager *worker.Manager
}

func NewWorkerControlHandler(manager *worker.Manager) *WorkerControlHandler {
    return &WorkerControlHandler{
        manager: manager,
    }
}

func (h *WorkerControlHandler) HandleStart(w http.ResponseWriter, r *http.Request) {
	if err := h.manager.Start(); err != nil {
		http.Error(w, err.Error(), http.StatusConflict)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "started"})
}

func (h *WorkerControlHandler) HandleStop(w http.ResponseWriter, r *http.Request) {
	if err := h.manager.Stop(); err != nil {
		http.Error(w, err.Error(), http.StatusConflict)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "stopped"})
}

func (h *WorkerControlHandler) HandleMetrics(w http.ResponseWriter, r *http.Request) {
	metrics := h.manager.GetMetrics()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(metrics)
}