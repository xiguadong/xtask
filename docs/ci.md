# CI / 测试说明

## 目标

保证每次变更至少通过以下三层校验：

1. 后端单元与集成测试
2. 前端构建与类型检查
3. E2E 关键路径回归（桌面 + 移动视口）

## 本地执行顺序

```bash
# 1) 后端 + 前端基础验证
make test

# 2) E2E 回归
make e2e-test
```

## 细分命令

```bash
# 后端测试
cd backend && GOPROXY=https://goproxy.cn,direct go test ./...

# 前端构建
cd frontend && npm run build

# E2E
cd e2e && npm test
```

## 覆盖范围

- backend/service: 规则测试（阻塞约束、循环检测、单父约束、筛选）
- backend/store: YAML 存储读写与引导
- backend/handler: API 集成测试（201/409/422）
- e2e/tests:
  - 首页结构检查
  - 首页进入项目页 + 新建任务
  - 看板/列表数据一致性
  - 阻塞约束与循环检测 API 行为

## 通过标准

- `make test` 必须全绿
- `make e2e-test` 必须全绿（当前为 8/8）
- 新增功能必须附带至少 1 条对应自动化测试
