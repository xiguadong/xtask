package service

import (
	"sort"
	"strconv"

	"xtask/backend/model"
	"xtask/backend/store"
)

type HistoryService struct {
	registry *store.ProjectRegistry
}

func NewHistoryService(registry *store.ProjectRegistry) *HistoryService {
	return &HistoryService{registry: registry}
}

func (s *HistoryService) List(projectID, taskID string, limit, offset int) ([]model.HistoryEntry, error) {
	graph, err := s.registry.GetProject(projectID)
	if err != nil {
		return nil, err
	}
	entries := make([]model.HistoryEntry, 0, len(graph.History))
	for _, h := range graph.History {
		if taskID != "" && h.TaskID != taskID {
			continue
		}
		entries = append(entries, h)
	}
	sort.Slice(entries, func(i, j int) bool {
		return entries[i].Timestamp > entries[j].Timestamp
	})
	if offset >= len(entries) {
		return []model.HistoryEntry{}, nil
	}
	end := len(entries)
	if limit > 0 && offset+limit < end {
		end = offset + limit
	}
	return entries[offset:end], nil
}

func ParsePagination(limitRaw, offsetRaw string) (int, int) {
	limit := 50
	offset := 0
	if v, err := strconv.Atoi(limitRaw); err == nil && v > 0 {
		limit = v
	}
	if v, err := strconv.Atoi(offsetRaw); err == nil && v >= 0 {
		offset = v
	}
	return limit, offset
}
