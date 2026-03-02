package service

import (
	"fmt"
	"strings"
	"time"

	"xtask/backend/model"
	"xtask/backend/store"
)

type TaskService struct {
	registry *store.ProjectRegistry
}

type CreateTaskInput struct {
	Title       string             `json:"title"`
	Description string             `json:"description"`
	Priority    model.TaskPriority `json:"priority"`
	DueDate     string             `json:"due_date"`
	MilestoneID string             `json:"milestone_id"`
	Labels      []string           `json:"labels"`
	Notes       string             `json:"notes"`
}

type UpdateTaskInput struct {
	Title       *string             `json:"title"`
	Description *string             `json:"description"`
	Status      *model.TaskStatus   `json:"status"`
	Priority    *model.TaskPriority `json:"priority"`
	DueDate     *string             `json:"due_date"`
	MilestoneID *string             `json:"milestone_id"`
	Labels      *[]string           `json:"labels"`
	Notes       *string             `json:"notes"`
	UpdatedBy   string              `json:"updated_by"`
}

func NewTaskService(registry *store.ProjectRegistry) *TaskService {
	return &TaskService{registry: registry}
}

func (s *TaskService) List(projectID string, q TaskQuery) ([]model.Task, error) {
	graph, err := s.registry.GetProject(projectID)
	if err != nil {
		return nil, err
	}
	return FilterTasks(graph, q), nil
}

func (s *TaskService) Create(projectID string, in CreateTaskInput, actor string) (*model.Task, error) {
	if strings.TrimSpace(in.Title) == "" {
		return nil, fmt.Errorf("%w: title required", ErrInvalidInput)
	}
	if in.Priority == "" {
		in.Priority = model.TaskPriorityMedium
	}
	now := time.Now().UTC().Format(time.RFC3339)
	graph, err := s.registry.GetProject(projectID)
	if err != nil {
		return nil, err
	}

	task := model.Task{
		ID:          BuildID("task"),
		Title:       strings.TrimSpace(in.Title),
		Description: in.Description,
		Status:      model.TaskStatusTodo,
		Priority:    in.Priority,
		DueDate:     in.DueDate,
		MilestoneID: in.MilestoneID,
		Labels:      in.Labels,
		CreatedAt:   now,
		UpdatedAt:   now,
		UpdatedBy:   withDefaultActor(actor),
		Notes:       in.Notes,
	}

	graph.Tasks = append(graph.Tasks, task)
	graph.Project.UpdatedAt = now
	graph.Project.UpdatedBy = withDefaultActor(actor)
	s.appendHistory(graph, task.ID, "created", "", "created", actor)

	if err := s.registry.SaveProject(projectID, graph); err != nil {
		return nil, err
	}
	return &task, nil
}

func (s *TaskService) Update(projectID, taskID string, in UpdateTaskInput) (*model.Task, error) {
	graph, err := s.registry.GetProject(projectID)
	if err != nil {
		return nil, err
	}
	now := time.Now().UTC().Format(time.RFC3339)
	actor := withDefaultActor(in.UpdatedBy)

	idx := -1
	for i := range graph.Tasks {
		if graph.Tasks[i].ID == taskID {
			idx = i
			break
		}
	}
	if idx < 0 {
		return nil, ErrNotFound
	}

	task := graph.Tasks[idx]
	if in.Title != nil {
		if strings.TrimSpace(*in.Title) == "" {
			return nil, fmt.Errorf("%w: title required", ErrInvalidInput)
		}
		s.appendHistory(graph, task.ID, "title", task.Title, *in.Title, actor)
		task.Title = strings.TrimSpace(*in.Title)
	}
	if in.Description != nil {
		s.appendHistory(graph, task.ID, "description", task.Description, *in.Description, actor)
		task.Description = *in.Description
	}
	if in.Priority != nil {
		s.appendHistory(graph, task.ID, "priority", string(task.Priority), string(*in.Priority), actor)
		task.Priority = *in.Priority
	}
	if in.DueDate != nil {
		s.appendHistory(graph, task.ID, "due_date", task.DueDate, *in.DueDate, actor)
		task.DueDate = *in.DueDate
	}
	if in.MilestoneID != nil {
		s.appendHistory(graph, task.ID, "milestone_id", task.MilestoneID, *in.MilestoneID, actor)
		task.MilestoneID = *in.MilestoneID
	}
	if in.Labels != nil {
		s.appendHistory(graph, task.ID, "labels", strings.Join(task.Labels, ","), strings.Join(*in.Labels, ","), actor)
		task.Labels = *in.Labels
	}
	if in.Notes != nil {
		s.appendHistory(graph, task.ID, "notes", task.Notes, *in.Notes, actor)
		task.Notes = *in.Notes
	}
	if in.Status != nil && task.Status != *in.Status {
		if err := validateStatusTransition(graph, task.ID, task.Status, *in.Status); err != nil {
			return nil, err
		}
		s.appendHistory(graph, task.ID, "status", string(task.Status), string(*in.Status), actor)
		task.Status = *in.Status
	}

	task.UpdatedAt = now
	task.UpdatedBy = actor
	graph.Tasks[idx] = task
	graph.Project.UpdatedAt = now
	graph.Project.UpdatedBy = actor

	if err := s.registry.SaveProject(projectID, graph); err != nil {
		return nil, err
	}
	return &task, nil
}

func (s *TaskService) Delete(projectID, taskID, actor string) error {
	graph, err := s.registry.GetProject(projectID)
	if err != nil {
		return err
	}

	idx := -1
	for i := range graph.Tasks {
		if graph.Tasks[i].ID == taskID {
			idx = i
			break
		}
	}
	if idx < 0 {
		return ErrNotFound
	}

	graph.Tasks = append(graph.Tasks[:idx], graph.Tasks[idx+1:]...)
	filteredRelations := graph.Relations[:0]
	for _, rel := range graph.Relations {
		if rel.SourceID == taskID || rel.TargetID == taskID {
			continue
		}
		filteredRelations = append(filteredRelations, rel)
	}
	graph.Relations = filteredRelations
	s.appendHistory(graph, taskID, "deleted", "exists", "deleted", actor)

	now := time.Now().UTC().Format(time.RFC3339)
	graph.Project.UpdatedAt = now
	graph.Project.UpdatedBy = withDefaultActor(actor)

	return s.registry.SaveProject(projectID, graph)
}

func (s *TaskService) appendHistory(graph *model.TaskGraph, taskID, field, oldValue, newValue, actor string) {
	graph.History = append(graph.History, model.HistoryEntry{
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		TaskID:    taskID,
		Field:     field,
		OldValue:  oldValue,
		NewValue:  newValue,
		Actor:     withDefaultActor(actor),
	})
}

func validateStatusTransition(graph *model.TaskGraph, taskID string, oldStatus, next model.TaskStatus) error {
	if oldStatus == next {
		return nil
	}
	if next == model.TaskStatusDone {
		for _, rel := range graph.Relations {
			if rel.Type != model.RelationBlocks || rel.TargetID != taskID {
				continue
			}
			blocker := findTask(graph.Tasks, rel.SourceID)
			if blocker != nil && blocker.Status != model.TaskStatusDone {
				return ErrBlockedConstraint
			}
		}
	}
	return nil
}

func findTask(tasks []model.Task, id string) *model.Task {
	for _, t := range tasks {
		if t.ID == id {
			cp := t
			return &cp
		}
	}
	return nil
}
