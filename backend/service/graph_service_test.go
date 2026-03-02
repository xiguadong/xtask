package service

import (
	"errors"
	"testing"

	"xtask/backend/model"
)

func TestGraphService_DetectsCycle(t *testing.T) {
	registry, projectID, _ := newTestRegistry(t)
	taskSvc := NewTaskService(registry)
	graphSvc := NewGraphService(registry)

	a, _ := taskSvc.Create(projectID, CreateTaskInput{Title: "a"}, "tester")
	b, _ := taskSvc.Create(projectID, CreateTaskInput{Title: "b"}, "tester")
	c, _ := taskSvc.Create(projectID, CreateTaskInput{Title: "c"}, "tester")

	_, _ = graphSvc.CreateRelation(projectID, CreateRelationInput{Type: model.RelationBlocks, SourceID: a.ID, TargetID: b.ID})
	_, _ = graphSvc.CreateRelation(projectID, CreateRelationInput{Type: model.RelationBlocks, SourceID: b.ID, TargetID: c.ID})

	_, err := graphSvc.CreateRelation(projectID, CreateRelationInput{Type: model.RelationBlocks, SourceID: c.ID, TargetID: a.ID})
	if !errors.Is(err, ErrCycleDetected) {
		t.Fatalf("expected cycle error, got: %v", err)
	}
}

func TestGraphService_EnforcesSingleParent(t *testing.T) {
	registry, projectID, _ := newTestRegistry(t)
	taskSvc := NewTaskService(registry)
	graphSvc := NewGraphService(registry)

	p1, _ := taskSvc.Create(projectID, CreateTaskInput{Title: "p1"}, "tester")
	p2, _ := taskSvc.Create(projectID, CreateTaskInput{Title: "p2"}, "tester")
	child, _ := taskSvc.Create(projectID, CreateTaskInput{Title: "child"}, "tester")

	if _, err := graphSvc.CreateRelation(projectID, CreateRelationInput{
		Type:     model.RelationParentChild,
		SourceID: p1.ID,
		TargetID: child.ID,
	}); err != nil {
		t.Fatalf("create parent relation: %v", err)
	}

	_, err := graphSvc.CreateRelation(projectID, CreateRelationInput{
		Type:     model.RelationParentChild,
		SourceID: p2.ID,
		TargetID: child.ID,
	})
	if !errors.Is(err, ErrDuplicateParent) {
		t.Fatalf("expected duplicate parent error, got: %v", err)
	}
}
