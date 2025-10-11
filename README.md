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

- `server/` 已包含基于 Express + SQLite 的后端服务，支持账户与交易管理。
- `app/` 将在后续迭代中逐步补充实际业务代码。
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

3. **常用脚本**
   - `npm run lint --workspace server`：对后端服务运行 ESLint。
   - `npm run typecheck --workspace server`：执行 TypeScript 全量类型检查。
   - `npm run test --workspace server`：使用 Vitest + Supertest 运行后端集成测试。
   - `npm run format`：使用 Prettier 统一格式化所有文件。

4. **启动后端开发服务器**

   ```bash
   npm run dev --workspace server
   ```

   默认使用本地 SQLite 数据库（`server/data/dev.db`），首次启动会自动初始化表结构。

## 环境变量

参考 `.env.example` 文件，复制后命名为 `.env` 并填入实际的密钥或连接信息。后端服务默认使用 SQLite 数据库，可通过 `DATABASE_URL`
指定数据库文件路径，或在生产环境切换到其他托管方案。

## 下一步计划

- 完成预算、统计分析、AI 解析等后端模块，补齐导入导出能力。
- 初始化 Web / App 前端界面，并对接已实现的 API。
- 在 `shared/` 中沉淀通用类型定义与校验 Schema，服务多端协同开发。

如需了解更详细的实施阶段，请查阅 `docs/implementation-plan.md`。
