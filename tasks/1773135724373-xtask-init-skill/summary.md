# 完成情况

- `xtask init` 新增项目内置 skill 安装流程，会自动同步 `xtask-safe` 与 `init-xtask` 到目标仓库 `.codex/skills/`
- 初始化命令改为幂等补齐：若 `refs/xtask-data` 已存在，仍会继续补齐缺失 skill，并避免当前仓库自拷贝
- 补充 `scripts/test-cli.sh` 安装校验，并更新 `README.md`、`PROGRESS.md`、`docs/task.md` 说明

# 验证

- 在临时 Git 仓库执行 `node cli/index.js init`，确认同时生成 `refs/xtask-data` 与两份内置 skill
- 使用当前分支 CLI 覆写 `PATH` 执行 `./scripts/test-cli.sh`，脚本全部通过
