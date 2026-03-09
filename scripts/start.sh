#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

PORT=${1:-3000}
MAX_PORT_RETRIES=20
LOG_DIR="$ROOT_DIR/logs"
PID_FILE="$LOG_DIR/server.pid"
PORT_FILE="$LOG_DIR/server.port"
LOG_FILE="$LOG_DIR/server.log"
BACKEND_ENTRY="$ROOT_DIR/backend/server.js"

mkdir -p "$LOG_DIR"

is_port_in_use() {
  local port="$1"
  if command -v ss >/dev/null 2>&1; then
    if ss -ltn "( sport = :$port )" 2>/dev/null | tail -n +2 | grep -q .; then
      return 0
    fi
  fi

  if command -v lsof >/dev/null 2>&1; then
    if lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
      return 0
    fi
  fi

  return 1
}

# 查找可用端口（兼容 macOS/Linux）
while is_port_in_use "$PORT"; do
  echo "端口 $PORT 被占用，尝试 $((PORT+1))..."
  PORT=$((PORT+1))
done

echo "构建前端..."
./scripts/build.sh

launch_server() {
  cd "$ROOT_DIR/backend"
  nohup env PORT="$PORT" node "$BACKEND_ENTRY" < /dev/null >> "$LOG_FILE" 2>&1 &
  SERVER_PID=$!
  disown "$SERVER_PID" 2>/dev/null || true
  cd "$ROOT_DIR"
}

attempt=0
while [ "$attempt" -lt "$MAX_PORT_RETRIES" ]; do
  echo "启动服务器 (端口 $PORT)..."
  : > "$LOG_FILE"
  launch_server

  sleep 1

  if kill -0 "$SERVER_PID" >/dev/null 2>&1; then
    echo "$SERVER_PID" > "$PID_FILE"
    echo "$PORT" > "$PORT_FILE"
    echo "✓ 服务器启动成功"
    echo "✓ PID: $SERVER_PID"
    echo "✓ 访问地址: http://localhost:$PORT"
    echo "✓ 已脱离终端后台运行"
    exit 0
  fi

  if grep -q "EADDRINUSE" "$LOG_FILE" 2>/dev/null; then
    echo "端口 $PORT 启动时冲突，尝试 $((PORT+1))..."
    PORT=$((PORT+1))
    while is_port_in_use "$PORT"; do
      echo "端口 $PORT 被占用，尝试 $((PORT+1))..."
      PORT=$((PORT+1))
    done
    attempt=$((attempt+1))
    continue
  fi

  echo "✗ 服务器启动失败"
  cat "$LOG_FILE"
  exit 1
done

echo "✗ 服务器启动失败：连续 $MAX_PORT_RETRIES 次端口重试仍未成功"
cat "$LOG_FILE"
exit 1
