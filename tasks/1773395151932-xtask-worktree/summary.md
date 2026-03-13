任务详情页的 Worktree 配置支持直接展示项目默认分支，并新增关联已有 Worktree 的入口。后端在创建 Worktree 时写入 source_branch 元数据，前端据此回显真实来源分支；同时补充项目接口 default_branch 返回值，并完成前端构建与后端模块导入校验。
