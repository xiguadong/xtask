#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")/.."

PORT=${1:-3000}
mkdir -p logs

# 查找可用端口（使用 ss 命令更可靠）
while ss -tln 2>/dev/null | grep -q ":$PORT "; do
  echo "端口 $PORT 被占用，尝试 $((PORT+1))..."
  PORT=$((PORT+1))
done

echo "构建前端..."
./scripts/build.sh

echo "启动服务器 (端口 $PORT)..."
cd backend
PORT=$PORT node server.js > ../logs/server.log 2>&1 &
SERVER_PID=$!

sleep 2

if ps -p $SERVER_PID > /dev/null; then
  echo "✓ 服务器启动成功"
  echo "✓ PID: $SERVER_PID"
  echo "✓ 访问地址: http://localhost:$PORT"
else
  echo "✗ 服务器启动失败"
  cat ../logs/server.log
  exit 1
fi
