---
name: xtask-summary
description: "xtask 任务完成归档。当用户提示任务已完成、需要生成 summary、需要归档总结时触发。运行 .claude/skills/xtask-summary/scripts/xtask-summary.sh 生成并归档 summary。"
---

# xtask-summary

通过脚本生成并归档任务完成总结。

## 何时使用

当用户提到以下任何操作时，使用此技能：
- 任务已完成，需要生成 summary
- 需要归档任务总结
- 需要标记任务为 done 并生成总结

## 工作流程

1. 确认用户是否同意将任务标记为 done
2. 运行脚本生成 summary：
   ```bash
   bash .claude/skills/xtask-summary/scripts/xtask-summary.sh <task-id>
   ```
3. 脚本会：
   - 生成任务完成总结
   - 归档 xtask_todos/ 文档到 xtask 数据分支
   - 清理本地临时文件

## 注意事项

- 归档前必须确认用户同意标记为 done
- 脚本本身不改变任务状态，需要用户或后续流程调用 `xtask task update` 更新状态
- 总结应包含实现内容、测试结果、遇到的问题
