package model

type TaskGraph struct {
	Version    int            `yaml:"version" json:"version"`
	Project    Project        `yaml:"project" json:"project"`
	Milestones []Milestone    `yaml:"milestones" json:"milestones"`
	Labels     []Label        `yaml:"labels" json:"labels"`
	Tasks      []Task         `yaml:"tasks" json:"tasks"`
	Relations  []Relation     `yaml:"relations" json:"relations"`
	History    []HistoryEntry `yaml:"history" json:"history"`
}

type Project struct {
	ID          string        `yaml:"id" json:"id"`
	Name        string        `yaml:"name" json:"name"`
	Description string        `yaml:"description" json:"description"`
	Status      ProjectHealth `yaml:"status" json:"status"`
	CreatedAt   string        `yaml:"created_at" json:"created_at"`
	UpdatedAt   string        `yaml:"updated_at" json:"updated_at"`
	UpdatedBy   string        `yaml:"updated_by" json:"updated_by"`
}

type Milestone struct {
	ID          string          `yaml:"id" json:"id"`
	Title       string          `yaml:"title" json:"title"`
	Description string          `yaml:"description" json:"description"`
	DueDate     string          `yaml:"due_date" json:"due_date"`
	Status      MilestoneStatus `yaml:"status" json:"status"`
	CreatedAt   string          `yaml:"created_at" json:"created_at"`
}

type Label struct {
	ID    string `yaml:"id" json:"id"`
	Name  string `yaml:"name" json:"name"`
	Color string `yaml:"color" json:"color"`
}

type Task struct {
	ID          string       `yaml:"id" json:"id"`
	Title       string       `yaml:"title" json:"title"`
	Description string       `yaml:"description" json:"description"`
	Status      TaskStatus   `yaml:"status" json:"status"`
	Priority    TaskPriority `yaml:"priority" json:"priority"`
	DueDate     string       `yaml:"due_date" json:"due_date"`
	MilestoneID string       `yaml:"milestone_id" json:"milestone_id"`
	Labels      []string     `yaml:"labels" json:"labels"`
	CreatedAt   string       `yaml:"created_at" json:"created_at"`
	UpdatedAt   string       `yaml:"updated_at" json:"updated_at"`
	UpdatedBy   string       `yaml:"updated_by" json:"updated_by"`
	Notes       string       `yaml:"notes" json:"notes"`
}

type Relation struct {
	ID       string       `yaml:"id" json:"id"`
	Type     RelationType `yaml:"type" json:"type"`
	SourceID string       `yaml:"source_id" json:"source_id"`
	TargetID string       `yaml:"target_id" json:"target_id"`
}

type HistoryEntry struct {
	Timestamp string `yaml:"timestamp" json:"timestamp"`
	TaskID    string `yaml:"task_id" json:"task_id"`
	Field     string `yaml:"field" json:"field"`
	OldValue  string `yaml:"old_value" json:"old_value"`
	NewValue  string `yaml:"new_value" json:"new_value"`
	Actor     string `yaml:"actor" json:"actor"`
}
