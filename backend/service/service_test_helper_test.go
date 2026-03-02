package service

import (
	"os"
	"path/filepath"
	"testing"

	"xtask/backend/store"
)

func newTestRegistry(t *testing.T) (*store.ProjectRegistry, string, string) {
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
	registry := store.NewProjectRegistry(registryPath, store.NewYAMLStore())
	if err := registry.AddPath(absProjectDir); err != nil {
		t.Fatalf("add path: %v", err)
	}

	projectID := store.BuildProjectID(absProjectDir)
	if _, err := registry.GetProject(projectID); err != nil {
		t.Fatalf("bootstrap project graph: %v", err)
	}

	return registry, projectID, absProjectDir
}
