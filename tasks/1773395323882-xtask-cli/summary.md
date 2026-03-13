# 完成总结

- CLI 新增 `xtask task current`，可直接定位并回显当前分支绑定任务。
- CLI 新增 `xtask task update --summary-file <path>`，支持从现有 `summary.md` 读取内容并同步写入 `refs/xtask-data`。
- `scripts/test-cli.sh` 补充了 summary 文件同步、当前分支任务回显，以及优先执行仓库内 CLI 的校验，避免误跑全局旧版命令。
- 文档已同步更新 `README.md`、`PROGRESS.md` 和 `docs/task.md`。
- 已执行 `./scripts/test-cli.sh`，整套 CLI 验证通过。
