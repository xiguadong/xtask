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

	if _, err := os.Stat(filepath.Join(projectDir, ".agents", "task_graph.lock")); err != nil {
		t.Fatalf("lock file should exist: %v", err)
	}
}
