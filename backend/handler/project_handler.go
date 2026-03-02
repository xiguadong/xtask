package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"xtask/backend/store"
)

type ProjectHandler struct {
	registry *store.ProjectRegistry
}

func NewProjectHandler(registry *store.ProjectRegistry) *ProjectHandler {
	return &ProjectHandler{registry: registry}
}

func (h *ProjectHandler) Mount(r chi.Router) {
	r.Get("/projects", Wrap(h.ListProjects))
	r.Post("/projects", Wrap(h.AddProject))
	r.Get("/projects/{projectID}", Wrap(h.GetProject))
}

func (h *ProjectHandler) ListProjects(w http.ResponseWriter, _ *http.Request) error {
	resp, err := h.registry.ListSummaries()
	if err != nil {
		return err
	}
	JSON(w, http.StatusOK, resp)
	return nil
}

func (h *ProjectHandler) AddProject(w http.ResponseWriter, r *http.Request) error {
	var body struct {
		Path string `json:"path"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		return err
	}
	if err := h.registry.AddPath(body.Path); err != nil {
		return err
	}
	JSON(w, http.StatusCreated, map[string]string{"status": "ok"})
	return nil
}

func (h *ProjectHandler) GetProject(w http.ResponseWriter, r *http.Request) error {
	projectID := chi.URLParam(r, "projectID")
	graph, err := h.registry.GetProject(projectID)
	if err != nil {
		return err
	}
	JSON(w, http.StatusOK, graph)
	return nil
}
