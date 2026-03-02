package service

import (
	"net/url"
	"strconv"
	"strings"
	"time"

	"xtask/backend/model"
)

type TaskQuery struct {
	Status    string
	Priority  string
	Milestone string
	Labels    []string
	DueBefore string
	DueAfter  string
	IsBlocked *bool
	Q         string
}

func TaskQueryFromValues(v url.Values) TaskQuery {
	query := TaskQuery{
		Status:    strings.TrimSpace(v.Get("status")),
		Priority:  strings.TrimSpace(v.Get("priority")),
		Milestone: strings.TrimSpace(v.Get("milestone")),
		DueBefore: strings.TrimSpace(v.Get("due_before")),
		DueAfter:  strings.TrimSpace(v.Get("due_after")),
		Q:         strings.TrimSpace(v.Get("q")),
	}
	if raw := strings.TrimSpace(v.Get("labels")); raw != "" {
		query.Labels = strings.Split(raw, ",")
	}
	if raw := strings.TrimSpace(v.Get("is_blocked")); raw != "" {
		if b, err := strconv.ParseBool(raw); err == nil {
			query.IsBlocked = &b
		}
	}
	return query
}

func FilterTasks(graph *model.TaskGraph, query TaskQuery) []model.Task {
	result := make([]model.Task, 0, len(graph.Tasks))
	lowerQ := strings.ToLower(query.Q)
	for _, t := range graph.Tasks {
		if query.Status != "" && string(t.Status) != query.Status {
			continue
		}
		if query.Priority != "" && string(t.Priority) != query.Priority {
			continue
		}
		if query.Milestone != "" && t.MilestoneID != query.Milestone {
			continue
		}
		if len(query.Labels) > 0 && !hasAllLabels(t.Labels, query.Labels) {
			continue
		}
		if query.DueBefore != "" && !matchesDateBefore(t.DueDate, query.DueBefore) {
			continue
		}
		if query.DueAfter != "" && !matchesDateAfter(t.DueDate, query.DueAfter) {
			continue
		}
		if query.IsBlocked != nil {
			blocked := isTaskBlockedByRelation(graph, t.ID)
			if blocked != *query.IsBlocked {
				continue
			}
		}
		if lowerQ != "" {
			text := strings.ToLower(t.Title + " " + t.Description)
			if !strings.Contains(text, lowerQ) {
				continue
			}
		}
		result = append(result, t)
	}
	return result
}

func hasAllLabels(taskLabels, queryLabels []string) bool {
	for _, q := range queryLabels {
		if q == "" {
			continue
		}
		if !contains(taskLabels, q) {
			return false
		}
	}
	return true
}

func contains(items []string, needle string) bool {
	for _, item := range items {
		if item == needle {
			return true
		}
	}
	return false
}

func matchesDateBefore(value, bound string) bool {
	d, err1 := time.Parse("2006-01-02", value)
	b, err2 := time.Parse("2006-01-02", bound)
	if err1 != nil || err2 != nil {
		return false
	}
	return d.Before(b) || d.Equal(b)
}

func matchesDateAfter(value, bound string) bool {
	d, err1 := time.Parse("2006-01-02", value)
	b, err2 := time.Parse("2006-01-02", bound)
	if err1 != nil || err2 != nil {
		return false
	}
	return d.After(b) || d.Equal(b)
}

func isTaskBlockedByRelation(graph *model.TaskGraph, taskID string) bool {
	for _, rel := range graph.Relations {
		if rel.Type != model.RelationBlocks || rel.TargetID != taskID {
			continue
		}
		source := findTask(graph.Tasks, rel.SourceID)
		if source != nil && source.Status != model.TaskStatusDone {
			return true
		}
	}
	return false
}
