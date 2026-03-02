package service

import (
	"testing"

	"xtask/backend/model"
)

func TestFilterTasks_ByFieldsAndBlocked(t *testing.T) {
	graph := &model.TaskGraph{
		Tasks: []model.Task{
			{ID: "t1", Title: "Fix login bug", Description: "auth module", Status: model.TaskStatusTodo, Priority: model.TaskPriorityHigh, DueDate: "2026-03-05", Labels: []string{"bug"}},
			{ID: "t2", Title: "Release prep", Description: "final docs", Status: model.TaskStatusDoing, Priority: model.TaskPriorityMedium, DueDate: "2026-03-10", Labels: []string{"release"}},
		},
		Relations: []model.Relation{
			{ID: "r1", Type: model.RelationBlocks, SourceID: "t1", TargetID: "t2"},
		},
	}

	res := FilterTasks(graph, TaskQuery{Status: "todo"})
	if len(res) != 1 || res[0].ID != "t1" {
		t.Fatalf("status filter mismatch: %#v", res)
	}

	res = FilterTasks(graph, TaskQuery{Priority: "medium", Q: "release"})
	if len(res) != 1 || res[0].ID != "t2" {
		t.Fatalf("priority+query filter mismatch: %#v", res)
	}

	flag := true
	res = FilterTasks(graph, TaskQuery{IsBlocked: &flag})
	if len(res) != 1 || res[0].ID != "t2" {
		t.Fatalf("is_blocked filter mismatch: %#v", res)
	}

	res = FilterTasks(graph, TaskQuery{DueBefore: "2026-03-06"})
	if len(res) != 1 || res[0].ID != "t1" {
		t.Fatalf("due_before filter mismatch: %#v", res)
	}
}
