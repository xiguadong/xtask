package service

import (
	"fmt"
	"time"

	"xtask/backend/model"
	"xtask/backend/store"
)

type GraphService struct {
	registry *store.ProjectRegistry
}

type CreateRelationInput struct {
	Type     model.RelationType `json:"type"`
	SourceID string             `json:"source_id"`
	TargetID string             `json:"target_id"`
	Actor    string             `json:"actor"`
}

func NewGraphService(registry *store.ProjectRegistry) *GraphService {
	return &GraphService{registry: registry}
}

func (s *GraphService) CreateRelation(projectID string, in CreateRelationInput) (*model.Relation, error) {
	if in.SourceID == "" || in.TargetID == "" || in.Type == "" {
		return nil, fmt.Errorf("%w: missing relation fields", ErrInvalidInput)
	}
	if in.SourceID == in.TargetID {
		return nil, fmt.Errorf("%w: source and target cannot be equal", ErrInvalidInput)
	}

	graph, err := s.registry.GetProject(projectID)
	if err != nil {
		return nil, err
	}
	if findTask(graph.Tasks, in.SourceID) == nil || findTask(graph.Tasks, in.TargetID) == nil {
		return nil, ErrNotFound
	}

	if in.Type == model.RelationParentChild {
		for _, rel := range graph.Relations {
			if rel.Type == model.RelationParentChild && rel.TargetID == in.TargetID {
				return nil, ErrDuplicateParent
			}
		}
	}
	if in.Type == model.RelationBlocks {
		if wouldCreateBlocksCycle(graph.Relations, in.SourceID, in.TargetID) {
			return nil, ErrCycleDetected
		}
	}

	rel := model.Relation{
		ID:       BuildID("rel"),
		Type:     in.Type,
		SourceID: in.SourceID,
		TargetID: in.TargetID,
	}
	graph.Relations = append(graph.Relations, rel)

	now := time.Now().UTC().Format(time.RFC3339)
	graph.History = append(graph.History, model.HistoryEntry{
		Timestamp: now,
		TaskID:    in.TargetID,
		Field:     "relation",
		OldValue:  "",
		NewValue:  string(in.Type) + ":" + in.SourceID + "->" + in.TargetID,
		Actor:     withDefaultActor(in.Actor),
	})
	graph.Project.UpdatedAt = now
	graph.Project.UpdatedBy = withDefaultActor(in.Actor)

	if err := s.registry.SaveProject(projectID, graph); err != nil {
		return nil, err
	}
	return &rel, nil
}

func (s *GraphService) DeleteRelation(projectID, relationID, actor string) error {
	graph, err := s.registry.GetProject(projectID)
	if err != nil {
		return err
	}
	idx := -1
	var rel model.Relation
	for i := range graph.Relations {
		if graph.Relations[i].ID == relationID {
			idx = i
			rel = graph.Relations[i]
			break
		}
	}
	if idx < 0 {
		return ErrNotFound
	}
	graph.Relations = append(graph.Relations[:idx], graph.Relations[idx+1:]...)
	now := time.Now().UTC().Format(time.RFC3339)
	graph.History = append(graph.History, model.HistoryEntry{
		Timestamp: now,
		TaskID:    rel.TargetID,
		Field:     "relation",
		OldValue:  string(rel.Type) + ":" + rel.SourceID + "->" + rel.TargetID,
		NewValue:  "deleted",
		Actor:     withDefaultActor(actor),
	})
	graph.Project.UpdatedAt = now
	graph.Project.UpdatedBy = withDefaultActor(actor)
	return s.registry.SaveProject(projectID, graph)
}

func wouldCreateBlocksCycle(relations []model.Relation, sourceID, targetID string) bool {
	adj := map[string][]string{}
	for _, rel := range relations {
		if rel.Type != model.RelationBlocks {
			continue
		}
		adj[rel.SourceID] = append(adj[rel.SourceID], rel.TargetID)
	}
	adj[sourceID] = append(adj[sourceID], targetID)
	return hasPath(adj, targetID, sourceID, map[string]bool{})
}

func hasPath(adj map[string][]string, from, goal string, visiting map[string]bool) bool {
	if from == goal {
		return true
	}
	if visiting[from] {
		return false
	}
	visiting[from] = true
	for _, next := range adj[from] {
		if hasPath(adj, next, goal, visiting) {
			return true
		}
	}
	visiting[from] = false
	return false
}
