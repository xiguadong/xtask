#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")/.."

PORT=${1:-3000}
mkdir -p logs
PID_FILE="logs/server.pid"
PORT_FILE="logs/server.port"

is_port_in_use() {
  local port="$1"
  lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1
}

# 查找可用端口（兼容 macOS/Linux）
while is_port_in_use "$PORT"; do
  echo "端口 $PORT 被占用，尝试 $((PORT+1))..."
  PORT=$((PORT+1))
done

echo "构建前端..."
./scripts/build.sh

echo "启动服务器 (端口 $PORT)..."
cd backend
PORT=$PORT node server.js > ../logs/server.log 2>&1 &
SERVER_PID=$!

sleep 1

if kill -0 "$SERVER_PID" >/dev/null 2>&1; then
  echo "$SERVER_PID" > "../$PID_FILE"
  echo "$PORT" > "../$PORT_FILE"
  echo "✓ 服务器启动成功"
  echo "✓ PID: $SERVER_PID"
  echo "✓ 访问地址: http://localhost:$PORT"
else
  echo "✗ 服务器启动失败"
  cat ../logs/server.log
  exit 1
fi
