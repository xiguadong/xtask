package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"xtask/backend/service"
)

type MilestoneHandler struct {
	svc *service.MilestoneService
}

func NewMilestoneHandler(svc *service.MilestoneService) *MilestoneHandler {
	return &MilestoneHandler{svc: svc}
}

func (h *MilestoneHandler) Mount(r chi.Router) {
	r.Get("/projects/{projectID}/milestones", Wrap(h.List))
	r.Post("/projects/{projectID}/milestones", Wrap(h.Create))
	r.Put("/projects/{projectID}/milestones/{msID}", Wrap(h.Update))
}

func (h *MilestoneHandler) List(w http.ResponseWriter, r *http.Request) error {
	projectID := chi.URLParam(r, "projectID")
	items, err := h.svc.List(projectID)
	if err != nil {
		return err
	}
	JSON(w, http.StatusOK, map[string]interface{}{"milestones": items})
	return nil
}

func (h *MilestoneHandler) Create(w http.ResponseWriter, r *http.Request) error {
	projectID := chi.URLParam(r, "projectID")
	var in service.CreateMilestoneInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		return err
	}
	ms, err := h.svc.Create(projectID, in, r.Header.Get("X-Actor"))
	if err != nil {
		return err
	}
	JSON(w, http.StatusCreated, ms)
	return nil
}

func (h *MilestoneHandler) Update(w http.ResponseWriter, r *http.Request) error {
	projectID := chi.URLParam(r, "projectID")
	msID := chi.URLParam(r, "msID")
	var in service.UpdateMilestoneInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		return err
	}
	in.UpdatedBy = r.Header.Get("X-Actor")
	ms, err := h.svc.Update(projectID, msID, in)
	if err != nil {
		return err
	}
	JSON(w, http.StatusOK, ms)
	return nil
}
