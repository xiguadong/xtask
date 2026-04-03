---
name: xtask-summary
description: xtask 任务总结与状态更新。当任务完成时，生成总结并更新状态。
---

# xtask-summary

完成 xtask 任务后的总结与状态更新。

## 何时使用

任务完成时生成总结并更新状态为 `done`。

## 工作流程

### 1. 创建总结文件

```bash
cat > summary.md << 'EOF'
## 完成总结
- 目标：[任务目标]
- 完成：[完成内容]
- 验证：[验证方法]
EOF
```

### 2. 更新任务

```bash
xtask task update <task-id> --summary-file summary.md
xtask task update <task-id> --status done
```

## 示例

```bash
xtask task update T-001 --summary-file summary.md
xtask task update T-001 --status done
```
