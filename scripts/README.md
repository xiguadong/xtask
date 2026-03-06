# xtask Scripts

## Available Scripts

### Build
```bash
./scripts/build.sh
```
Builds the frontend for production.

### Start
```bash
./scripts/start.sh [port]
```
Builds frontend and starts the server. Default port: 3000

Example:
```bash
./scripts/start.sh 8080
```

### Start (tmux 持久会话)
```bash
./scripts/start-tmux.sh [port]
```
在 `tmux` 中启动 Web（`web` 窗口）并单独开一个 `logs` 窗口跟随 `logs/server.log`；同时会把 `tmux session-id` 写入全局 `~/.xtask/projects.yaml`，按 `project.path + 当前分支(task_key)` 记录。

```bash
# 启动（若端口冲突会自动递增）
./scripts/start-tmux.sh 3000

# 进入会话（默认按当前分支作为 task_key）
./scripts/attach-tmux.sh

# 指定 task_key/分支进入
./scripts/attach-tmux.sh 1772786308647-terminal
```

### Stop
```bash
./scripts/stop.sh
```
Scans current-user xtask-related ports/processes and stops them. Logs to `logs/stop.log`.

## Usage

```bash
# Start server on default port 3000
./scripts/start.sh

# Start server on custom port
./scripts/start.sh 8080

# Stop server
./scripts/stop.sh
```
