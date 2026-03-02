package handler

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"xtask/backend/service"
)

type HistoryHandler struct {
	svc *service.HistoryService
}

func NewHistoryHandler(svc *service.HistoryService) *HistoryHandler {
	return &HistoryHandler{svc: svc}
}

func (h *HistoryHandler) Mount(r chi.Router) {
	r.Get("/projects/{projectID}/history", Wrap(h.List))
}

func (h *HistoryHandler) List(w http.ResponseWriter, r *http.Request) error {
	projectID := chi.URLParam(r, "projectID")
	taskID := r.URL.Query().Get("task_id")
	limit, offset := service.ParsePagination(r.URL.Query().Get("limit"), r.URL.Query().Get("offset"))
	entries, err := h.svc.List(projectID, taskID, limit, offset)
	if err != nil {
		return err
	}
	JSON(w, http.StatusOK, map[string]interface{}{"history": entries})
	return nil
}
