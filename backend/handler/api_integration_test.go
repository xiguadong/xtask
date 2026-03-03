package handler_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/go-chi/chi/v5"
	"xtask/backend/handler"
	"xtask/backend/service"
	"xtask/backend/store"
)

func setupServer(t *testing.T) (*httptest.Server, string) {
	t.Helper()

	base := t.TempDir()
	projectDir := filepath.Join(base, "project")
	if err := os.MkdirAll(projectDir, 0o755); err != nil {
		t.Fatalf("mkdir project dir: %v", err)
	}
	absProjectDir, err := filepath.Abs(projectDir)
	if err != nil {
		t.Fatalf("abs project dir: %v", err)
	}

	registryPath := filepath.Join(base, ".xtask", "projects.json")
	yamlStore := store.NewYAMLStore()
	registry := store.NewProjectRegistry(registryPath, yamlStore)
	if err := registry.AddPath(absProjectDir); err != nil {
		t.Fatalf("add path: %v", err)
	}
	projectID := store.BuildProjectID(absProjectDir)
	if _, err := registry.GetProject(projectID); err != nil {
		t.Fatalf("bootstrap project graph: %v", err)
	}

	taskSvc := service.NewTaskService(registry)
	graphSvc := service.NewGraphService(registry)
	milestoneSvc := service.NewMilestoneService(registry)
	historySvc := service.NewHistoryService(registry)

	r := chi.NewRouter()
	r.Use(handler.WithCORS)
	r.Route("/api", func(api chi.Router) {
		handler.NewProjectHandler(registry).Mount(api)
		handler.NewTaskHandler(taskSvc).Mount(api)
		handler.NewMilestoneHandler(milestoneSvc).Mount(api)
		handler.NewRelationHandler(graphSvc).Mount(api)
		handler.NewHistoryHandler(historySvc).Mount(api)
	})

	server := httptest.NewServer(r)
	t.Cleanup(server.Close)
	return server, projectID
}

