# 个人记账应用实施计划

本文档将以中文梳理项目目录结构、开发阶段、核心功能清单以及待确认事项，帮助后续的前端（Web 应用）与后端（Node.js 服务）开发工作顺利推进。

## 一、代码仓库目录规划

```
/（仓库根目录）
├── web/                 # Web 应用：Next.js + React + TypeScript
│   ├── package.json
│   ├── next.config.js
│   ├── src/
│   │   ├── app/         # 页面路由（Next.js App Router）
│   │   ├── components/  # 复用组件、UI 资产
│   │   ├── features/    # 业务模块（记账、统计、预算等）
│   │   ├── hooks/       # 自定义 Hooks
│   │   ├── services/    # 与后端交互、AI 接口封装
│   │   └── utils/       # 工具方法、格式化函数
│   └── tests/           # Web 端单元测试 / 组件测试
├── app/                 # React Native 客户端骨架（暂缓开发）
│   ├── package.json
│   └── src/             # 保留原结构，待后续重启移动端时恢复
├── server/              # 后端服务：Node.js + Express + TypeScript
│   ├── package.json
│   ├── src/
│   │   ├── config/      # 配置文件、环境变量加载
│   │   ├── middlewares/ # 中间件（鉴权、限流、错误处理等）
│   │   ├── modules/     # 业务模块
│   │   │   ├── auth/            # 用户认证、权限
│   │   │   ├── accounts/        # 账户管理
│   │   │   ├── transactions/    # 收支记录
│   │   │   ├── budgets/         # 预算管理
│   │   │   ├── analytics/       # 统计分析
│   │   │   └── ai/              # AI 接口适配层
│   │   ├── prisma/      # 数据库访问（Prisma 客户端、仓储实现）
│   │   └── app.ts       # Express 入口文件
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   └── tests/           # 后端单元测试、集成测试
├── shared/              # 可共享的 TypeScript 类型、常量、工具
│   ├── package.json
│   └── src/
│       ├── dtos/        # 前后端共享的请求/响应 DTO
│       ├── constants/   # 枚举、业务常量
│       └── utils/       # 纯函数工具库
├── docs/
│   ├── implementation-plan.md
│   └── api-contract.md  # 后续补充 API 接口文档
├── package.json          # 工作空间（monorepo）总体配置
└── tsconfig.base.json    # TypeScript 基础配置（供各子项目继承）
```

> 说明：仓库将采用 monorepo 结构，方便共享类型定义和工具函数。优先选择 pnpm workspaces；若环境不支持，可切换为 npm workspaces。

## 二、开发阶段拆解

### 阶段 0：基础设施搭建

1. 初始化 monorepo，创建 `web/`、`server/`、`shared/` 三个子包（保留 `app/` 目录作为后续恢复移动端时的占位）。
2. 配置 TypeScript、ESLint、Prettier、EditorConfig 等统一代码风格工具。
3. 使用 Husky + lint-staged 配置 Git Hooks，确保提交前自动执行格式化与 lint。
4. 规划环境变量方案（`.env`, `.env.example`），区分开发、测试、生产环境。
5. 确定日志方案、错误上报基础框架。

### 阶段 1：后端核心能力

1. **用户与认证**
   - 注册、登录、注销接口；JWT 访问令牌 + 刷新令牌机制；密码加密存储；用户资料修改。
   - 编写鉴权中间件，保护需要登录的接口；实现基于角色/资源的权限校验基础能力。

2. **账户与交易**
   - 账户管理（银行卡、微信、支付宝、现金等），支持启用/停用。
   - 交易记录 CRUD，涵盖收入、支出、转账；支持分页、排序、筛选；维持账户余额实时更新。

3. **预算与提醒**
   - 支出类别预算设定、启用/停用；预算执行进度查询；当支出接近或超出预算时触发提醒（例如站内通知、推送预留接口）。

4. **统计分析**
   - 提供月度概览、收入来源统计、支出类别/支付方式统计、趋势分析等 API。
   - 支持周、月、季度、年度等时间范围切换；预留同比环比计算接口。

5. **AI 接入层**
   - 统一封装文本解析、图片 OCR、语音转写的调用接口；支持不同供应商的配置切换。
   - 设计异步任务/队列（如 BullMQ）处理耗时的识别任务，并记录置信度、原始数据和解析结果。

