package store

import (
	"os"
	"path/filepath"
	"testing"

	"xtask/backend/model"
)

func TestYAMLStore_ReadBootstrapAndWriteRoundtrip(t *testing.T) {
	projectDir := t.TempDir()
	s := NewYAMLStore()

	graph, err := s.Read(projectDir)
	if err != nil {
		t.Fatalf("read bootstrap: %v", err)
	}
	if graph.Version != 1 {
		t.Fatalf("expected version=1, got: %d", graph.Version)
	}

	if _, err := os.Stat(GraphPath(projectDir)); err != nil {
		t.Fatalf("graph file should exist after bootstrap read: %v", err)
	}

	graph.Tasks = append(graph.Tasks, model.Task{ID: "task-001", Title: "hello", Status: model.TaskStatusTodo, Priority: model.TaskPriorityMedium})
	if err := s.Write(projectDir, graph); err != nil {
		t.Fatalf("write graph: %v", err)
	}

	reloaded, err := s.Read(projectDir)
	if err != nil {
		t.Fatalf("read graph after write: %v", err)
	}
	if len(reloaded.Tasks) != 1 || reloaded.Tasks[0].Title != "hello" {
		t.Fatalf("unexpected task payload: %#v", reloaded.Tasks)
	}

	if _, err := os.Stat(filepath.Join(projectDir, ".xtask", "task_graph.lock")); err != nil {
		t.Fatalf("lock file should exist: %v", err)
	}
	if _, err := os.Stat(filepath.Join(projectDir, ".xtask", "task_rule_doc.md")); err != nil {
		t.Fatalf("rule doc should exist: %v", err)
	}
}

func TestYAMLStore_MigrateLegacyAgentsToXTask(t *testing.T) {
	projectDir := t.TempDir()
	legacyDir := filepath.Join(projectDir, ".agents")
	if err := os.MkdirAll(legacyDir, 0o755); err != nil {
		t.Fatalf("mkdir legacy dir: %v", err)
	}

	legacyGraph := `version: 1
project:
  id: "proj-legacy"
  name: "legacy-project"
  description: ""
  status: "healthy"
  created_at: "2026-03-02T00:00:00Z"
  updated_at: "2026-03-02T00:00:00Z"
  updated_by: "tester"
milestones: []
labels: []
tasks:
  - id: "task-001"
    title: "legacy task"
    description: ""
    status: "todo"
    priority: "medium"
    due_date: ""
    milestone_id: ""
    labels: []
    created_at: "2026-03-02T00:00:00Z"
    updated_at: "2026-03-02T00:00:00Z"
    updated_by: "tester"
    notes: ""
relations: []
history: []
`
	if err := os.WriteFile(filepath.Join(legacyDir, "task_graph.yaml"), []byte(legacyGraph), 0o644); err != nil {
		t.Fatalf("write legacy graph: %v", err)
	}

	s := NewYAMLStore()
	graph, err := s.Read(projectDir)
	if err != nil {
		t.Fatalf("read should migrate legacy graph: %v", err)
	}
	if len(graph.Tasks) != 1 || graph.Tasks[0].Title != "legacy task" {
		t.Fatalf("unexpected migrated task graph: %#v", graph.Tasks)
	}

	if _, err := os.Stat(filepath.Join(projectDir, ".xtask", "task_graph.yaml")); err != nil {
		t.Fatalf("migrated graph should exist in .xtask: %v", err)
	}
	if _, err := os.Stat(filepath.Join(projectDir, ".xtask", "task_rule_doc.md")); err != nil {
		t.Fatalf("migrated project should have task_rule_doc.md: %v", err)
	}
	if _, err := os.Stat(filepath.Join(projectDir, ".agents", "task_graph.yaml.migrated.bak")); err != nil {
		t.Fatalf("legacy graph should be backed up: %v", err)
	}
}
