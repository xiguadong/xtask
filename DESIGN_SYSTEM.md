# xtask UI 设计系统

## 设计概览

基于 **Micro-interactions** 风格的项目管理界面，强调小动画、触觉反馈和流畅的用户体验。

## 配色方案

| 角色 | 颜色 | 用途 |
|------|------|------|
| Primary | `#0D9488` (青绿色) | 主要按钮、链接、活动状态 |
| Secondary | `#14B8A6` (浅青绿) | 次要按钮、成功状态 |
| CTA/Accent | `#F97316` (橙色) | 行动号召按钮、重要操作 |
| Background | `#F0FDFA` (浅青绿背景) | 页面背景 |
| Text | `#134E4A` (深青绿) | 主要文本 |

## 字体系统

- **标题字体**: Fira Code (等宽字体，适合技术类应用)
- **正文字体**: Fira Sans (无衬线字体，清晰易读)

## 核心设计原则

### 1. 微交互动画
- 所有交互元素使用 150-200ms 的过渡动画
- Hover 状态：轻微上移 (`-translate-y-0.5`) + 阴影增强
- 按钮点击：透明度变化 (`opacity-90`)

### 2. 阴影层级
- `--shadow-sm`: 细微提升效果
- `--shadow-md`: 卡片、按钮默认阴影
- `--shadow-lg`: Hover 状态阴影
- `--shadow-xl`: 模态框、弹出层

### 3. 圆角规范
- 小组件: `8px` (rounded-lg)
- 卡片: `12px` (rounded-xl)
- 模态框: `16px` (rounded-2xl)

### 4. 间距系统
- 页面边距: `px-6 py-8`
- 卡片间距: `gap-6`
- 组件内边距: `p-4` 或 `p-6`

## 组件样式

### 按钮

**主要按钮 (CTA)**
```tsx
className="px-6 py-3 bg-[var(--color-cta)] text-white rounded-lg font-semibold hover:opacity-90 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer shadow-[var(--shadow-md)]"
```

**次要按钮**
```tsx
className="px-6 py-3 bg-[var(--color-secondary)] text-white rounded-lg font-semibold hover:opacity-90 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer shadow-[var(--shadow-md)]"
```

**文本按钮**
```tsx
className="text-[var(--color-primary)] text-sm font-medium hover:underline cursor-pointer"
```

### 卡片

**项目卡片**
```tsx
className="block p-6 bg-white rounded-xl shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
```

**任务卡片**
```tsx
className="block p-4 bg-white rounded-lg border border-gray-100 hover:shadow-[var(--shadow-md)] transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
```

### 表单输入

```tsx
className="w-full p-3 border border-gray-200 rounded-lg focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all duration-200"
```

### 标签页

**活动状态**
```tsx
className="px-4 py-2 rounded-lg font-medium bg-[var(--color-primary)] text-white shadow-[var(--shadow-sm)] transition-all duration-200 cursor-pointer"
```

**非活动状态**
```tsx
className="px-4 py-2 rounded-lg font-medium bg-white text-gray-700 hover:bg-gray-50 transition-all duration-200 cursor-pointer"
```

## 状态颜色

### 任务状态
- `todo`: 灰色 (`bg-gray-100 text-gray-700`)
- `in_progress`: 主色调 (`bg-[var(--color-primary)]/10 text-[var(--color-primary)]`)
- `done`: 次要色 (`bg-[var(--color-secondary)]/20 text-[var(--color-secondary)]`)
- `blocked`: 红色 (`bg-red-100 text-red-700`)

### 优先级
- `low`: 灰色 (`text-gray-500`)
- `medium`: 黄色 (`text-yellow-600`)
- `high`: 橙色 (`text-[var(--color-cta)]`)
- `critical`: 红色 (`text-red-600`)

## 响应式断点

- 移动端: `< 768px`
- 平板: `768px - 1024px`
- 桌面: `> 1024px`

## 可访问性

- ✅ 所有可点击元素添加 `cursor-pointer`
- ✅ 焦点状态使用 `focus:ring-2` 提供视觉反馈
- ✅ 文本对比度 ≥ 4.5:1
- ✅ 所有交互元素支持键盘导航
- ✅ 使用语义化 HTML 标签

## 加载状态

```tsx
<div className="flex items-center justify-center py-20">
  <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--color-primary)] border-t-transparent"></div>
</div>
```

## 更新的组件

1. ✅ `ProjectCard.tsx` - 项目卡片
2. ✅ `ProjectListPage.tsx` - 项目列表页
3. ✅ `TaskCard.tsx` - 任务卡片
4. ✅ `ProjectDetailPage.tsx` - 项目详情页
5. ✅ `MilestoneList.tsx` - 里程碑列表
6. ✅ `index.css` - 全局样式和字体
7. ✅ `design-tokens.css` - CSS 变量

## 设计文件位置

- 主设计文档: `design-system/xtask/MASTER.md`
- CSS 变量: `frontend/src/styles/design-tokens.css`