6. **数据导入导出与同步**
   - CSV/Excel 导入流程：字段映射、去重、验证反馈。
   - 数据导出：CSV、Excel、PDF；支持自定义时间区间和字段选择。
   - 数据备份与恢复接口；多设备同步策略（如基于时间戳的增量同步）。

### 阶段 2：Web 应用（Next.js + React）

1. **项目初始化**：使用 Next.js App Router + TypeScript，启用 ESLint/Prettier，配置 Tailwind CSS（或 Ant Design/Chakra UI）并接入绝对路径别名；确定 API 客户端（RTK Query/React Query）与全局状态管理（Redux Toolkit）。

2. **认证与访问控制**：实现登录、注册、忘记密码页；使用 NextAuth.js 或自定义凭证流，结合 HttpOnly Cookie 保存访问令牌并处理刷新逻辑；配置受保护路由和客户端鉴权守卫。

3. **应用框架与导航**：构建响应式布局（侧边栏 + 顶部栏），兼容桌面与移动浏览器；实现 Breadcrumb、全局通知、加载骨架、主题切换。

4. **PWA 能力**：配置 Web App Manifest、Service Worker 与 Workbox 缓存策略，实现基本离线可用、图标安装提示、版本更新提示；预留推送通知/后台同步的扩展点。

5. **首页概览仪表盘**：展示账户总览、预算执行、提醒消息及快捷入口（快速记账、AI 输入）；整合统计 API，使用 Recharts/ECharts/Nivo 绘制指标卡与图表。

6. **记账模块**：
   - 列表页：使用虚拟滚动（React Virtuoso/React Window），提供筛选、排序、区间查询与导出。
   - 详情抽屉：展示附件预览、AI 解析记录、复制与编辑操作。
   - 新增/编辑表单：金额、分类、账户、标签、多币种校验；支持 AI 解析后预填及草稿保存。

7. **账户与预算模块**：账户列表、余额调整、账户间转账流程；预算配置界面（进度条、阈值提示），联动统计模块展示预算执行情况。

8. **统计分析模块**：提供趋势、类别分布、收支对比、现金流预测等视图；支持时间范围和维度切换，并允许导出图表截图或原始数据。

9. **AI 能力入口**：
   - 上传票据/截图：调用后端 OCR 任务并实时显示解析进度。
   - 自然语言/语音输入：支持文本解析、语音转写后预填表单。
   - AI 助手侧边栏：允许用户查询历史交易、预算建议（后续扩展）。

10. **设置与数据管理**：用户偏好、导入导出、通知配置、多语言/主题切换、团队协作扩展接口等。

### 阶段 3：共享模块与测试体系

1. 将常用 DTO、校验 Schema、常量放入 `shared/`，通过 TypeScript 类型共享减少前后端对接成本。
2. 后端使用 Jest + Supertest 编写单元与集成测试；Web 端使用 Vitest/Jest + React Testing Library；关键流程可引入 Playwright 做端到端测试。
3. 构建 Mock Server 或使用 MSW（Mock Service Worker）模拟后端接口，方便前端并行开发。
4. 接入 Lighthouse/PWABuilder 等自动化审查，确保核心页面通过 PWA、性能与可访问性指标。

### 阶段 4：部署与运维

1. 编写 Dockerfile 和 docker-compose，支持本地一键启动数据库、缓存、后端服务。
2. 规划 CI/CD：GitHub Actions（或其他平台）执行 lint、测试、构建、发布。
3. Web 前端可部署至 Vercel/Netlify/Cloudflare Pages；部署时启用 HTTPS、PWA Manifest 版本管理与 Service Worker 缓存预热；后端部署可选择 Fly.io / Render / AWS / 阿里云等，并配置环境变量与 CDN。
4. 整合日志与监控（Sentry、Logtail、Prometheus 等），并规划告警机制。

## 三、交付物与优先级建议

1. **最小可用版本（MVP）重点**：
   - 用户认证、账户管理、基本记账（收入/支出）、列表查看与筛选。
   - 月度统计概览、预算设置与提醒。
   - 自然语言文本解析（优先实现文本 -> 结构化数据），图片/语音可在后续迭代。
   - 基础 PWA 能力（安装提示、离线首页、版本更新提示）。

