package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"xtask/backend/service"
)

type TaskHandler struct {
	svc *service.TaskService
}

func NewTaskHandler(svc *service.TaskService) *TaskHandler {
	return &TaskHandler{svc: svc}
}

func (h *TaskHandler) Mount(r chi.Router) {
	r.Get("/projects/{projectID}/tasks", Wrap(h.List))
	r.Post("/projects/{projectID}/tasks", Wrap(h.Create))
	r.Put("/projects/{projectID}/tasks/{taskID}", Wrap(h.Update))
	r.Delete("/projects/{projectID}/tasks/{taskID}", Wrap(h.Delete))
}

func (h *TaskHandler) List(w http.ResponseWriter, r *http.Request) error {
	projectID := chi.URLParam(r, "projectID")
	query := service.TaskQueryFromValues(r.URL.Query())
	tasks, err := h.svc.List(projectID, query)
	if err != nil {
		return err
	}
	JSON(w, http.StatusOK, map[string]interface{}{"tasks": tasks})
	return nil
}

func (h *TaskHandler) Create(w http.ResponseWriter, r *http.Request) error {
	projectID := chi.URLParam(r, "projectID")
	var in service.CreateTaskInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		return err
	}
	task, err := h.svc.Create(projectID, in, r.Header.Get("X-Actor"))
	if err != nil {
		return err
	}
	JSON(w, http.StatusCreated, task)
	return nil
}

func (h *TaskHandler) Update(w http.ResponseWriter, r *http.Request) error {
	projectID := chi.URLParam(r, "projectID")
	taskID := chi.URLParam(r, "taskID")
	var in service.UpdateTaskInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		return err
	}
	in.UpdatedBy = r.Header.Get("X-Actor")
	task, err := h.svc.Update(projectID, taskID, in)
	if err != nil {
		return err
	}
	JSON(w, http.StatusOK, task)
	return nil
}

func (h *TaskHandler) Delete(w http.ResponseWriter, r *http.Request) error {
	projectID := chi.URLParam(r, "projectID")
	taskID := chi.URLParam(r, "taskID")
	if err := h.svc.Delete(projectID, taskID, r.Header.Get("X-Actor")); err != nil {
		return err
	}
	JSON(w, http.StatusOK, map[string]string{"status": "deleted"})
	return nil
}