func httpJSON(t *testing.T, method, url string, body any) *http.Response {
	t.Helper()
	var payload []byte
	if body != nil {
		raw, err := json.Marshal(body)
		if err != nil {
			t.Fatalf("marshal body: %v", err)
		}
		payload = raw
	}

	req, err := http.NewRequest(method, url, bytes.NewReader(payload))
	if err != nil {
		t.Fatalf("new request: %v", err)
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	return resp
}

func decodeBody(t *testing.T, resp *http.Response, dst any) {
	t.Helper()
	defer resp.Body.Close()
	if err := json.NewDecoder(resp.Body).Decode(dst); err != nil {
		t.Fatalf("decode response: %v", err)
	}
}

func assertErrorCode(t *testing.T, resp *http.Response, status int, code string) {
	t.Helper()
	if resp.StatusCode != status {
		t.Fatalf("expected %d, got %d", status, resp.StatusCode)
	}
	var errBody struct {
		Error struct {
			Code string `json:"code"`
		} `json:"error"`
	}
	decodeBody(t, resp, &errBody)
	if errBody.Error.Code != code {
		t.Fatalf("expected error code %s, got %s", code, errBody.Error.Code)
	}
}

func TestTaskEndpoints_CreateAndList(t *testing.T) {
	server, projectID := setupServer(t)

	create := httpJSON(t, http.MethodPost, server.URL+"/api/projects/"+projectID+"/tasks", map[string]any{
		"title":    "api-task",
		"priority": "high",
	})
	if create.StatusCode != http.StatusCreated {
		t.Fatalf("expected 201, got %d", create.StatusCode)
	}

	list := httpJSON(t, http.MethodGet, server.URL+"/api/projects/"+projectID+"/tasks", nil)
	if list.StatusCode != http.StatusOK {
		t.Fatalf("expected 200, got %d", list.StatusCode)
	}

	var payload struct {
		Tasks []struct {
			Title string `json:"title"`
		} `json:"tasks"`
	}
	decodeBody(t, list, &payload)
	if len(payload.Tasks) != 1 || payload.Tasks[0].Title != "api-task" {
		t.Fatalf("unexpected tasks payload: %#v", payload.Tasks)
	}
}

func TestProjectEndpoint_DeleteProject(t *testing.T) {
	server, projectID := setupServer(t)

	listBefore := httpJSON(t, http.MethodGet, server.URL+"/api/projects", nil)
	if listBefore.StatusCode != http.StatusOK {
		t.Fatalf("list projects expected 200, got %d", listBefore.StatusCode)
	}
	var beforePayload struct {
		Projects []struct {
			ID string `json:"id"`
		} `json:"projects"`
	}
	decodeBody(t, listBefore, &beforePayload)
	if len(beforePayload.Projects) != 1 {
		t.Fatalf("expected 1 project before delete, got %d", len(beforePayload.Projects))
	}

	deleted := httpJSON(t, http.MethodDelete, server.URL+"/api/projects/"+projectID, nil)
	if deleted.StatusCode != http.StatusOK {
		t.Fatalf("delete project expected 200, got %d", deleted.StatusCode)
	}
	_ = deleted.Body.Close()

	listAfter := httpJSON(t, http.MethodGet, server.URL+"/api/projects", nil)
	if listAfter.StatusCode != http.StatusOK {
		t.Fatalf("list projects expected 200, got %d", listAfter.StatusCode)
	}
	var afterPayload struct {
		Projects []struct {
			ID string `json:"id"`
		} `json:"projects"`
	}
	decodeBody(t, listAfter, &afterPayload)
	if len(afterPayload.Projects) != 0 {
		t.Fatalf("expected 0 projects after delete, got %d", len(afterPayload.Projects))
	}

	missing := httpJSON(t, http.MethodGet, server.URL+"/api/projects/"+projectID, nil)
	assertErrorCode(t, missing, http.StatusNotFound, "NOT_FOUND")
}

func TestTaskDoneBlockedConstraint_Returns409(t *testing.T) {
	server, projectID := setupServer(t)

	createTask := func(title string) string {
		resp := httpJSON(t, http.MethodPost, server.URL+"/api/projects/"+projectID+"/tasks", map[string]any{"title": title})
		if resp.StatusCode != http.StatusCreated {
			t.Fatalf("create task expected 201, got %d", resp.StatusCode)
		}
		var task struct {
			ID string `json:"id"`
		}
		decodeBody(t, resp, &task)
		return task.ID
	}

	blockerID := createTask("blocker")
	targetID := createTask("target")

	rel := httpJSON(t, http.MethodPost, server.URL+"/api/projects/"+projectID+"/relations", map[string]any{
		"type":      "blocks",
		"source_id": blockerID,
		"target_id": targetID,
	})
	if rel.StatusCode != http.StatusCreated {
		t.Fatalf("create relation expected 201, got %d", rel.StatusCode)
	}
	_ = rel.Body.Close()

	done := httpJSON(t, http.MethodPut, server.URL+"/api/projects/"+projectID+"/tasks/"+targetID, map[string]any{
		"status": "done",
	})
	if done.StatusCode != http.StatusConflict {
		t.Fatalf("expected 409, got %d", done.StatusCode)
	}
	var errBody struct {
		Error struct {
			Code string `json:"code"`
		} `json:"error"`
	}
	decodeBody(t, done, &errBody)
	if errBody.Error.Code != "BLOCKED_CONSTRAINT" {
		t.Fatalf("expected BLOCKED_CONSTRAINT, got %s", errBody.Error.Code)
	}
}

func TestRelationCycle_Returns422(t *testing.T) {
	server, projectID := setupServer(t)

	createTask := func(title string) string {
		resp := httpJSON(t, http.MethodPost, server.URL+"/api/projects/"+projectID+"/tasks", map[string]any{"title": title})
		if resp.StatusCode != http.StatusCreated {
			t.Fatalf("create task expected 201, got %d", resp.StatusCode)
		}
		var task struct {
			ID string `json:"id"`
		}
		decodeBody(t, resp, &task)
		return task.ID
	}

	a := createTask("a")
	b := createTask("b")
	c := createTask("c")

	for _, rel := range []map[string]any{
		{"type": "blocks", "source_id": a, "target_id": b},
		{"type": "blocks", "source_id": b, "target_id": c},
	} {
		resp := httpJSON(t, http.MethodPost, server.URL+"/api/projects/"+projectID+"/relations", rel)
		if resp.StatusCode != http.StatusCreated {
			t.Fatalf("create relation expected 201, got %d", resp.StatusCode)
		}
		_ = resp.Body.Close()
	}

	cycle := httpJSON(t, http.MethodPost, server.URL+"/api/projects/"+projectID+"/relations", map[string]any{
		"type":      "blocks",
		"source_id": c,
		"target_id": a,
	})
	if cycle.StatusCode != http.StatusUnprocessableEntity {
		t.Fatalf("expected 422, got %d", cycle.StatusCode)
	}
	var errBody struct {
		Error struct {
			Code string `json:"code"`
		} `json:"error"`
	}
	decodeBody(t, cycle, &errBody)
	if errBody.Error.Code != "CYCLE_DETECTED" {
		t.Fatalf("expected CYCLE_DETECTED, got %s", errBody.Error.Code)
	}
}

func TestAPIErrorCodes_InvalidInputAndNotFound(t *testing.T) {
	server, projectID := setupServer(t)

	invalidTask := httpJSON(t, http.MethodPost, server.URL+"/api/projects/"+projectID+"/tasks", map[string]any{
		"title": "   ",
	})
	assertErrorCode(t, invalidTask, http.StatusBadRequest, "INVALID_INPUT")

	invalidMilestone := httpJSON(t, http.MethodPost, server.URL+"/api/projects/"+projectID+"/milestones", map[string]any{
		"title": "",
	})
	assertErrorCode(t, invalidMilestone, http.StatusBadRequest, "INVALID_INPUT")

	invalidRelation := httpJSON(t, http.MethodPost, server.URL+"/api/projects/"+projectID+"/relations", map[string]any{
		"type": "blocks",
	})
	assertErrorCode(t, invalidRelation, http.StatusBadRequest, "INVALID_INPUT")

	missingTask := httpJSON(t, http.MethodPut, server.URL+"/api/projects/"+projectID+"/tasks/task-not-exists", map[string]any{
		"title": "new-title",
	})
	assertErrorCode(t, missingTask, http.StatusNotFound, "NOT_FOUND")

	missingRelation := httpJSON(t, http.MethodDelete, server.URL+"/api/projects/"+projectID+"/relations/rel-not-exists", nil)
	assertErrorCode(t, missingRelation, http.StatusNotFound, "NOT_FOUND")
}