2. **增强功能**：
   - 图片识别记账、语音输入、定期交易自动记账。
   - 导入导出、数据备份同步、多设备支持。
   - 复杂图表与趋势分析、同比环比指标。

3. **长期规划**：
   - Web 管理端、团队协作、多用户共享账本。
   - 高阶风控与智能推荐（例如消费分析、节省建议）。

## 四、待确认问题（麻烦您提供进一步指引）

1. **AI 服务供应商**：是否已有优先考虑的 OCR / 语音识别 / NLP 服务？（如百度智能云、阿里云、讯飞、OpenAI 等）
2. **部署环境**：目标部署平台是否确定？需要兼容国内云服务（阿里云、华为云）还是可以使用海外服务（AWS、GCP）？
3. **离线能力深度**：是否需要完全离线记账并在网络恢复后自动同步？若只需缓存数据，离线范围有哪些限制？
4. **多语言需求**：是否需要首发即支持中文/英文切换？是否需要简体与繁体？
5. **合规与安全**：除了常规加密与隐私保护，还有没有特定行业合规要求（如等保、金融相关监管）需要提前满足？

如有任何疑问或需要调整的部分，请告知，我会根据反馈继续优化计划并开始具体的代码实现。

## 五、基于原型图的技术架构与实现计划

结合 `complete-app.html` 所呈现的原型界面，我们将其适配为响应式 Web 应用，并在现有 monorepo 策略下明确前后端职责、数据模型与迭代节奏。

### 1. 整体架构

- **客户端**：Next.js + React + TypeScript，配合 Tailwind CSS（或 Chakra/Ant Design）完成响应式界面；启用 PWA（Web App Manifest、Service Worker、离线缓存与通知能力）；状态管理采用 Redux Toolkit + RTK Query（或 React Query），统一管理账户数据、预算、交易列表与 AI 解析结果。
- **后端**：Node.js + NestJS/Express + TypeScript，结合 Prisma 访问 PostgreSQL；通过 RESTful API 对接客户端，辅以 WebSocket（或 SSE）推送长耗时 AI 任务的解析结果。
- **AI 网关**：封装文本解析、语音转写、图像 OCR 的统一接口层，内部支持多厂商切换；异步任务交给 BullMQ + Redis 处理，确保上传票据或语音时的实时反馈与排队处理。
- **共享模块**：沿用 `shared/` 包提供 DTO、Zod 校验 Schema、业务常量（账户类型、分类枚举、预算周期等），并在客户端与后端复用。

### 2. 前端页面与组件拆解

| 原型区域 | Web 页面/组件 | 关键状态/接口 |
| --- | --- | --- |
| 首页仪表盘（头部概览、快速操作、AI 入口、最近交易） | `DashboardPage` + `QuickActionsPanel`, `MonthlySummaryCard`, `RecentTransactionsTable` | `GET /analytics/monthly-summary`, `GET /transactions?limit=3`；结合全局状态触发新增记账与 AI 入口 |
| 交易明细页（筛选标签、按日/类型分组列表） | `TransactionsPage` + `TransactionFilters`, `TransactionsVirtualList` | `GET /transactions`（分页、筛选）；`useInfiniteQuery` 维护虚拟滚动与懒加载 |
| 统计分析页（时间选择、卡片指标、趋势图、支出分析） | `AnalyticsPage` + `TimeRangeSelector`, `BalanceOverviewCard`, `TrendChart`, `CategoryBreakdown` | `GET /analytics/overview`, `GET /analytics/trend`, `GET /analytics/category`；使用 Recharts/Nivo 绘制图表 |
| 预算管理页（总览、预算卡片、进度条） | `BudgetsPage` + `BudgetSummaryCard`, `BudgetItemCard` | `GET /budgets`, `PATCH /budgets/:id`（启停、额度调整） |
| 个人中心页（用户信息、快捷功能菜单） | `ProfilePage` + `UserInfoHeader`, `SettingsList` | `GET /user/profile`, `GET /user/settings`；进入数据导入导出、通知设置等二级页面 |
| 添加记账弹窗 | `RecordDialog` | 本地表单状态；提交调用 `POST /transactions`，成功后触发乐观更新与全局通知 |
| AI 智能输入抽屉（语音、文本、解析结果预填） | `AiCaptureDrawer` | 上传音频/图片到 `POST /ai/jobs`，并通过 WebSocket/SSE 订阅解析结果；允许用户确认后回填 `RecordDialog` 表单 |
| 交易详情抽屉 | `TransactionDetailDrawer` | `GET /transactions/:id`，展示附件、AI 解析详情及快捷操作 |

