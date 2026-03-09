# 主分支检查结论

- 当前本地主分支 `master` 已支持 `summary_file` 字段。
- `cli/commands/task.js` 已识别并展示 `summary_file`。
- `backend/src/services/taskService.js` 与 `backend/src/services/branchTaskService.js` 已支持读取 `summary_content`。
- 为便于手工维护，本分支补充了 `xtask task update --summary`，可直接写入当前任务总结。
