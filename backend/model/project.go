package model

type ProjectListResponse struct {
	Projects []ProjectSummary `json:"projects"`
	Summary  SummaryStats     `json:"summary"`
}

type ProjectSummary struct {
	ID              string        `json:"id"`
	Name            string        `json:"name"`
	Status          ProjectHealth `json:"status"`
	ActiveMilestone string        `json:"active_milestone"`
	Progress        int           `json:"progress"`
	BlockedCount    int           `json:"blocked_count"`
	DueSoon         bool          `json:"due_soon"`
}

type SummaryStats struct {
	Total        int `json:"total"`
	DueThisWeek  int `json:"due_this_week"`
	BlockedTotal int `json:"blocked_total"`
}

type MilestoneProgress struct {
	Total   int `json:"total"`
	Done    int `json:"done"`
	Doing   int `json:"doing"`
	Blocked int `json:"blocked"`
	Todo    int `json:"todo"`
	Percent int `json:"percent"`
}

type MilestoneWithProgress struct {
	Milestone
	Progress MilestoneProgress `json:"progress"`
}
