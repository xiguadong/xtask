package service

import (
	"errors"
	"testing"

	"xtask/backend/model"
)

func TestTaskService_BlockedConstraint(t *testing.T) {
	registry, projectID, _ := newTestRegistry(t)
	taskSvc := NewTaskService(registry)
	graphSvc := NewGraphService(registry)

	blocker, err := taskSvc.Create(projectID, CreateTaskInput{Title: "blocker"}, "tester")
	if err != nil {
		t.Fatalf("create blocker: %v", err)
	}
	target, err := taskSvc.Create(projectID, CreateTaskInput{Title: "target"}, "tester")
	if err != nil {
		t.Fatalf("create target: %v", err)
	}

	if _, err := graphSvc.CreateRelation(projectID, CreateRelationInput{
		Type:     model.RelationBlocks,
		SourceID: blocker.ID,
		TargetID: target.ID,
		Actor:    "tester",
	}); err != nil {
		t.Fatalf("create blocks relation: %v", err)
	}

	done := model.TaskStatusDone
	if _, err := taskSvc.Update(projectID, target.ID, UpdateTaskInput{Status: &done, UpdatedBy: "tester"}); !errors.Is(err, ErrBlockedConstraint) {
		t.Fatalf("expected ErrBlockedConstraint, got: %v", err)
	}

	if _, err := taskSvc.Update(projectID, blocker.ID, UpdateTaskInput{Status: &done, UpdatedBy: "tester"}); err != nil {
		t.Fatalf("complete blocker: %v", err)
	}

	updated, err := taskSvc.Update(projectID, target.ID, UpdateTaskInput{Status: &done, UpdatedBy: "tester"})
	if err != nil {
		t.Fatalf("complete target after blocker done: %v", err)
	}
	if updated.Status != model.TaskStatusDone {
		t.Fatalf("expected status done, got: %s", updated.Status)
	}

	graph, err := registry.GetProject(projectID)
	if err != nil {
		t.Fatalf("get project: %v", err)
	}
	if len(graph.History) < 3 {
		t.Fatalf("expected history entries to be appended, got: %d", len(graph.History))
	}
}

func TestTaskService_DeleteRemovesLinkedRelations(t *testing.T) {
	registry, projectID, _ := newTestRegistry(t)
	taskSvc := NewTaskService(registry)
	graphSvc := NewGraphService(registry)

	a, _ := taskSvc.Create(projectID, CreateTaskInput{Title: "a"}, "tester")
	b, _ := taskSvc.Create(projectID, CreateTaskInput{Title: "b"}, "tester")

	if _, err := graphSvc.CreateRelation(projectID, CreateRelationInput{
		Type:     model.RelationRelatedWeak,
		SourceID: a.ID,
		TargetID: b.ID,
	}); err != nil {
		t.Fatalf("create relation: %v", err)
	}

	if err := taskSvc.Delete(projectID, a.ID, "tester"); err != nil {
		t.Fatalf("delete task: %v", err)
	}

	graph, err := registry.GetProject(projectID)
	if err != nil {
		t.Fatalf("get project: %v", err)
	}
	if len(graph.Relations) != 0 {
		t.Fatalf("expected relations removed with deleted task, got: %d", len(graph.Relations))
	}
}
