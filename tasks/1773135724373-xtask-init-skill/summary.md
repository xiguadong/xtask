# 完成情况

- `xtask init` 现会自动同步安装 `xtask-safe` 与 `init-xtask` 到目标仓库 `.codex/skills/`
- 已支持重复执行 `xtask init` 时继续补齐缺失的项目内置 skill，并跳过当前仓库同路径自拷贝
- 已补充 `scripts/test-cli.sh` 安装校验，并更新 `README.md`、`PROGRESS.md`、`docs/task.md`

# 验证

- 在临时 Git 仓库执行 `node cli/index.js init`，确认同时写入 `refs/xtask-data` 与两份内置 skill
- 使用当前分支 CLI 覆写 `PATH` 执行 `./scripts/test-cli.sh`，脚本全部通过
