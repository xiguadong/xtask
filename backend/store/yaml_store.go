package store

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"syscall"
	"time"

	"gopkg.in/yaml.v3"
	"xtask/backend/model"
)

const (
	taskDirName      = ".xtask"
	legacyTaskDir    = ".agents"
	graphFileName    = "task_graph.yaml"
	lockFileName     = "task_graph.lock"
	ruleDocName      = "task_rule_doc.md"
	defaultActor     = "system"
	migratedFilePost = ".migrated.bak"
)

type YAMLStore struct{}

func NewYAMLStore() *YAMLStore {
	return &YAMLStore{}
}

func GraphPath(projectDir string) string {
	return filepath.Join(projectDir, taskDirName, graphFileName)
}

func lockPath(projectDir string) string {
	return filepath.Join(projectDir, taskDirName, lockFileName)
}

func ruleDocPath(projectDir string) string {
	return filepath.Join(projectDir, taskDirName, ruleDocName)
}

func legacyGraphPath(projectDir string) string {
	return filepath.Join(projectDir, legacyTaskDir, graphFileName)
}

func (s *YAMLStore) Read(projectDir string) (*model.TaskGraph, error) {
	path := GraphPath(projectDir)
	if _, err := os.Stat(path); errors.Is(err, os.ErrNotExist) {
		if err := s.MigrateLegacyAgentsToXTask(projectDir); err != nil {
			return nil, err
		}
	}
	if _, err := os.Stat(path); errors.Is(err, os.ErrNotExist) {
		graph := defaultGraph(projectDir)
		if err := s.Write(projectDir, graph); err != nil {
			return nil, err
		}
		if err := s.ensureRuleDoc(projectDir, graph); err != nil {
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
	if err := s.ensureRuleDoc(projectDir, graph); err != nil {
		return nil, err
	}
	return graph, nil
}

func (s *YAMLStore) Write(projectDir string, graph *model.TaskGraph) error {
	taskDir := filepath.Join(projectDir, taskDirName)
	if err := os.MkdirAll(taskDir, 0o755); err != nil {
		return fmt.Errorf("mkdir task dir: %w", err)
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

func (s *YAMLStore) MigrateLegacyAgentsToXTask(projectDir string) error {
	targetPath := GraphPath(projectDir)
	if _, err := os.Stat(targetPath); err == nil {
		return nil
	}

	legacyPath := legacyGraphPath(projectDir)
	if _, err := os.Stat(legacyPath); errors.Is(err, os.ErrNotExist) {
		return nil
	}

	raw, err := os.ReadFile(legacyPath)
	if err != nil {
		return fmt.Errorf("read legacy graph: %w", err)
	}
	graph := &model.TaskGraph{}
	if err := yaml.Unmarshal(raw, graph); err != nil {
		return fmt.Errorf("parse legacy graph: %w", err)
	}
	if graph.Version == 0 {
		graph.Version = 1
	}
	if graph.Project.ID == "" {
		graph.Project.ID = BuildProjectID(projectDir)
	}
	if graph.Project.Name == "" {
		graph.Project.Name = filepath.Base(projectDir)
	}
	if err := s.Write(projectDir, graph); err != nil {
		return fmt.Errorf("write migrated graph: %w", err)
	}
	if err := s.ensureRuleDoc(projectDir, graph); err != nil {
		return err
	}

	backupPath := legacyPath + migratedFilePost
	if err := os.Rename(legacyPath, backupPath); err != nil {
		return fmt.Errorf("backup legacy graph: %w", err)
	}
	return nil
}

func (s *YAMLStore) ensureRuleDoc(projectDir string, graph *model.TaskGraph) error {
	path := ruleDocPath(projectDir)
	if _, err := os.Stat(path); err == nil {
		return nil
	}
	taskDir := filepath.Join(projectDir, taskDirName)
	if err := os.MkdirAll(taskDir, 0o755); err != nil {
		return fmt.Errorf("mkdir task dir for rule doc: %w", err)
	}
	body := defaultRuleDoc(projectDir, graph)
	tmpPath := path + ".tmp"
	if err := os.WriteFile(tmpPath, []byte(body), 0o644); err != nil {
		return fmt.Errorf("write rule doc temp: %w", err)
	}
	if err := os.Rename(tmpPath, path); err != nil {
		return fmt.Errorf("rename rule doc temp: %w", err)
	}
	return nil
}

func defaultRuleDoc(projectDir string, graph *model.TaskGraph) string {
	projectName := filepath.Base(projectDir)
	projectID := BuildProjectID(projectDir)
	if graph != nil {
		if strings.TrimSpace(graph.Project.Name) != "" {
			projectName = graph.Project.Name
		}
		if strings.TrimSpace(graph.Project.ID) != "" {
			projectID = graph.Project.ID
		}
	}
	return fmt.Sprintf(`# Task Rule Doc

## 1. Goal And Scope

- Project: %s (%s)
- Scope: track milestones, parent tasks, child tasks, and relations in .xtask/task_graph.yaml.

## 2. Source Priority

- Priority order: README > design* > plan.md > task.md
- If a source is missing, continue with available sources and keep a note in history.

## 3. Milestone Confirmation Rule

- Propose milestone options (2/3/4+) and confirm with user before planning parent tasks.

## 4. Module View Rule

- Every task must include at least one module label.
- Default module labels: module:env, module:ci.
- Additional module labels must be confirmed with user.

## 5. Parent Task Planning Rule

- Parent tasks are planned per milestone and must be confirmed with user.
- Child tasks should inherit milestone_id from parent task.

## 6. Task Graph Update Rule

- New tasks and completed tasks must update .xtask/task_graph.yaml immediately.
- Each update must append one history entry with actor and timestamp.

## 7. AGENTS And CLAUDE Sync Rule

- AGENTS.md and CLAUDE.md in current repository must include the rule:
  "new and completed tasks must sync to .xtask/task_graph.yaml".
`, projectName, projectID)
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
