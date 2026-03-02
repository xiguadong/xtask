package model

type ProjectHealth string

type MilestoneStatus string

type TaskStatus string

type TaskPriority string

type RelationType string

const (
	ProjectHealthHealthy ProjectHealth = "healthy"
	ProjectHealthAtRisk  ProjectHealth = "at_risk"
	ProjectHealthBlocked ProjectHealth = "blocked"
)

const (
	MilestoneStatusOpen   MilestoneStatus = "open"
	MilestoneStatusClosed MilestoneStatus = "closed"
)

const (
	TaskStatusTodo    TaskStatus = "todo"
	TaskStatusDoing   TaskStatus = "doing"
	TaskStatusBlocked TaskStatus = "blocked"
	TaskStatusDone    TaskStatus = "done"
)

const (
	TaskPriorityCritical TaskPriority = "critical"
	TaskPriorityHigh     TaskPriority = "high"
	TaskPriorityMedium   TaskPriority = "medium"
	TaskPriorityLow      TaskPriority = "low"
)

const (
	RelationParentChild   RelationType = "parent_child"
	RelationBlocks        RelationType = "blocks"
	RelationRelatedStrong RelationType = "related_strong"
	RelationRelatedWeak   RelationType = "related_weak"
)
