package store

import (
	"crypto/sha1"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"xtask/backend/model"
)

type registryData struct {
	Paths []string `json:"paths"`
}

type ProjectRegistry struct {
	registryPath string
	store        *YAMLStore
}

func NewProjectRegistry(path string, yamlStore *YAMLStore) *ProjectRegistry {
	return &ProjectRegistry{registryPath: path, store: yamlStore}
}

func BuildProjectID(projectPath string) string {
	h := sha1.Sum([]byte(projectPath))
	return "proj-" + hex.EncodeToString(h[:])[:10]
}

func (r *ProjectRegistry) loadPaths() ([]string, error) {
	if _, err := os.Stat(r.registryPath); os.IsNotExist(err) {
		return []string{}, nil
	}
	raw, err := os.ReadFile(r.registryPath)
	if err != nil {
		return nil, fmt.Errorf("read registry: %w", err)
	}
	data := registryData{}
	if err := json.Unmarshal(raw, &data); err != nil {
		return nil, fmt.Errorf("parse registry: %w", err)
	}
	return data.Paths, nil
}

func (r *ProjectRegistry) savePaths(paths []string) error {
	if err := os.MkdirAll(filepath.Dir(r.registryPath), 0o755); err != nil {
		return fmt.Errorf("mkdir registry dir: %w", err)
	}
	data := registryData{Paths: paths}
	raw, err := json.MarshalIndent(data, "", "  ")
	if err != nil {
		return fmt.Errorf("marshal registry: %w", err)
	}
	return os.WriteFile(r.registryPath, raw, 0o644)
}

func (r *ProjectRegistry) AddPath(path string) error {
	abs, err := filepath.Abs(path)
	if err != nil {
		return fmt.Errorf("abs path: %w", err)
	}
	if info, err := os.Stat(abs); err != nil || !info.IsDir() {
		return fmt.Errorf("path must be existing directory: %s", abs)
	}

	paths, err := r.loadPaths()
	if err != nil {
		return err
	}
	for _, p := range paths {
		if p == abs {
			return nil
		}
	}
	paths = append(paths, abs)
	sort.Strings(paths)
	return r.savePaths(paths)
}

func (r *ProjectRegistry) ListSummaries() (*model.ProjectListResponse, error) {
	paths, err := r.loadPaths()
	if err != nil {
		return nil, err
	}

	resp := &model.ProjectListResponse{Projects: []model.ProjectSummary{}}
	now := time.Now().UTC()
	weekEnd := now.AddDate(0, 0, 7)

	for _, p := range paths {
		graph, err := r.store.Read(p)
		if err != nil {
			continue
		}
		if graph.Project.ID == "" {
			graph.Project.ID = BuildProjectID(p)
			_ = r.store.Write(p, graph)
		}

		done, blocked, dueSoon := 0, 0, false
		for _, t := range graph.Tasks {
			if t.Status == model.TaskStatusDone {
				done++
			}
			if t.Status == model.TaskStatusBlocked {
				blocked++
			}
			if t.DueDate != "" {
				if dd, err := time.Parse("2006-01-02", strings.TrimSpace(t.DueDate)); err == nil {
					if dd.After(now) && dd.Before(weekEnd) {
						dueSoon = true
						resp.Summary.DueThisWeek++
					}
				}
			}
		}

		progress := 0
		if len(graph.Tasks) > 0 {
			progress = int(float64(done) / float64(len(graph.Tasks)) * 100)
		}

		activeMilestone := ""
		for _, m := range graph.Milestones {
			if m.Status == model.MilestoneStatusOpen {
				activeMilestone = m.Title
				break
			}
		}

		resp.Projects = append(resp.Projects, model.ProjectSummary{
			ID:              graph.Project.ID,
			Name:            graph.Project.Name,
			Status:          graph.Project.Status,
			ActiveMilestone: activeMilestone,
			Progress:        progress,
			BlockedCount:    blocked,
			DueSoon:         dueSoon,
		})
		resp.Summary.BlockedTotal += blocked
	}

	resp.Summary.Total = len(resp.Projects)
	return resp, nil
}

func (r *ProjectRegistry) ResolvePathByID(projectID string) (string, error) {
	paths, err := r.loadPaths()
	if err != nil {
		return "", err
	}
	for _, p := range paths {
		graph, err := r.store.Read(p)
		if err != nil {
			continue
		}
		id := graph.Project.ID
		if id == "" {
			id = BuildProjectID(p)
		}
		if id == projectID {
			return p, nil
		}
	}
	return "", fmt.Errorf("project not found: %s", projectID)
}

func (r *ProjectRegistry) GetProject(projectID string) (*model.TaskGraph, error) {
	path, err := r.ResolvePathByID(projectID)
	if err != nil {
		return nil, err
	}
	return r.store.Read(path)
}

func (r *ProjectRegistry) SaveProject(projectID string, graph *model.TaskGraph) error {
	path, err := r.ResolvePathByID(projectID)
	if err != nil {
		return err
	}
	return r.store.Write(path, graph)
}

func (r *ProjectRegistry) MigrateLegacyAgentsToXTask() error {
	paths, err := r.loadPaths()
	if err != nil {
		return err
	}

	failures := []string{}
	for _, p := range paths {
		if err := r.store.MigrateLegacyAgentsToXTask(p); err != nil {
			failures = append(failures, fmt.Sprintf("%s: %v", p, err))
		}
	}
	if len(failures) > 0 {
		return fmt.Errorf("legacy migration failures: %s", strings.Join(failures, "; "))
	}
	return nil
}
