package service

import (
	"fmt"
	"strings"
	"time"

	"xtask/backend/model"
	"xtask/backend/store"
)

type MilestoneService struct {
	registry *store.ProjectRegistry
}

type CreateMilestoneInput struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	DueDate     string `json:"due_date"`
}

type UpdateMilestoneInput struct {
	Title       *string                `json:"title"`
	Description *string                `json:"description"`
	DueDate     *string                `json:"due_date"`
	Status      *model.MilestoneStatus `json:"status"`
	UpdatedBy   string                 `json:"updated_by"`
}

func NewMilestoneService(registry *store.ProjectRegistry) *MilestoneService {
	return &MilestoneService{registry: registry}
}

func (s *MilestoneService) List(projectID string) ([]model.MilestoneWithProgress, error) {
	graph, err := s.registry.GetProject(projectID)
	if err != nil {
		return nil, err
	}
	res := make([]model.MilestoneWithProgress, 0, len(graph.Milestones))
	for _, m := range graph.Milestones {
		progress := model.MilestoneProgress{}
		for _, t := range graph.Tasks {
			if t.MilestoneID != m.ID {
				continue
			}
			progress.Total++
			switch t.Status {
			case model.TaskStatusDone:
				progress.Done++
			case model.TaskStatusDoing:
				progress.Doing++
			case model.TaskStatusBlocked:
				progress.Blocked++
			default:
				progress.Todo++
			}
		}
		if progress.Total > 0 {
			progress.Percent = int(float64(progress.Done) / float64(progress.Total) * 100)
		}
		res = append(res, model.MilestoneWithProgress{Milestone: m, Progress: progress})
	}
	return res, nil
}

func (s *MilestoneService) Create(projectID string, in CreateMilestoneInput, actor string) (*model.Milestone, error) {
	if strings.TrimSpace(in.Title) == "" {
		return nil, fmt.Errorf("%w: title required", ErrInvalidInput)
	}
	graph, err := s.registry.GetProject(projectID)
	if err != nil {
		return nil, err
	}
	now := time.Now().UTC().Format(time.RFC3339)
	ms := model.Milestone{
		ID:          BuildID("ms"),
		Title:       strings.TrimSpace(in.Title),
		Description: in.Description,
		DueDate:     in.DueDate,
		Status:      model.MilestoneStatusOpen,
		CreatedAt:   now,
	}
	graph.Milestones = append(graph.Milestones, ms)
	graph.Project.UpdatedAt = now
	graph.Project.UpdatedBy = withDefaultActor(actor)
	if err := s.registry.SaveProject(projectID, graph); err != nil {
		return nil, err
	}
	return &ms, nil
}

func (s *MilestoneService) Update(projectID, msID string, in UpdateMilestoneInput) (*model.Milestone, error) {
	graph, err := s.registry.GetProject(projectID)
	if err != nil {
		return nil, err
	}
	idx := -1
	for i := range graph.Milestones {
		if graph.Milestones[i].ID == msID {
			idx = i
			break
		}
	}
	if idx < 0 {
		return nil, ErrNotFound
	}
	m := graph.Milestones[idx]
	if in.Title != nil {
		m.Title = strings.TrimSpace(*in.Title)
	}
	if in.Description != nil {
		m.Description = *in.Description
	}
	if in.DueDate != nil {
		m.DueDate = *in.DueDate
	}
	if in.Status != nil {
		m.Status = *in.Status
	}
	graph.Milestones[idx] = m
	graph.Project.UpdatedAt = time.Now().UTC().Format(time.RFC3339)
	graph.Project.UpdatedBy = withDefaultActor(in.UpdatedBy)
	if err := s.registry.SaveProject(projectID, graph); err != nil {
		return nil, err
	}
	return &m, nil
}
