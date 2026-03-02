package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"xtask/backend/service"
)

type RelationHandler struct {
	svc *service.GraphService
}

func NewRelationHandler(svc *service.GraphService) *RelationHandler {
	return &RelationHandler{svc: svc}
}

func (h *RelationHandler) Mount(r chi.Router) {
	r.Post("/projects/{projectID}/relations", Wrap(h.Create))
	r.Delete("/projects/{projectID}/relations/{relationID}", Wrap(h.Delete))
}

func (h *RelationHandler) Create(w http.ResponseWriter, r *http.Request) error {
	projectID := chi.URLParam(r, "projectID")
	var in service.CreateRelationInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		return err
	}
	in.Actor = r.Header.Get("X-Actor")
	rel, err := h.svc.CreateRelation(projectID, in)
	if err != nil {
		return err
	}
	JSON(w, http.StatusCreated, rel)
	return nil
}

func (h *RelationHandler) Delete(w http.ResponseWriter, r *http.Request) error {
	projectID := chi.URLParam(r, "projectID")
	relationID := chi.URLParam(r, "relationID")
	if err := h.svc.DeleteRelation(projectID, relationID, r.Header.Get("X-Actor")); err != nil {
		return err
	}
	JSON(w, http.StatusOK, map[string]string{"status": "deleted"})
	return nil
}