以上组件需抽象常用 UI（按钮、卡片、标签、进度条、图表包装器）进入 `web/src/components/ui/`，保持视觉一致性并降低维护成本。

### 3. 后端模块落地

1. **鉴权与用户管理**：沿用 JWT + Refresh Token；支持第三方登录扩展（预留苹果/微信登录能力）。
2. **交易模块**：提供 CRUD、批量导入、附件上传（S3/OSS）；对接 AI 解析结果并维护置信度字段，支持撤销 AI 解析。
3. **账户模块**：账户余额随交易实时更新，提供余额调整历史；与预算模块联动以校验账户类型。
4. **预算模块**：支持月/季/年周期、阈值提醒，提供统计 API 配合前端展示百分比进度条。
5. **统计模块**：按时间区间聚合收入/支出、趋势与分类分析，返回与原型指标对应的字段（结余、收入、支出、Top 分类）。
6. **AI 模块**：封装 `TextParseService`, `VoiceTranscribeService`, `ImageOcrService`；对外只暴露统一 `POST /ai/jobs`，内部根据 `jobType` 分派任务并写入 `ai_jobs` 表，完成后通过消息队列推送结果。
7. **通知模块**：预算预警、AI 结果、同步提醒走统一 Notification Service，可后续接入短信/推送。

### 4. 数据模型（关键表）

- `users`：基本信息、偏好设置、AI 使用额度统计。
- `accounts`：账户类型、余额、是否计入统计。
- `categories`：收入/支出分类及层级。
- `transactions`：金额、类型、账户、分类、标签、时间、备注、附件引用。
- `transaction_ai_results`：原始输入、解析结果 JSON、置信度、状态（pending/success/failed）。
- `budgets`：分类、周期、目标金额、提醒阈值、当前使用额。
- `notifications`：用户消息记录。

### 5. 实现节奏（结合原型优先级）

1. **迭代 1 - 基础记账闭环**：完成鉴权、账户/分类基础数据、交易新增与列表、首页概览卡片。前端优先实现 `DashboardPage`、`TransactionsPage` 与 `RecordDialog`，后端提供对应 CRUD API。
2. **迭代 2 - 统计与预算**：扩展统计 API 与预算模块，前端交付 `AnalyticsPage`、`BudgetsPage`，完成图表组件初版。
3. **迭代 3 - AI 能力**：搭建 AI 网关、异步任务、WebSocket/SSE，前端补齐 `AiCaptureDrawer`、交易详情 AI 区块，并完成语音/图片上传流程。
4. **迭代 4 - 增强体验**：实现数据导入导出、通知设置、`ProfilePage` 等功能菜单；打磨动画、骨架屏、离线缓存等体验。
5. **迭代 5 - 质量与交付**：覆盖单元/集成测试、E2E 场景；完善监控报警、容灾策略，准备发布。

### 6. 风险与应对

- **AI 成本与性能**：为不同 AI 任务设置速率限制与额度统计，必要时引入本地轻量模型或批量处理。
- **Web 性能**：交易列表采用虚拟列表技术（React Window/Virtuoso），图表按需加载并懒加载依赖；上传文件前进行压缩与格式校验，开启代码拆分和缓存策略。
- **数据一致性**：交易与账户余额通过数据库事务保障；异步 AI 结果写回时使用乐观锁防止重复覆盖用户手动修改。
- **多终端同步**：后端提供基于 `updated_at` 的增量接口，Web 客户端通过 IndexedDB/localForage 做离线缓存，保证弱网体验。

该计划覆盖了原型中出现的主要交互场景，可作为后续需求评审与排期的基础。若原型后续有调整，请同步更新对应屏幕与 API 映射表。
