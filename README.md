# 个人记账应用 Monorepo

该仓库使用 npm workspaces 管理移动端应用（React Native / Expo）与后端服务（Node.js / Express）以及共享模块，便于统一维护类型定义、工具函数与代码风格。

## 项目结构

```
.
├── app/        # React Native App（Expo）
├── server/     # Node.js 后端服务
├── shared/     # 前后端共享的 TypeScript 代码
├── docs/       # 需求、设计与实施文档
├── package.json
├── tsconfig.base.json
└── .husky/     # Git 钩子（执行 npm install 后生成）
```

- `app/` 与 `server/` 将在后续迭代中逐步补充实际业务代码。
- `shared/` 用于存放 DTO、常量、工具函数等可复用模块。

## 快速开始

1. **安装依赖**

   ```bash
   npm install
   ```

   该命令会安装根目录的开发依赖，并在每个 workspace 中生成 `node_modules`。

2. **初始化 Husky（首次克隆仓库后执行一次）**

   ```bash
   npm run prepare
   ```

   完成后会生成 `.husky/` 目录，并自动启用 `pre-commit` 钩子。

3. **代码质量工具**

   - `npm run lint`：逐个 workspace 执行 ESLint。
   - `npm run test`：当前阶段各子项目暂未实现测试，命令会输出占位信息。
   - `npm run format`：使用 Prettier 统一格式化所有文件。

## 环境变量

参考 `.env.example` 文件，复制后命名为 `.env` 并填入实际的密钥或连接信息。后端服务将依赖这些配置连接数据库、缓存、AI 服务与对象存储。

## 下一步计划

- 搭建后端 Express 应用骨架、数据库 schema 与 Prisma 配置。
- 初始化 Expo 应用入口、路由与全局状态管理框架。
- 在 `shared/` 中沉淀通用类型定义与校验 Schema。

如需了解更详细的实施阶段，请查阅 `docs/implementation-plan.md`。
