# Repository Guidelines

## 项目结构与模块职责
- `app/`: Expo React Native 客户端, 入口 `src/index.tsx`, UI 参考 `complete-app.html`.
- `server/`: Express API, 源码在 `src/`, 编译输出 `dist/`, 共享类型来自 `shared/`.
- `shared/`: 可复用 DTO, 验证与工具, 遵循 `src/**` -> `dist/` 构建流程, 与前后端共享类型.
- `docs/`: 需求与设计文档, 提交新特性时同步更新, 重大决定附带设计说明.

## 构建、开发与测试命令
- `pnpm install`: 安装根及各 workspace 依赖, 并激活 husky 钩子.
- `pnpm lint`: 依次在所有包内运行 ESLint, 阻止存在错误的提交.
- `pnpm -r test`: 当前返回占位信息; 提交前请补齐对应包的测试.
- `pnpm --filter @codex-account-record/server dev`: 启动后端开发环境, 自动加载 `.env`.
- `pnpm --filter @codex-account-record/app start`: 启动 Expo 本地调试 (自动清缓存).
- `pnpm --filter ... typecheck`: 在目标 workspace 运行 TypeScript 全量类型检查.

## 编码规范与命名
- 统一使用 TypeScript, 遵循 `tsconfig.base.json` 配置, 禁用隐式 any.
- 缩进两空格; React 组件与类使用 PascalCase, 工具函数与文件名使用 camelCase/kebab-case.
- 提交前运行 `pnpm format` (Prettier) 和 `pnpm lint`, 保持零警告, 保留自动修复结果.
- 共享代码优先放入 `shared/src`, 避免重复实现; 跨端枚举与常量保持单一来源.

## 测试策略
- 新逻辑必须附带单元或集成测试; 客户端使用 `@testing-library/react-native`, 服务端使用 `supertest` + `vitest/jest` (按需选择).
- 测试文件放在与被测文件同级的 `__tests__` 目录, 命名为 `*.spec.ts`.
- 关键模块 (鉴权, 金额计算, 数据校验) 维持 100% 语句覆盖; 新增依赖需在 CI 中验证.
- 在调试阶段可运行 `pnpm --filter <pkg> test -- --watch`, 确保回归无遗漏.

## 提交与合并流程
- 遵循 Conventional Commits: `feat(server): ...`,`fix(app): ...` 等; 每次功能完成立即提交.
- PR 必须附带变更摘要, 测试结果, 截图或 cURL 示例, 并链接对应 issue.
- 破坏式改动需提供迁移方案, 确保 "Never break userspace"; 若需分步发布请说明守护策略.
- 调整公共接口或 API 时同步更新 `docs/`, 并在描述中列出受影响的调用方.

## 配置与安全
- 敏感配置仅放入 `.env`, 勿提交密钥; 维护 `.env.example` 注释字段含义, 保持字段同步.
- 默认启用 `helmet`,`cors`, 新增中间件前评估性能与兼容性; 变更鉴权逻辑时同步更新客户端调用.
- Husky `pre-commit` 会运行 lint-staged; 如需跳过请说明原因并单独记录.
