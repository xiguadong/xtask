package store

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"syscall"
	"time"

	"gopkg.in/yaml.v3"
	"xtask/backend/model"
)

const (
	agentsDirName = ".agents"
	graphFileName = "task_graph.yaml"
	lockFileName  = "task_graph.lock"
	defaultActor  = "system"
)

type YAMLStore struct{}

func NewYAMLStore() *YAMLStore {
	return &YAMLStore{}
}

func GraphPath(projectDir string) string {
	return filepath.Join(projectDir, agentsDirName, graphFileName)
}

func lockPath(projectDir string) string {
	return filepath.Join(projectDir, agentsDirName, lockFileName)
}

func (s *YAMLStore) Read(projectDir string) (*model.TaskGraph, error) {
	path := GraphPath(projectDir)
	if _, err := os.Stat(path); errors.Is(err, os.ErrNotExist) {
		graph := defaultGraph(projectDir)
		if err := s.Write(projectDir, graph); err != nil {
			return nil, err
		}
		return graph, nil
	}

	raw, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("read graph: %w", err)
	}
	graph := &model.TaskGraph{}
	if err := yaml.Unmarshal(raw, graph); err != nil {
		return nil, fmt.Errorf("unmarshal yaml: %w", err)
	}
	if graph.Version == 0 {
		graph.Version = 1
	}
	return graph, nil
}

func (s *YAMLStore) Write(projectDir string, graph *model.TaskGraph) error {
	agentsDir := filepath.Join(projectDir, agentsDirName)
	if err := os.MkdirAll(agentsDir, 0o755); err != nil {
		return fmt.Errorf("mkdir agents dir: %w", err)
	}

	lockFile, err := os.OpenFile(lockPath(projectDir), os.O_CREATE|os.O_RDWR, 0o644)
	if err != nil {
		return fmt.Errorf("open lock file: %w", err)
	}
	defer lockFile.Close()

	if err := syscall.Flock(int(lockFile.Fd()), syscall.LOCK_EX); err != nil {
		return fmt.Errorf("lock file: %w", err)
	}
	defer syscall.Flock(int(lockFile.Fd()), syscall.LOCK_UN)

	raw, err := yaml.Marshal(graph)
	if err != nil {
		return fmt.Errorf("marshal yaml: %w", err)
	}

	path := GraphPath(projectDir)
	tmpPath := path + ".tmp"
	if err := os.WriteFile(tmpPath, raw, 0o644); err != nil {
		return fmt.Errorf("write temp file: %w", err)
	}
	if err := os.Rename(tmpPath, path); err != nil {
		return fmt.Errorf("atomic rename: %w", err)
	}

	return nil
}

func defaultGraph(projectDir string) *model.TaskGraph {
	now := time.Now().UTC().Format(time.RFC3339)
	name := filepath.Base(projectDir)
	return &model.TaskGraph{
		Version: 1,
		Project: model.Project{
			ID:          BuildProjectID(projectDir),
			Name:        name,
			Description: "",
			Status:      model.ProjectHealthHealthy,
			CreatedAt:   now,
			UpdatedAt:   now,
			UpdatedBy:   defaultActor,
		},
		Milestones: []model.Milestone{},
		Labels:     []model.Label{},
		Tasks:      []model.Task{},
		Relations:  []model.Relation{},
		History:    []model.HistoryEntry{},
	}
}
