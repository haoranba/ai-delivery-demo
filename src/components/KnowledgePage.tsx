import React, { useState, useEffect } from 'react';
import { Briefcase, ClipboardList, Building2, Settings, Monitor, Palette, CheckCircle, BarChart2, Pin, Folder, FileText, Sparkles, Search, Brain, BookOpen } from 'lucide-react';
import { useTheme } from '../ThemeContext';
import type { ColorTokens } from '../ThemeContext';

// ─── Style injection ──────────────────────────────────────────────
const injectStyles = (C: ColorTokens) => {
  const existing = document.getElementById('knowledge-styles');
  if (existing) existing.remove();
  const style = document.createElement('style');
  style.id = 'knowledge-styles';
  style.textContent = `
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes slideIn {
      from { opacity: 0; transform: translateX(-12px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    .kn-tab:hover { color: ${C.text} !important; }
    .kn-btn:hover { opacity: 0.85; transform: translateY(-1px); }
    .kn-btn { transition: opacity 0.15s, transform 0.15s; }
    .kn-input:focus { outline: none; border-color: ${C.blue} !important; box-shadow: 0 0 0 3px ${C.blue}26 !important; }
    .kn-card:hover { background: ${C.border} !important; border-color: ${C.blue}60 !important; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.12); }
    .kn-card { transition: background 0.15s, border-color 0.15s, transform 0.2s, box-shadow 0.2s; }
    .kn-tree-item:hover { background: ${C.blue}14 !important; }
    .kn-tree-item { transition: background 0.12s; }
    .kn-pr-row:hover { background: ${C.border} !important; }
    .kn-pr-row { transition: background 0.12s; }
    .filter-chip:hover { border-color: ${C.blue} !important; color: ${C.text} !important; }
    .filter-chip { transition: border-color 0.15s, color 0.15s, background 0.15s; }
  `;
  document.head.appendChild(style);
};

// ─── Types ────────────────────────────────────────────────────────
type KnowledgeCategory = 'business' | 'engineering';

interface CommitItem {
  hash: string;
  message: string;
  author: string;
  avatar: string;
  date: string;
  additions: number;
  deletions: number;
  files: string[];
}

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  citations?: { file: string; snippet: string }[];
  suggestUpdate?: boolean;
  diffPreview?: { file: string; before: string; after: string };
  prCreated?: { id: number; title: string; branch: string };
  timestamp: string;
}

interface KnowledgeTypeConfig {
  key: string;
  label: string;
  category: KnowledgeCategory;
  color: string;
  icon: React.ReactElement;
  desc: string;
}

const KNOWLEDGE_TYPES: KnowledgeTypeConfig[] = [
  // 业务知识库
  { key: '业务知识', label: '业务知识', category: 'business', color: '#3b82f6', icon: <Briefcase size={16} />, desc: 'PD 维护 · 业务概念/规则/产品文档' },
  { key: '项目知识', label: '项目知识', category: 'business', color: '#06b6d4', icon: <ClipboardList size={16} />, desc: 'PM 维护 · 项目背景/人员/文档空间' },
  { key: '架构知识', label: '架构知识', category: 'business', color: '#8b5cf6', icon: <Building2 size={16} />, desc: '架构师维护 · 架构域/规范/稳定性/安全' },
  { key: '系统知识', label: '系统知识', category: 'business', color: '#10b981', icon: <Settings size={16} />, desc: '系统 Owner 维护 · 核心系统/API/代码模板' },
  // 工程通识库
  { key: '后端通识', label: '后端通识', category: 'engineering', color: '#f59e0b', icon: <Monitor size={16} />, desc: '后端技术栈/中间件' },
  { key: '前端通识', label: '前端通识', category: 'engineering', color: '#ec4899', icon: <Palette size={16} />, desc: '前端技术栈/组件库' },
  { key: '质量通识', label: '质量通识', category: 'engineering', color: '#10b981', icon: <CheckCircle size={16} />, desc: '质量规范/卡点/工具' },
  { key: '数据通识', label: '数据通识', category: 'engineering', color: '#06b6d4', icon: <BarChart2 size={16} />, desc: '数据规范/数据研发' },
  { key: '项管通识', label: '项管通识', category: 'engineering', color: '#8b5cf6', icon: <Pin size={16} />, desc: '项管流程/产研规范' },
];

type MemberRole = 'Owner' | 'Maintainer' | 'Contributor' | 'Viewer';

interface Member {
  name: string;
  avatar: string;
  role: MemberRole;
}

interface TreeNode {
  name: string;
  type: 'folder' | 'file';
  children?: TreeNode[];
  content?: string;
}

interface PRItem {
  id: number;
  title: string;
  author: string;
  avatar: string;
  status: 'open' | 'merged' | 'closed';
  updatedAt: string;
  branch: string;
  additions: number;
  deletions: number;
}

interface KnowledgeRepo {
  id: number;
  name: string;
  typeKey: string;
  desc: string;
  owner: string;
  ownerAvatar: string;
  memberCount: number;
  updatedAt: string;
  docCount: number;
  prCount: number;
  isMine: boolean;
  tree: TreeNode[];
  members: Member[];
  prs: PRItem[];
  commits: CommitItem[];
}

// ─── Mock Data ────────────────────────────────────────────────────
const MOCK_COMMITS_REPO1: CommitItem[] = [
  { hash: 'f3a9c12', message: '修正 Saga 模式回滚说明中的错误示例', author: 'wangfang', avatar: '👩‍🔬', date: '3天前', additions: 24, deletions: 18, files: ['architecture/transaction/saga-pattern.md'] },
  { hash: 'b7d2e45', message: '新增限流熔断配置规范文档', author: 'chenxiao', avatar: '🧑‍💻', date: '5天前', additions: 86, deletions: 0, files: ['architecture/stability/circuit-breaker.md'] },
  { hash: '91c4f78', message: '更新分布式事务规范，补充 TCC 模式最佳实践', author: 'liuyang', avatar: '👩‍💻', date: '1周前', additions: 128, deletions: 12, files: ['architecture/transaction/distributed-tx.md'] },
  { hash: '3e6a021', message: '补充 Code Review 必查项：禁止捕获 Exception 后只打日志', author: 'zhangwei', avatar: '👨‍💻', date: '2周前', additions: 8, deletions: 2, files: ['guidelines/code-review.md'] },
  { hash: 'c2b5d90', message: '初始化知识库结构，添加 README 和目录规范', author: 'zhangwei', avatar: '👨‍💻', date: '1个月前', additions: 210, deletions: 0, files: ['README.md', 'guidelines/naming-convention.md'] },
];

const MOCK_REPOS: KnowledgeRepo[] = [
  {
    id: 1, name: '交易核心架构知识库', typeKey: '架构知识',
    desc: '交易域核心架构规范、稳定性设计、安全合规要求',
    owner: 'zhangwei', ownerAvatar: '👨‍💻', memberCount: 12, updatedAt: '2分钟前',
    docCount: 47, prCount: 3, isMine: true, commits: MOCK_COMMITS_REPO1,
    members: [
      { name: 'zhangwei', avatar: '👨‍💻', role: 'Owner' },
      { name: 'liuyang', avatar: '👩‍💻', role: 'Maintainer' },
      { name: 'chenxiao', avatar: '🧑‍💻', role: 'Contributor' },
      { name: 'wangfang', avatar: '👩‍🔬', role: 'Contributor' },
      { name: 'zhaolei', avatar: '👨‍🔬', role: 'Viewer' },
    ],
    prs: [
      { id: 101, title: '更新分布式事务规范，补充 TCC 模式最佳实践', author: 'liuyang', avatar: '👩‍💻', status: 'open', updatedAt: '2小时前', branch: 'feat/tcc-best-practice', additions: 128, deletions: 12 },
      { id: 102, title: '新增限流熔断配置规范文档', author: 'chenxiao', avatar: '🧑‍💻', status: 'open', updatedAt: '1天前', branch: 'feat/rate-limit-spec', additions: 86, deletions: 0 },
      { id: 103, title: '修正 Saga 模式回滚说明中的错误示例', author: 'wangfang', avatar: '👩‍🔬', status: 'merged', updatedAt: '3天前', branch: 'fix/saga-rollback-example', additions: 24, deletions: 18 },
    ],
    tree: [
      {
        name: 'architecture', type: 'folder', children: [
          {
            name: 'transaction', type: 'folder', children: [
              { name: 'distributed-tx.md', type: 'file', content: `# 分布式事务规范\n\n## 适用场景\n\n跨服务、跨数据库的写操作，需要保证数据一致性时使用分布式事务。\n\n## 推荐方案\n\n### TCC 模式（强一致）\n\n适用于**资金类**操作，要求强一致性。\n\n\`\`\`java\n// Try 阶段：冻结资源\npublic boolean tryDeduct(String accountId, BigDecimal amount) {\n    return accountService.freeze(accountId, amount);\n}\n\n// Confirm 阶段：真正扣款\npublic boolean confirmDeduct(String accountId, BigDecimal amount) {\n    return accountService.deductFrozen(accountId, amount);\n}\n\n// Cancel 阶段：解冻资源\npublic boolean cancelDeduct(String accountId, BigDecimal amount) {\n    return accountService.unfreeze(accountId, amount);\n}\n\`\`\`\n\n### Saga 模式（最终一致）\n\n适用于**业务流程**类操作，允许最终一致。\n\n## 禁止事项\n\n❌ 禁止在分布式事务中嵌套远程调用\n❌ 禁止在 Try 阶段做不可逆操作\n❌ 超时时间不得超过 3000ms` },
              { name: 'saga-pattern.md', type: 'file', content: `# Saga 模式指南\n\n## 概述\n\nSaga 是一种长事务解决方案，将长事务拆分为多个本地事务序列。\n\n## 回滚策略\n\n每个本地事务必须有对应的**补偿操作**。\n\n| 正向操作 | 补偿操作 |\n|---------|--------|\n| 创建订单 | 取消订单 |\n| 扣减库存 | 恢复库存 |\n| 扣款 | 退款 |` },
            ]
          },
          {
            name: 'stability', type: 'folder', children: [
              { name: 'circuit-breaker.md', type: 'file', content: `# 熔断降级规范\n\n## Sentinel 配置规范\n\n所有核心链路必须接入 Sentinel，配置熔断规则。\n\n### 熔断策略\n\n- **慢调用比例**：RT > 200ms 且比例 > 50%，熔断 10s\n- **异常比例**：异常比例 > 20%，熔断 10s\n- **异常数**：1分钟内异常数 > 10，熔断 10s\n\n## 降级兜底\n\n核心接口必须提供降级兜底逻辑，不能直接返回错误。` },
            ]
          },
        ]
      },
      {
        name: 'guidelines', type: 'folder', children: [
          { name: 'code-review.md', type: 'file', content: `# Code Review 规范\n\n## 必查项\n\n- [ ] 禁止循环内 DB/RPC 调用\n- [ ] 所有写接口必须幂等\n- [ ] 禁止捕获 Exception 后只打日志\n- [ ] 禁止硬编码配置项\n- [ ] 核心链路必须有监控告警\n\n## 推荐实践\n\n- 单个 PR 变更行数不超过 500 行\n- 复杂逻辑必须有单测覆盖（覆盖率 > 80%）` },
          { name: 'naming-convention.md', type: 'file', content: `# 命名规范\n\n## 包名\n\n全小写，按业务域分层：\n\`com.example.{domain}.{layer}\`\n\n## 类名\n\n- Service 实现类：\`XxxServiceImpl\`\n- DTO：\`XxxDTO\`\n- 领域对象：\`Xxx\`（无后缀）\n\n## 接口方法\n\n- 查询：\`getXxx\` / \`listXxx\` / \`queryXxx\`\n- 写操作：\`createXxx\` / \`updateXxx\` / \`deleteXxx\`` },
        ]
      },
      { name: 'README.md', type: 'file', content: `# 交易核心架构知识库\n\n> 本知识库由架构团队维护，记录交易域核心架构规范。\n\n## 目录结构\n\n\`\`\`\narchitecture/\n  transaction/   # 分布式事务规范\n  stability/     # 稳定性设计\nguidelines/      # 开发规范\nREADME.md\n\`\`\`\n\n## 贡献指南\n\n1. Fork 本仓库\n2. 创建 feature 分支\n3. 提交 PR，等待 Maintainer 审核\n4. 合并后自动同步到 AI 知识库` },
    ],
  },
  {
    id: 2, name: '用户中心系统知识库', typeKey: '系统知识',
    desc: '用户中心核心系统文档、API 规范、代码模板',
    owner: 'liuyang', ownerAvatar: '👩‍💻', memberCount: 8, updatedAt: '1小时前',
    docCount: 32, prCount: 1, isMine: true,
    commits: [
      { hash: 'd4e7f23', message: '新增用户画像 API 接口文档草稿', author: 'sunming', avatar: '👨‍🎨', date: '5小时前', additions: 95, deletions: 0, files: ['api/user-profile.md'] },
      { hash: 'a8c1b56', message: '更新用户认证 API：补充 Token 刷新机制说明', author: 'liuyang', avatar: '👩‍💻', date: '3天前', additions: 32, deletions: 8, files: ['api/user-auth.md'] },
      { hash: '7f2d390', message: '初始化用户中心系统知识库', author: 'liuyang', avatar: '👩‍💻', date: '2周前', additions: 180, deletions: 0, files: ['README.md', 'api/user-auth.md'] },
    ],
    members: [
      { name: 'liuyang', avatar: '👩‍💻', role: 'Owner' },
      { name: 'sunming', avatar: '👨‍🎨', role: 'Maintainer' },
      { name: 'houjie', avatar: '🧑‍🔧', role: 'Contributor' },
    ],
    prs: [
      { id: 201, title: '新增用户画像 API 接口文档', author: 'sunming', avatar: '👨‍🎨', status: 'open', updatedAt: '5小时前', branch: 'feat/user-profile-api', additions: 210, deletions: 5 },
    ],
    tree: [
      {
        name: 'api', type: 'folder', children: [
          { name: 'user-auth.md', type: 'file', content: `# 用户认证 API\n\n## 接口列表\n\n### POST /api/v2/auth/login\n\n用户登录接口。\n\n**请求体**\n\`\`\`json\n{\n  "username": "string",\n  "password": "string (encrypted)",\n  "deviceId": "string"\n}\n\`\`\`\n\n**响应**\n\`\`\`json\n{\n  "token": "string",\n  "expiresIn": 7200,\n  "userId": "string"\n}\n\`\`\`\n\n## 安全规范\n\n- 密码必须客户端加密后传输（AES-256）\n- Token 有效期 2 小时，刷新 Token 7 天\n- 连续失败 5 次锁定账号 30 分钟` },
          { name: 'user-profile.md', type: 'file', content: `# 用户画像 API\n\n## 接口列表\n\n### GET /api/v2/user/profile/{userId}\n\n获取用户基础画像。\n\n**响应**\n\`\`\`json\n{\n  "userId": "string",\n  "nickname": "string",\n  "level": "number",\n  "tags": ["string"],\n  "riskLevel": "LOW|MEDIUM|HIGH"\n}\n\`\`\`\n\n> ⚠️ 风险等级字段仅限内部系统调用，需申请白名单权限。` },
        ]
      },
      { name: 'README.md', type: 'file', content: `# 用户中心系统知识库\n\n> 用户中心是平台核心基础服务，承载用户注册、认证、画像等核心能力。\n\n## 核心模块\n\n- **认证模块**：登录/注册/Token 管理\n- **画像模块**：用户标签/风险等级\n- **权限模块**：RBAC 权限控制\n\n## SLA 要求\n\n- P99 < 100ms\n- 可用性 > 99.99%` },
    ],
  },
  {
    id: 3, name: '前端组件库通识', typeKey: '前端通识',
    desc: '前端技术栈规范、组件库使用指南、性能优化实践',
    owner: 'wangfang', ownerAvatar: '👩‍🔬', memberCount: 15, updatedAt: '3小时前',
    docCount: 58, prCount: 5, isMine: false,
    commits: [
      { hash: 'e1f4a89', message: '新增 React 18 并发特性最佳实践文档', author: 'wangfang', avatar: '👩‍🔬', date: '1天前', additions: 156, deletions: 8, files: ['components/react18.md'] },
      { hash: 'b3c6d12', message: '更新 Tailwind CSS 配置规范', author: 'zhaolei', avatar: '👨‍🔬', date: '2天前', additions: 42, deletions: 31, files: ['components/design-tokens.md'] },
    ],
    members: [
      { name: 'wangfang', avatar: '👩‍🔬', role: 'Owner' },
      { name: 'zhangwei', avatar: '👨‍💻', role: 'Viewer' },
    ],
    prs: [
      { id: 301, title: '新增 React 18 并发特性最佳实践', author: 'wangfang', avatar: '👩‍🔬', status: 'open', updatedAt: '1天前', branch: 'feat/react18-concurrent', additions: 156, deletions: 8 },
      { id: 302, title: '更新 Tailwind CSS 配置规范', author: 'zhaolei', avatar: '👨‍🔬', status: 'merged', updatedAt: '2天前', branch: 'fix/tailwind-config', additions: 42, deletions: 31 },
    ],
    tree: [
      {
        name: 'components', type: 'folder', children: [
          { name: 'design-tokens.md', type: 'file', content: `# Design Tokens 规范\n\n## 颜色体系\n\n所有颜色必须使用 Token，禁止硬编码颜色值。\n\n\`\`\`css\n/* 主色 */\n--color-primary: #3b82f6;\n--color-primary-hover: #2563eb;\n\n/* 语义色 */\n--color-success: #10b981;\n--color-warning: #f59e0b;\n--color-danger: #ef4444;\n\`\`\`\n\n## 间距体系\n\n使用 4px 基准网格：4/8/12/16/24/32/48/64px` },
        ]
      },
      { name: 'README.md', type: 'file', content: `# 前端组件库通识\n\n技术栈：React 18 + TypeScript + Tailwind CSS + shadcn/ui\n\n## 规范文档\n\n- Design Tokens\n- 组件使用指南\n- 性能优化实践\n- 无障碍规范` },
    ],
  },
  {
    id: 4, name: '质量工程通识库', typeKey: '质量通识',
    desc: '测试规范、质量卡点、自动化工具使用指南',
    owner: 'chenxiao', ownerAvatar: '🧑‍💻', memberCount: 20, updatedAt: '昨天',
    docCount: 73, prCount: 2, isMine: false,
    members: [
      { name: 'chenxiao', avatar: '🧑‍💻', role: 'Owner' },
    ],
    prs: [],
    commits: [
      { hash: 'c9d3e67', message: '补充混沌工程实验规范', author: 'chenxiao', avatar: '🧑‍💻', date: '昨天', additions: 64, deletions: 5, files: ['chaos/experiment-spec.md'] },
    ],
    tree: [
      { name: 'README.md', type: 'file', content: `# 质量工程通识库\n\n覆盖单测、集成测试、性能测试、混沌工程全链路质量规范。` },
    ],
  },
  {
    id: 5, name: '支付业务知识库', typeKey: '业务知识',
    desc: '支付核心业务规则、领域模型、产品文档',
    owner: 'zhaolei', ownerAvatar: '👨‍🔬', memberCount: 9, updatedAt: '2天前',
    docCount: 91, prCount: 0, isMine: false,
    members: [
      { name: 'zhaolei', avatar: '👨‍🔬', role: 'Owner' },
      { name: 'zhangwei', avatar: '👨‍💻', role: 'Contributor' },
    ],
    prs: [],
    commits: [
      { hash: 'f0a2b34', message: '更新支付领域模型：新增退款状态机说明', author: 'zhaolei', avatar: '👨‍🔬', date: '2天前', additions: 48, deletions: 12, files: ['domain/refund-state.md'] },
    ],
    tree: [
      { name: 'README.md', type: 'file', content: `# 支付业务知识库\n\n记录支付核心业务领域模型、规则和产品文档。` },
    ],
  },
  {
    id: 6, name: '风控项目知识库', typeKey: '项目知识',
    desc: '2026 年风控升级项目背景、人员、文档空间',
    owner: 'sunming', ownerAvatar: '👨‍🎨', memberCount: 6, updatedAt: '3天前',
    docCount: 24, prCount: 1, isMine: true,
    members: [
      { name: 'sunming', avatar: '👨‍🎨', role: 'Owner' },
      { name: 'liuyang', avatar: '👩‍💻', role: 'Maintainer' },
      { name: 'zhangwei', avatar: '👨‍💻', role: 'Viewer' },
    ],
    prs: [
      { id: 601, title: '补充 Q1 里程碑节点和 Owner 信息', author: 'liuyang', avatar: '👩‍💻', status: 'open', updatedAt: '3天前', branch: 'feat/q1-milestone', additions: 45, deletions: 3 },
    ],
    commits: [
      { hash: '2e5f891', message: '补充 Q1 里程碑节点和 Owner 信息', author: 'liuyang', avatar: '👩‍💻', date: '3天前', additions: 45, deletions: 3, files: ['milestones/q1.md'] },
      { hash: '8b3c456', message: '初始化风控升级项目知识库', author: 'sunming', avatar: '👨‍🎨', date: '1周前', additions: 120, deletions: 0, files: ['README.md', 'team.md'] },
    ],
    tree: [
      { name: 'README.md', type: 'file', content: `# 风控升级项目知识库\n\n2026 年风控能力升级项目，目标：实时风控延迟 < 50ms，覆盖率提升至 99.5%。` },
    ],
  },
  {
    id: 7, name: '后端中间件通识库', typeKey: '后端通识',
    desc: '后端技术栈规范、中间件接入指南、踩坑记录',
    owner: 'houjie', ownerAvatar: '🧑‍🔧', memberCount: 30, updatedAt: '5天前',
    docCount: 112, prCount: 4, isMine: false,
    members: [
      { name: 'houjie', avatar: '🧑‍🔧', role: 'Owner' },
    ],
    prs: [],
    tree: [
      { name: 'README.md', type: 'file', content: `# 后端中间件通识库\n\n涵盖 Spring Boot、RPC、消息队列、分布式缓存等中间件接入规范。` },
    ],
    commits: [
      { hash: 'a1b2c3d', message: '初始化后端中间件通识库', author: 'houjie', avatar: '🧑‍🔧', date: '5天前', additions: 320, deletions: 0, files: ['README.md', 'middleware/rpc.md', 'middleware/mq.md'] },
    ],
  },
];

// ─── Helper ───────────────────────────────────────────────────────
const getTypeConfig = (key: string): KnowledgeTypeConfig =>
  KNOWLEDGE_TYPES.find((t) => t.key === key) ?? KNOWLEDGE_TYPES[0];

const TypeTag: React.FC<{ typeKey: string; size?: 'sm' | 'md' }> = ({ typeKey, size = 'sm' }) => {
  const cfg = getTypeConfig(typeKey);
  return (
    <span style={{
      fontSize: size === 'sm' ? 11 : 12,
      color: cfg.color,
      background: `${cfg.color}15`,
      borderRadius: 4,
      padding: size === 'sm' ? '2px 7px' : '3px 9px',
      fontWeight: 600,
      whiteSpace: 'nowrap',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
    }}>
      {cfg.icon}<span>{cfg.label}</span>
    </span>
  );
};

const RoleBadge: React.FC<{ role: MemberRole }> = ({ role }) => {
  const C = useTheme();
  const map: Record<MemberRole, { color: string; bg: string }> = {
    Owner:       { color: C.orange, bg: 'rgba(245,158,11,0.12)' },
    Maintainer:  { color: C.purple, bg: 'rgba(139,92,246,0.12)' },
    Contributor: { color: C.blue,   bg: 'rgba(59,130,246,0.12)' },
    Viewer:      { color: C.muted,  bg: 'rgba(148,163,184,0.1)' },
  };
  const { color, bg } = map[role];
  return (
    <span style={{ fontSize: 11, color, background: bg, borderRadius: 4, padding: '2px 8px', fontWeight: 600 }}>
      {role}
    </span>
  );
};

const PRStatusBadge: React.FC<{ status: PRItem['status'] }> = ({ status }) => {
  const C = useTheme();
  const map = {
    open:   { label: 'Open',   color: C.green,  bg: 'rgba(16,185,129,0.12)', icon: '●' },
    merged: { label: 'Merged', color: C.purple, bg: 'rgba(139,92,246,0.12)', icon: '⬡' },
    closed: { label: 'Closed', color: C.red,    bg: 'rgba(239,68,68,0.12)',  icon: '○' },
  };
  const { label, color, bg, icon } = map[status];
  return (
    <span style={{ fontSize: 11, color, background: bg, borderRadius: 4, padding: '2px 8px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {icon} {label}
    </span>
  );
};

// ─── Tree Component ───────────────────────────────────────────────
const TreeItem: React.FC<{
  node: TreeNode;
  depth: number;
  selectedFile: string | null;
  onSelect: (name: string, content: string) => void;
}> = ({ node, depth, selectedFile, onSelect }) => {
  const C = useTheme();
  const blueLight = C.blue;
  const [open, setOpen] = useState(depth === 0);
  const isSelected = node.type === 'file' && selectedFile === node.name;

  if (node.type === 'folder') {
    return (
      <div>
        <div
          className="kn-tree-item"
          onClick={() => setOpen(!open)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: `5px 8px 5px ${8 + depth * 16}px`,
            cursor: 'pointer', borderRadius: 6,
            color: C.muted, fontSize: 13,
          }}
        >
          <span style={{ fontSize: 11, transition: 'transform 0.15s', transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
          <Folder size={13} />
          <span style={{ fontWeight: 500 }}>{node.name}</span>
        </div>
        {open && node.children?.map((child, i) => (
          <TreeItem key={i} node={child} depth={depth + 1} selectedFile={selectedFile} onSelect={onSelect} />
        ))}
      </div>
    );
  }

  return (
    <div
      className="kn-tree-item"
      onClick={() => node.content && onSelect(node.name, node.content)}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: `5px 8px 5px ${8 + depth * 16}px`,
        cursor: 'pointer', borderRadius: 6,
        background: isSelected ? 'rgba(59,130,246,0.12)' : 'transparent',
        color: isSelected ? blueLight : C.muted,
        fontSize: 13,
        borderLeft: isSelected ? `2px solid ${C.blue}` : '2px solid transparent',
      }}
    >
      <FileText size={13} />
      <span style={{ fontWeight: isSelected ? 600 : 400 }}>{node.name}</span>
    </div>
  );
};

// ─── Markdown Renderer (simple) ───────────────────────────────────
const MarkdownView: React.FC<{ content: string }> = ({ content }) => {
  const C = useTheme();
  const blueLight = C.blue;
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    // Code block
    if (line.startsWith('```')) {
      const lang = line.slice(3);
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <pre key={i} style={{
          background: C.sidebarBg, border: `1px solid ${C.border}`, borderRadius: 8,
          padding: '14px 16px', fontSize: 12, color: C.text, overflowX: 'auto',
          margin: '12px 0', lineHeight: 1.6, fontFamily: 'monospace',
        }}>
          {lang && <div style={{ color: C.muted, fontSize: 10, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{lang}</div>}
          {codeLines.join('\n')}
        </pre>
      );
      i++;
      continue;
    }
    // H1
    if (line.startsWith('# ')) {
      elements.push(<h1 key={i} style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: '0 0 16px', borderBottom: `1px solid ${C.border}`, paddingBottom: 12 }}>{line.slice(2)}</h1>);
    }
    // H2
    else if (line.startsWith('## ')) {
      elements.push(<h2 key={i} style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: '24px 0 10px' }}>{line.slice(3)}</h2>);
    }
    // H3
    else if (line.startsWith('### ')) {
      elements.push(<h3 key={i} style={{ fontSize: 14, fontWeight: 700, color: blueLight, margin: '16px 0 8px' }}>{line.slice(4)}</h3>);
    }
    // Table
    else if (line.startsWith('|')) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].startsWith('|')) {
        if (!lines[i].match(/^\|[\s\-|]+\|$/)) {
          rows.push(lines[i].split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1).map(s => s.trim()));
        }
        i++;
      }
      elements.push(
        <table key={i} style={{ width: '100%', borderCollapse: 'collapse', margin: '12px 0', fontSize: 13 }}>
          <thead>
            <tr>{rows[0]?.map((cell, ci) => <th key={ci} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: `1px solid ${C.border}`, color: C.muted, fontWeight: 600, fontSize: 12 }}>{cell}</th>)}</tr>
          </thead>
          <tbody>
            {rows.slice(1).map((row, ri) => (
              <tr key={ri}>{row.map((cell, ci) => <td key={ci} style={{ padding: '8px 12px', borderBottom: `1px solid ${C.border}20`, color: C.text, fontSize: 13 }}>{cell}</td>)}</tr>
            ))}
          </tbody>
        </table>
      );
      continue;
    }
    // Checkbox list
    else if (line.match(/^- \[[ x]\]/)) {
      const checked = line.includes('[x]');
      const text = line.replace(/^- \[[ x]\] /, '');
      elements.push(
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, margin: '4px 0', fontSize: 13, color: C.text }}>
          <span style={{ color: checked ? C.green : C.muted, flexShrink: 0, marginTop: 1 }}>{checked ? '☑' : '☐'}</span>
          <span style={{ textDecoration: checked ? 'line-through' : 'none', opacity: checked ? 0.6 : 1 }}>{text}</span>
        </div>
      );
    }
    // List item
    else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <div key={i} style={{ display: 'flex', gap: 8, margin: '4px 0', fontSize: 13, color: C.text }}>
          <span style={{ color: C.blue, flexShrink: 0 }}>•</span>
          <span>{line.slice(2)}</span>
        </div>
      );
    }
    // Blockquote
    else if (line.startsWith('> ')) {
      elements.push(
        <div key={i} style={{ borderLeft: `3px solid ${C.blue}`, paddingLeft: 12, margin: '10px 0', color: C.muted, fontSize: 13, fontStyle: 'italic' }}>
          {line.slice(2)}
        </div>
      );
    }
    // Horizontal rule
    else if (line.startsWith('---') || line.startsWith('===')) {
      elements.push(<hr key={i} style={{ border: 'none', borderTop: `1px solid ${C.border}`, margin: '16px 0' }} />);
    }
    // Inline code / bold paragraph
    else if (line.trim()) {
      const rendered = line
        .replace(/`([^`]+)`/g, `<code style="background:${C.border};color:${C.blue};padding:1px 5px;border-radius:4px;font-family:monospace;font-size:12px">$1</code>`)
        .replace(/\*\*([^*]+)\*\*/g, `<strong style="color:${C.text}">$1</strong>`)
        .replace(/⚠️/g, `<span style="color:${C.orange}">⚠️</span>`)
        .replace(/❌/g, `<span style="color:${C.red}">❌</span>`);
      elements.push(
        <p key={i} style={{ margin: '6px 0', fontSize: 13, color: C.text, lineHeight: 1.75 }}
           dangerouslySetInnerHTML={{ __html: rendered }} />
      );
    } else {
      elements.push(<div key={i} style={{ height: 6 }} />);
    }
    i++;
  }
  return <div style={{ padding: '4px 0' }}>{elements}</div>;
};

// ─── Chat Tab ─────────────────────────────────────────────────────
const MOCK_CHAT_INIT: ChatMessage[] = [
  {
    id: 1, role: 'assistant',
    content: '你好！我已加载「交易核心架构知识库」的所有文档，可以帮你检索内容、解答疑问，或根据你的需求生成修改建议并提交 PR。',
    timestamp: '09:00',
  },
];

const MOCK_AI_RESPONSES: Record<string, ChatMessage> = {
  '限流': {
    id: 0, role: 'assistant',
    content: '在本知识库中找到关于**限流熔断**的相关内容，来自 `architecture/stability/circuit-breaker.md`：\n\nSentinel 熔断策略共三种：慢调用比例（RT > 200ms 且比例 > 50%，熔断 10s）、异常比例（> 20%，熔断 10s）、异常数（1分钟内 > 10，熔断 10s）。核心接口必须提供降级兜底逻辑。',
    citations: [{ file: 'architecture/stability/circuit-breaker.md', snippet: '慢调用比例：RT > 200ms 且比例 > 50%，熔断 10s' }],
    suggestUpdate: true,
    timestamp: '',
  },
  '分布式事务': {
    id: 0, role: 'assistant',
    content: '找到**分布式事务**相关内容，来自 `architecture/transaction/distributed-tx.md`：\n\n推荐两种方案：**TCC 模式**（强一致，适用资金类操作）和 **Saga 模式**（最终一致，适用业务流程类）。禁止在分布式事务中嵌套远程调用，Try 阶段不得做不可逆操作，超时不得超过 3000ms。',
    citations: [{ file: 'architecture/transaction/distributed-tx.md', snippet: 'TCC 模式（强一致）适用于资金类操作' }],
    suggestUpdate: true,
    timestamp: '',
  },
};

const simulateAIResponse = (input: string, repo: KnowledgeRepo): ChatMessage => {
  const now = new Date().toLocaleTimeString('zh', { hour: '2-digit', minute: '2-digit' });
  for (const [key, resp] of Object.entries(MOCK_AI_RESPONSES)) {
    if (input.includes(key)) return { ...resp, id: Date.now(), timestamp: now };
  }
  if (input.includes('修改') || input.includes('更新') || input.includes('补充')) {
    return {
      id: Date.now(), role: 'assistant',
      content: '好的，我已根据你的要求生成修改方案。以下是 diff 预览，确认后我将自动创建 PR：',
      diffPreview: {
        file: 'architecture/stability/circuit-breaker.md',
        before: '- **慢调用比例**：RT > 200ms 且比例 > 50%，熔断 10s',
        after: '- **慢调用比例**：RT > 200ms 且比例 > 50%，熔断 10s\n- **最小请求数**：统计窗口内请求数需 ≥ 5 才触发熔断判断（避免小流量误熔断）',
      },
      timestamp: now,
    };
  }
  return {
    id: Date.now(), role: 'assistant',
    content: `我在「${repo.name}」中检索了相关内容，暂未找到与「${input}」直接匹配的文档段落。你可以尝试换个关键词，或者告诉我你想了解的具体问题，我来帮你定位。`,
    timestamp: now,
  };
};

const ChatTab: React.FC<{ repo: KnowledgeRepo; onPRCreated: (pr: PRItem) => void }> = ({ repo, onPRCreated }) => {
  const C = useTheme();
  const blueLight = C.blue;
  const inputBg = C.bg;
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_CHAT_INIT);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingDiff, setPendingDiff] = useState<ChatMessage | null>(null);
  const [citedFile, setCitedFile] = useState<string | null>(null);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  const scrollBottom = () => setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);

  const send = () => {
    if (!input.trim() || loading) return;
    const userMsg: ChatMessage = { id: Date.now(), role: 'user', content: input, timestamp: new Date().toLocaleTimeString('zh', { hour: '2-digit', minute: '2-digit' }) };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setLoading(true);
    scrollBottom();
    setTimeout(() => {
      const resp = simulateAIResponse(input, repo);
      setMessages(m => [...m, resp]);
      if (resp.diffPreview) setPendingDiff(resp);
      if (resp.citations?.[0]) setCitedFile(resp.citations[0].file);
      setLoading(false);
      scrollBottom();
    }, 1200);
  };

  const confirmPR = () => {
    if (!pendingDiff?.diffPreview) return;
    const newPR: PRItem = {
      id: Date.now(), title: `AI 建议：补充 ${pendingDiff.diffPreview.file} 中的限流最小请求数说明`,
      author: 'me', avatar: '🧑‍💻', status: 'open',
      updatedAt: '刚刚', branch: 'ai/circuit-breaker-min-requests',
      additions: 2, deletions: 0,
    };
    onPRCreated(newPR);
    const confirmMsg: ChatMessage = {
      id: Date.now(), role: 'assistant',
      content: '✅ PR 已创建成功！',
      prCreated: { id: newPR.id, title: newPR.title, branch: newPR.branch },
      timestamp: new Date().toLocaleTimeString('zh', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(m => [...m, confirmMsg]);
    setPendingDiff(null);
    scrollBottom();
  };

  const SUGGESTIONS = ['限流熔断规范是什么？', '分布式事务有哪些方案？', '帮我补充最小请求数说明'];

  return (
    <div style={{ display: 'flex', gap: 0, height: 560, animation: 'fadeUp 0.3s ease' }}>
      {/* ── Left: Chat ── */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', borderRight: `1px solid ${C.border}`, paddingRight: 20 }}>
        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 12 }}>
          {messages.map((msg) => (
            <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                {msg.role === 'assistant' && (
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>🤖</div>
                )}
                <div style={{
                  maxWidth: '78%', padding: '10px 14px', borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                  background: msg.role === 'user' ? C.blue : C.card,
                  border: msg.role === 'user' ? 'none' : `1px solid ${C.border}`,
                  fontSize: 13, color: C.text, lineHeight: 1.65,
                }}>
                  {msg.content.split('\n').map((line, i) => {
                    const html = line.replace(/\*\*([^*]+)\*\*/g, `<strong style="color:${blueLight}">$1</strong>`).replace(/`([^`]+)`/g, `<code style="background:${C.border};color:${C.green};padding:1px 5px;border-radius:4px;font-family:monospace;font-size:11px">$1</code>`);
                    return <p key={i} style={{ margin: i === 0 ? 0 : '4px 0 0' }} dangerouslySetInnerHTML={{ __html: html }} />;
                  })}

                  {/* Citations */}
                  {msg.citations?.map((c, i) => (
                    <div key={i} onClick={() => setCitedFile(c.file)} style={{ marginTop: 8, padding: '6px 10px', background: 'rgba(59,130,246,0.08)', borderLeft: `2px solid ${C.blue}`, borderRadius: 4, cursor: 'pointer' }}>
                      <div style={{ fontSize: 11, color: C.blue, fontFamily: 'monospace', marginBottom: 2 }}>📄 {c.file}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>{c.snippet}</div>
                    </div>
                  ))}

                  {/* Suggest update */}
                  {msg.suggestUpdate && !pendingDiff && (
                    <div style={{ marginTop: 10, padding: '8px 10px', background: 'rgba(245,158,11,0.08)', border: `1px solid rgba(245,158,11,0.2)`, borderRadius: 6 }}>
                      <div style={{ fontSize: 12, color: C.orange, marginBottom: 6 }}>💡 检测到内容可能需要更新，是否生成修改建议？</div>
                      <button className="kn-btn" onClick={() => { setInput('帮我补充最小请求数说明'); send(); }}
                        style={{ background: C.orange, color: '#fff', border: 'none', borderRadius: 5, padding: '4px 12px', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                        生成修改建议
                      </button>
                    </div>
                  )}

                  {/* Diff preview */}
                  {msg.diffPreview && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ fontSize: 11, color: C.muted, marginBottom: 6, fontFamily: 'monospace' }}>📄 {msg.diffPreview.file}</div>
                      <div style={{ background: C.sidebarBg, borderRadius: 6, padding: '10px 12px', fontFamily: 'monospace', fontSize: 12, lineHeight: 1.7 }}>
                        <div style={{ color: C.red }}>- {msg.diffPreview.before}</div>
                        {msg.diffPreview.after.split('\n').map((l, i) => <div key={i} style={{ color: C.green }}>+ {l}</div>)}
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <button className="kn-btn" onClick={confirmPR}
                          style={{ background: C.green, color: '#fff', border: 'none', borderRadius: 5, padding: '5px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                          ✓ 确认，创建 PR
                        </button>
                        <button className="kn-btn" onClick={() => setPendingDiff(null)}
                          style={{ background: 'transparent', color: C.muted, border: `1px solid ${C.border}`, borderRadius: 5, padding: '5px 14px', cursor: 'pointer', fontSize: 12 }}>
                          取消
                        </button>
                      </div>
                    </div>
                  )}

                  {/* PR created */}
                  {msg.prCreated && (
                    <div style={{ marginTop: 8, padding: '8px 10px', background: 'rgba(16,185,129,0.08)', border: `1px solid rgba(16,185,129,0.2)`, borderRadius: 6 }}>
                      <div style={{ fontSize: 12, color: C.green, fontWeight: 600 }}>🔀 PR 已创建</div>
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{msg.prCreated.title}</div>
                      <div style={{ fontSize: 11, color: C.purple, fontFamily: 'monospace', marginTop: 2 }}>#{msg.prCreated.branch}</div>
                    </div>
                  )}
                </div>
              </div>
              <span style={{ fontSize: 10, color: C.border, paddingLeft: msg.role === 'user' ? 0 : 36, paddingRight: msg.role === 'user' ? 4 : 0 }}>{msg.timestamp}</span>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🤖</div>
              <div style={{ padding: '10px 14px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px 12px 12px 4px', fontSize: 13, color: C.muted }}>
                正在检索知识库<span style={{ animation: 'fadeIn 1s infinite' }}>...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestions */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          {SUGGESTIONS.map(s => (
            <button key={s} className="filter-chip" onClick={() => setInput(s)}
              style={{ background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 16, padding: '4px 10px', color: C.muted, cursor: 'pointer', fontSize: 11 }}>
              {s}
            </button>
          ))}
        </div>

        {/* Input */}
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="kn-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="问一个问题，或说「帮我修改 xxx」…"
            style={{
              flex: 1, background: inputBg, border: `1px solid ${C.border}`,
              borderRadius: 8, color: C.text, fontSize: 13, padding: '9px 14px', fontFamily: 'inherit',
            }}
          />
          <button className="kn-btn" onClick={send} disabled={loading || !input.trim()}
            style={{
              background: input.trim() ? C.blue : C.border, color: '#fff', border: 'none',
              borderRadius: 8, padding: '0 18px', cursor: input.trim() ? 'pointer' : 'default', fontSize: 14, fontWeight: 700,
            }}>
            ↑
          </button>
        </div>
      </div>

      {/* ── Right: Referenced doc ── */}
      <div style={{ width: 280, flexShrink: 0, paddingLeft: 20, overflowY: 'auto' }}>
        <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
          引用文档
        </div>
        {citedFile ? (
          <div>
            <div style={{ fontSize: 12, color: C.blue, fontFamily: 'monospace', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>📄</span>{citedFile}
            </div>
            <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.7, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: '12px' }}>
              {/* highlight snippet */}
              <div style={{ background: 'rgba(245,158,11,0.12)', border: `1px solid rgba(245,158,11,0.25)`, borderRadius: 4, padding: '6px 8px', marginBottom: 8, fontSize: 11, color: C.orange }}>
                ⚡ 命中段落
              </div>
              <div style={{ fontSize: 12, color: C.text, lineHeight: 1.8 }}>
                {citedFile.includes('circuit-breaker') ? '慢调用比例：RT > 200ms 且比例 > 50%，熔断 10s\n异常比例：异常比例 > 20%，熔断 10s\n异常数：1分钟内异常数 > 10，熔断 10s' : '核心接口必须提供降级兜底逻辑，不能直接返回错误。'}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0', color: C.border, fontSize: 12 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>📎</div>
            提问后这里会显示<br />引用的文档段落
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Commits Tab ──────────────────────────────────────────────────
const CommitsTab: React.FC<{ repo: KnowledgeRepo }> = ({ repo }) => {
  const C = useTheme();
  const [expandedHash, setExpandedHash] = useState<string | null>(null);
  return (
    <div style={{ animation: 'fadeUp 0.3s ease' }}>
      {/* Timeline */}
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', left: 15, top: 0, bottom: 0, width: 1, background: C.border }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {repo.commits.map((commit, idx) => (
            <div key={commit.hash} style={{ position: 'relative', paddingLeft: 40, paddingBottom: 20 }}>
              {/* dot */}
              <div style={{
                position: 'absolute', left: 9, top: 14,
                width: 13, height: 13, borderRadius: '50%',
                background: idx === 0 ? C.blue : C.card,
                border: `2px solid ${idx === 0 ? C.blue : C.border}`,
                zIndex: 1,
              }} />
              {/* card */}
              <div
                className="kn-pr-row"
                onClick={() => setExpandedHash(expandedHash === commit.hash ? null : commit.hash)}
                style={{
                  background: C.card, border: `1px solid ${expandedHash === commit.hash ? C.blue : C.border}`,
                  borderRadius: expandedHash === commit.hash ? '8px 8px 0 0' : 8,
                  padding: '12px 14px', cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 3 }}>{commit.message}</div>
                    <div style={{ fontSize: 11, color: C.muted, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span>{commit.avatar} {commit.author}</span>
                      <span style={{ fontFamily: 'monospace', color: C.purple, background: 'rgba(139,92,246,0.1)', padding: '1px 6px', borderRadius: 4 }}>{commit.hash}</span>
                      <span>{commit.date}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, fontSize: 12, flexShrink: 0, alignItems: 'center' }}>
                    <span style={{ color: C.green, fontWeight: 600 }}>+{commit.additions}</span>
                    <span style={{ color: C.red, fontWeight: 600 }}>-{commit.deletions}</span>
                    <span style={{ color: C.muted, fontSize: 11 }}>{expandedHash === commit.hash ? '▲' : '▼'}</span>
                  </div>
                </div>
              </div>
              {expandedHash === commit.hash && (
                <div style={{
                  background: C.sidebarBg, border: `1px solid ${C.blue}`,
                  borderTop: 'none', borderRadius: '0 0 8px 8px',
                  padding: '12px 14px', animation: 'fadeIn 0.2s ease',
                }}>
                  <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>变更文件</div>
                  {commit.files.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', fontSize: 12, color: C.text, fontFamily: 'monospace' }}>
                      <span style={{ color: C.green }}>M</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Detail Page ──────────────────────────────────────────────────
type DetailTab = 'docs' | 'prs' | 'members' | 'chat' | 'commits';

const RepoDetail: React.FC<{ repo: KnowledgeRepo; onBack: () => void }> = ({ repo, onBack }) => {
  const C = useTheme();
  const blueLight = C.blue;
  const [activeTab, setActiveTab] = useState<DetailTab>('docs');
  const [selectedFile, setSelectedFile] = useState<string | null>('README.md');
  const [selectedContent, setSelectedContent] = useState<string>(
    repo.tree.find(n => n.name === 'README.md')?.content ?? ''
  );
  const [expandedPR, setExpandedPR] = useState<number | null>(null);
  const [prs, setPrs] = useState<PRItem[]>(repo.prs);
  const typeConfig = getTypeConfig(repo.typeKey);

  const handleFileSelect = (name: string, content: string) => {
    setSelectedFile(name);
    setSelectedContent(content);
  };

  const handlePRCreated = (pr: PRItem) => {
    setPrs(prev => [pr, ...prev]);
    setTimeout(() => setActiveTab('prs'), 800);
  };

  const tabs: { key: DetailTab; label: string; count?: number }[] = [
    { key: 'docs',    label: '📄 文档' },
    { key: 'prs',     label: '🔀 PR',   count: prs.filter(p => p.status === 'open').length },
    { key: 'members', label: '👥 成员', count: repo.members.length },
    { key: 'chat',    label: '💬 对话' },
    { key: 'commits', label: '📋 Commits', count: repo.commits.length },
  ];

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* ── Breadcrumb ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, fontSize: 13 }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', color: C.blue, cursor: 'pointer', padding: 0, fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}
        >
          ← 知识库
        </button>
        <span style={{ color: C.border }}>/</span>
        <span style={{ color: C.text, fontWeight: 600 }}>{repo.name}</span>
      </div>

      {/* ── Repo Header ── */}
      <div style={{
        background: C.card, border: `1px solid ${C.border}`, borderRadius: C.radius,
        padding: '20px 24px', marginBottom: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10,
              background: `${typeConfig.color}18`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0,
            }}>
              {typeConfig.icon}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.text }}>{repo.name}</h2>
                <TypeTag typeKey={repo.typeKey} size="md" />
              </div>
              <p style={{ margin: 0, fontSize: 13, color: C.muted }}>{repo.desc}</p>
            </div>
          </div>
          <button className="kn-btn" style={{
            background: C.blue, color: '#fff', border: 'none', borderRadius: 8,
            padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600, flexShrink: 0,
          }}>
            ✎ 发起贡献
          </button>
        </div>
        <div style={{ display: 'flex', gap: 20, marginTop: 14, flexWrap: 'wrap' }}>
          {[
            { label: 'Owner', value: `${repo.ownerAvatar} ${repo.owner}` },
            { label: '文档数', value: `${repo.docCount} 篇` },
            { label: '成员', value: `${repo.memberCount} 人` },
            { label: '最近更新', value: repo.updatedAt },
          ].map(({ label, value }) => (
            <div key={label} style={{ fontSize: 12 }}>
              <span style={{ color: C.muted }}>{label}：</span>
              <span style={{ color: C.text, fontWeight: 600 }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Detail Tabs ── */}
      <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${C.border}`, marginBottom: 20 }}>
        {tabs.map(({ key, label, count }) => {
          const active = activeTab === key;
          return (
            <button
              key={key}
              className="kn-tab"
              onClick={() => setActiveTab(key)}
              style={{
                background: 'transparent', border: 'none',
                borderBottom: `2px solid ${active ? C.blue : 'transparent'}`,
                padding: '10px 18px',
                color: active ? blueLight : C.muted,
                cursor: 'pointer', fontSize: 13,
                fontWeight: active ? 700 : 400,
                transition: 'color 0.15s, border-color 0.15s',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              {label}
              {count !== undefined && count > 0 && (
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  background: active ? C.blue : C.border,
                  color: active ? '#fff' : C.muted,
                  borderRadius: 10, padding: '1px 6px',
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Docs Tab: Two-column ── */}
      {activeTab === 'docs' && (
        <div style={{ display: 'flex', gap: 0, minHeight: 500, animation: 'fadeUp 0.3s ease' }}>
          {/* Left: File Tree */}
          <div style={{
            width: 220, flexShrink: 0,
            borderRight: `1px solid ${C.border}`,
            paddingRight: 12,
          }}>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
              文件目录
            </div>
            {repo.tree.map((node, i) => (
              <TreeItem key={i} node={node} depth={0} selectedFile={selectedFile} onSelect={handleFileSelect} />
            ))}
          </div>

          {/* Right: Markdown Preview */}
          <div style={{ flex: 1, minWidth: 0, paddingLeft: 24 }}>
            {selectedFile ? (
              <>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${C.border}`,
                }}>
                  <span style={{ fontSize: 14 }}>📄</span>
                  <span style={{ fontSize: 13, color: C.muted, fontFamily: 'monospace' }}>{selectedFile}</span>
                  <button className="kn-btn" style={{
                    marginLeft: 'auto', background: 'transparent',
                    border: `1px solid ${C.border}`, borderRadius: 6,
                    padding: '4px 12px', color: C.muted, cursor: 'pointer', fontSize: 12,
                  }}>
                    ✎ 编辑
                  </button>
                </div>
                <MarkdownView content={selectedContent} />
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 0', color: C.muted, fontSize: 13 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
                选择左侧文件查看内容
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PR Tab ── */}
      {activeTab === 'prs' && (
        <div style={{ animation: 'fadeUp 0.3s ease' }}>
          {prs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: C.muted, fontSize: 13 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
              暂无 PR，知识库已是最新状态
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {prs.map((pr) => (
                <div key={pr.id}>
                  <div
                    className="kn-pr-row"
                    onClick={() => setExpandedPR(expandedPR === pr.id ? null : pr.id)}
                    style={{
                      background: C.card, border: `1px solid ${expandedPR === pr.id ? C.blue : C.border}`,
                      borderRadius: expandedPR === pr.id ? '8px 8px 0 0' : 8,
                      padding: '14px 16px', cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <PRStatusBadge status={pr.status} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4 }}>{pr.title}</div>
                        <div style={{ fontSize: 12, color: C.muted, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                          <span>{pr.avatar} {pr.author}</span>
                          <span style={{ fontFamily: 'monospace', color: C.purple }}>#{pr.branch}</span>
                          <span>{pr.updatedAt}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, fontSize: 12, flexShrink: 0 }}>
                        <span style={{ color: C.green, fontWeight: 600 }}>+{pr.additions}</span>
                        <span style={{ color: C.red, fontWeight: 600 }}>-{pr.deletions}</span>
                      </div>
                      <span style={{ color: C.muted, fontSize: 12 }}>{expandedPR === pr.id ? '▲' : '▼'}</span>
                    </div>
                  </div>
                  {expandedPR === pr.id && (
                    <div style={{
                      background: C.sidebarBg, border: `1px solid ${C.blue}`,
                      borderTop: 'none', borderRadius: '0 0 8px 8px',
                      padding: '16px', animation: 'fadeIn 0.2s ease',
                    }}>
                      <div style={{ fontSize: 12, color: C.muted, marginBottom: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        变更摘要
                      </div>
                      <div style={{ fontFamily: 'monospace', fontSize: 12, lineHeight: 1.7 }}>
                        <div style={{ color: C.green }}>+ 新增分布式事务 TCC 模式代码示例</div>
                        <div style={{ color: C.green }}>+ 补充 Confirm/Cancel 阶段幂等处理说明</div>
                        <div style={{ color: C.red }}>- 移除过时的 2PC 方案描述</div>
                        <div style={{ color: C.muted }}>  更新相关引用链接</div>
                      </div>
                      {pr.status === 'open' && (
                        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                          <button className="kn-btn" style={{
                            background: C.green, color: '#fff', border: 'none', borderRadius: 6,
                            padding: '6px 16px', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                          }}>
                            ✓ 合并 PR
                          </button>
                          <button className="kn-btn" style={{
                            background: 'transparent', color: C.muted, border: `1px solid ${C.border}`,
                            borderRadius: 6, padding: '6px 16px', cursor: 'pointer', fontSize: 12,
                          }}>
                            💬 评论
                          </button>
                          <button className="kn-btn" style={{
                            background: 'transparent', color: C.red, border: `1px solid rgba(239,68,68,0.3)`,
                            borderRadius: 6, padding: '6px 16px', cursor: 'pointer', fontSize: 12,
                          }}>
                            ✕ 关闭
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Members Tab ── */}
      {activeTab === 'members' && (
        <div style={{ animation: 'fadeUp 0.3s ease' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 600 }}>
            {repo.members.map((m, i) => (
              <div key={i} style={{
                background: C.card, border: `1px solid ${C.border}`, borderRadius: 8,
                padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'rgba(59,130,246,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0,
                }}>
                  {m.avatar}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{m.name}</div>
                </div>
                <RoleBadge role={m.role} />
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16 }}>
            <button className="kn-btn" style={{
              background: 'transparent', border: `1px dashed ${C.border}`,
              borderRadius: 8, padding: '10px 20px', color: C.muted, cursor: 'pointer', fontSize: 13,
            }}>
              + 邀请成员
            </button>
          </div>
        </div>
      )}

      {/* ── Chat Tab ── */}
      {activeTab === 'chat' && (
        <ChatTab repo={repo} onPRCreated={handlePRCreated} />
      )}

      {/* ── Commits Tab ── */}
      {activeTab === 'commits' && (
        <CommitsTab repo={repo} />
      )}
    </div>
  );
};

// ─── Global Chat Types ────────────────────────────────────────────
interface GlobalChatMsg {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  sources?: { repo: string; file: string; snippet: string; typeKey: string }[];
  timestamp: string;
}

const GLOBAL_QA: { keys: string[]; answer: string; sources: GlobalChatMsg['sources'] }[] = [
  {
    keys: ['限流', '熔断'],
    answer: '在 **2 个知识库**中找到了限流熔断相关内容：\n\n**交易核心架构知识库**中的 Sentinel 配置规范：慢调用比例（RT > 200ms 且比例 > 50%，熔断 10s）、异常比例（> 20%，熔断 10s）、异常数（1分钟内 > 10，熔断 10s）。核心接口必须提供降级兜底逻辑。\n\n**后端中间件通识库**中也有 Resilience4j 的相关配置说明，适用于非 Sentinel 接入的场景。',
    sources: [
      { repo: '交易核心架构知识库', file: 'architecture/stability/circuit-breaker.md', snippet: '慢调用比例：RT > 200ms 且比例 > 50%，熔断 10s', typeKey: '架构知识' },
      { repo: '后端中间件通识库', file: 'middleware/resilience4j.md', snippet: 'Resilience4j 适用于非 Sentinel 接入场景', typeKey: '后端通识' },
    ],
  },
  {
    keys: ['认证', '登录', 'Token'],
    answer: '在 **用户中心系统知识库** 中找到完整的认证规范：\n\n- 密码必须客户端 AES-256 加密后传输\n- Token 有效期 2 小时，刷新 Token 7 天\n- 连续登录失败 5 次，锁定账号 30 分钟\n- 接口路径：`POST /api/v2/auth/login`',
    sources: [
      { repo: '用户中心系统知识库', file: 'api/user-auth.md', snippet: 'Token 有效期 2 小时，连续失败 5 次锁定账号 30 分钟', typeKey: '系统知识' },
    ],
  },
  {
    keys: ['分布式事务', '事务'],
    answer: '在 **交易核心架构知识库** 中找到分布式事务规范，推荐两种方案：\n\n**TCC 模式**（强一致）适用于资金类操作，需实现 Try / Confirm / Cancel 三个阶段，超时不超过 3000ms。\n\n**Saga 模式**（最终一致）适用于业务流程类，每个本地事务必须有对应补偿操作。\n\n禁止在分布式事务中嵌套远程调用，Try 阶段不得做不可逆操作。',
    sources: [
      { repo: '交易核心架构知识库', file: 'architecture/transaction/distributed-tx.md', snippet: 'TCC 模式（强一致）适用于资金类操作', typeKey: '架构知识' },
      { repo: '交易核心架构知识库', file: 'architecture/transaction/saga-pattern.md', snippet: '每个本地事务必须有对应的补偿操作', typeKey: '架构知识' },
    ],
  },
  {
    keys: ['测试', '单测', '覆盖率'],
    answer: '在 **质量工程通识库** 中找到测试规范：\n\n- 单测覆盖率要求 > 80%\n- 核心链路必须有集成测试\n- 混沌工程实验需提前申请变更窗口\n- 禁止在测试环境直接访问生产数据库',
    sources: [
      { repo: '质量工程通识库', file: 'testing/unit-test-spec.md', snippet: '单测覆盖率 > 80%，核心链路必须有集成测试', typeKey: '质量通识' },
    ],
  },
  {
    keys: ['命名', '规范', 'Code Review'],
    answer: '在 **交易核心架构知识库** 的开发规范中找到相关内容：\n\nCode Review 必查项：禁止循环内 DB/RPC 调用、所有写接口必须幂等、禁止捕获 Exception 后只打日志、禁止硬编码配置项。\n\n命名规范：包名全小写按业务域分层，Service 实现类用 `XxxServiceImpl`，查询方法用 `getXxx / listXxx`。',
    sources: [
      { repo: '交易核心架构知识库', file: 'guidelines/code-review.md', snippet: '禁止循环内 DB/RPC 调用，所有写接口必须幂等', typeKey: '架构知识' },
      { repo: '交易核心架构知识库', file: 'guidelines/naming-convention.md', snippet: 'Service 实现类：XxxServiceImpl', typeKey: '架构知识' },
    ],
  },
];

const resolveGlobalAnswer = (input: string): { answer: string; sources: GlobalChatMsg['sources'] } => {
  for (const item of GLOBAL_QA) {
    if (item.keys.some(k => input.includes(k))) {
      return { answer: item.answer, sources: item.sources };
    }
  }
  return {
    answer: `我在全部 **${MOCK_REPOS.length} 个知识库**（共 ${MOCK_REPOS.reduce((s, r) => s + r.docCount, 0)} 篇文档）中检索了「${input}」，暂未找到直接匹配的内容。\n\n你可以尝试换个关键词，或者进入具体知识库的「对话」Tab 精确提问。`,
    sources: [],
  };
};

// ─── Global Search Bar（对话式）──────────────────────────────────
const GlobalSearchBar: React.FC<{ onEnterRepo: (repo: KnowledgeRepo) => void; reposCount: number }> = ({ onEnterRepo, reposCount }) => {
  const C = useTheme();
  const purpleLight = C.purple;
  const inputBg = C.bg;
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<GlobalChatMsg[]>([
    {
      id: 1, role: 'assistant',
      content: '你好！我可以帮你跨所有知识库检索内容。试试问我：「限流熔断规范是什么？」或「分布式事务有哪些方案？」',
      timestamp: '',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  const scrollBottom = () => setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);

  const send = () => {
    if (!input.trim() || loading) return;
    const now = new Date().toLocaleTimeString('zh', { hour: '2-digit', minute: '2-digit' });
    const userMsg: GlobalChatMsg = { id: Date.now(), role: 'user', content: input, timestamp: now };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setLoading(true);
    if (!expanded) setExpanded(true);
    scrollBottom();
    setTimeout(() => {
      const { answer, sources } = resolveGlobalAnswer(input);
      const aiMsg: GlobalChatMsg = {
        id: Date.now() + 1, role: 'assistant', content: answer,
        sources: sources && sources.length > 0 ? sources : undefined,
        timestamp: new Date().toLocaleTimeString('zh', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(m => [...m, aiMsg]);
      setLoading(false);
      scrollBottom();
    }, 1100);
  };

  const SUGGESTIONS = ['限流熔断规范？', '分布式事务方案？', '认证 Token 有效期？', 'Code Review 必查项？'];

  const renderContent = (text: string) =>
    text
      .replace(/\*\*([^*]+)\*\*/g, `<strong style="color:${purpleLight}">$1</strong>`)
      .replace(/`([^`]+)`/g, `<code style="background:${C.border};color:${C.green};padding:1px 5px;border-radius:4px;font-family:monospace;font-size:11px">$1</code>`);

  return (
    <div style={{
      marginBottom: 28,
      background: C.card, border: `1px solid ${C.border}`,
      borderRadius: C.radius, overflow: 'hidden',
      transition: 'box-shadow 0.2s',
    }}>
      {/* ── Header ── */}
      <div
        style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', borderBottom: expanded ? `1px solid ${C.border}` : 'none' }}
        onClick={() => setExpanded(e => !e)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={16} />
          <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>跨库智能问答</span>
          <span style={{ fontSize: 12, color: C.muted }}>— 搜遍全部 {reposCount} 个知识库</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {messages.length > 1 && (
            <span style={{ fontSize: 11, color: C.purple, background: 'rgba(139,92,246,0.1)', borderRadius: 10, padding: '2px 8px' }}>
              {messages.filter(m => m.role === 'user').length} 条对话
            </span>
          )}
          <span style={{ color: C.muted, fontSize: 12, transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'none' }}>▼</span>
        </div>
      </div>

      {/* ── Chat Body ── */}
      {expanded && (
        <div style={{ animation: 'fadeUp 0.2s ease' }}>
          {/* Messages */}
          <div style={{ maxHeight: 340, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {messages.map((msg) => (
              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', maxWidth: '90%' }}>
                  {msg.role === 'assistant' && (
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}><Sparkles size={14} /></div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: '100%' }}>
                    <div style={{
                      padding: '10px 14px',
                      borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                      background: msg.role === 'user' ? C.purple : C.card,
                      border: msg.role === 'user' ? 'none' : `1px solid ${C.border}`,
                      fontSize: 13, color: C.text, lineHeight: 1.7,
                    }}>
                      {msg.content.split('\n').map((line, i) => (
                        <p key={i} style={{ margin: i === 0 ? 0 : '4px 0 0' }}
                          dangerouslySetInnerHTML={{ __html: renderContent(line) }} />
                      ))}
                    </div>

                    {/* Source cards */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          📎 来源 ({msg.sources.length})
                        </div>
                        {msg.sources.map((src, i) => {
                          const cfg = getTypeConfig(src.typeKey);
                          const repo = MOCK_REPOS.find(r => r.name === src.repo);
                          return (
                            <div
                              key={i}
                              className="kn-pr-row"
                              onClick={() => repo && onEnterRepo(repo)}
                              style={{
                                background: C.card, border: `1px solid ${C.border}`,
                                borderLeft: `3px solid ${cfg.color}`,
                                borderRadius: 8, padding: '10px 12px',
                                cursor: repo ? 'pointer' : 'default',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                <span style={{ fontSize: 13 }}>{cfg.icon}</span>
                                <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{src.repo}</span>
                                <span style={{ marginLeft: 'auto', fontSize: 10, color: cfg.color, background: `${cfg.color}15`, borderRadius: 4, padding: '1px 6px', fontWeight: 600 }}>{cfg.label}</span>
                              </div>
                              <div style={{ fontSize: 11, color: C.blue, fontFamily: 'monospace', marginBottom: 4 }}>📄 {src.file}</div>
                              <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.5 }}>{src.snippet}</div>
                              {repo && (
                                <div style={{ marginTop: 6, fontSize: 11, color: C.purple }}>→ 进入知识库查看完整文档</div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                {msg.timestamp && (
                  <span style={{ fontSize: 10, color: C.border, paddingLeft: msg.role === 'user' ? 0 : 34 }}>{msg.timestamp}</span>
                )}
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Sparkles size={14} /></div>
                <div style={{ padding: '10px 14px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px 12px 12px 4px', fontSize: 13, color: C.muted }}>
                  正在检索全部知识库<span style={{ animation: 'fadeIn 1s infinite' }}>...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          <div style={{ padding: '0 20px 10px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {SUGGESTIONS.map(s => (
              <button key={s} className="filter-chip" onClick={() => setInput(s)}
                style={{ background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 16, padding: '4px 10px', color: C.muted, cursor: 'pointer', fontSize: 11 }}>
                {s}
              </button>
            ))}
          </div>

          {/* Input */}
          <div style={{ padding: '10px 20px 16px', display: 'flex', gap: 8 }}>
            <input
              className="kn-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder="跨库提问，例如：所有架构知识库里关于限流的规范？"
              style={{
                flex: 1, background: inputBg, border: `1px solid ${C.border}`,
                borderRadius: 8, color: C.text, fontSize: 13,
                padding: '9px 14px', fontFamily: 'inherit',
              }}
            />
            <button className="kn-btn" onClick={send} disabled={loading || !input.trim()}
              style={{
                background: input.trim() ? C.purple : C.border, color: '#fff', border: 'none',
                borderRadius: 8, padding: '0 18px', cursor: input.trim() ? 'pointer' : 'default', fontSize: 14, fontWeight: 700,
              }}>
              ↑
            </button>
          </div>
        </div>
      )}

      {/* ── Collapsed: quick input ── */}
      {!expanded && (
        <div style={{ padding: '12px 20px 14px', display: 'flex', gap: 8 }} onClick={e => e.stopPropagation()}>
          <input
            className="kn-input"
            value={input}
            onChange={e => { setInput(e.target.value); if (!expanded) setExpanded(true); }}
            onFocus={() => setExpanded(true)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="跨库提问，例如：所有架构知识库里关于限流的规范？"
            style={{
              flex: 1, background: inputBg, border: `1px solid ${C.border}`,
              borderRadius: 8, color: C.text, fontSize: 13,
              padding: '9px 14px', fontFamily: 'inherit',
            }}
          />
          <button className="kn-btn" onClick={send} disabled={loading || !input.trim()}
            style={{
              background: input.trim() ? C.purple : C.border, color: '#fff', border: 'none',
              borderRadius: 8, padding: '0 18px', cursor: input.trim() ? 'pointer' : 'default', fontSize: 14, fontWeight: 700,
            }}>
            ↑
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Create Repo Modal ────────────────────────────────────────────
const CreateRepoModal: React.FC<{
  onClose: () => void;
  onCreate: (repo: KnowledgeRepo) => void;
}> = ({ onClose, onCreate }) => {
  const C = useTheme();
  const borderHover = C.border;
  const inputBg = C.bg;
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [typeKey, setTypeKey] = useState(KNOWLEDGE_TYPES[0].key);

  const handleCreate = () => {
    if (!name.trim()) return;
    const cfg = getTypeConfig(typeKey);
    const newRepo: KnowledgeRepo = {
      id: Date.now(),
      name: name.trim(),
      typeKey,
      desc: desc.trim() || `${cfg.label} - ${name.trim()}`,
      owner: 'me',
      ownerAvatar: '🧑‍💻',
      memberCount: 1,
      updatedAt: '刚刚',
      docCount: 0,
      prCount: 0,
      isMine: true,
      tree: [{ name: 'README.md', type: 'file', content: `# ${name.trim()}\n\n> 本知识库由我创建。\n` }],
      members: [{ name: 'me', avatar: '🧑‍💻', role: 'Owner' }],
      prs: [],
      commits: [],
    };
    onCreate(newRepo);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: C.card, border: `1px solid ${borderHover}`,
          borderRadius: 16, padding: '28px 32px', width: 480, maxWidth: '90vw',
          animation: 'fadeUp 0.25s ease',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <BookOpen size={20} />
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.text }}>新建知识库</h2>
        </div>

        {/* Name */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, color: C.muted, fontWeight: 600, marginBottom: 6 }}>
            知识库名称 *
          </label>
          <input
            className="kn-input"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            placeholder="例如：支付核心系统知识库"
            autoFocus
            style={{
              width: '100%', boxSizing: 'border-box',
              background: inputBg, border: `1px solid ${C.border}`,
              borderRadius: 8, color: C.text, fontSize: 13,
              padding: '9px 12px', fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Type */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, color: C.muted, fontWeight: 600, marginBottom: 8 }}>
            知识库类型
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {KNOWLEDGE_TYPES.map(t => (
              <button
                key={t.key}
                onClick={() => setTypeKey(t.key)}
                style={{
                  background: typeKey === t.key ? `${t.color}18` : 'transparent',
                  border: `1px solid ${typeKey === t.key ? t.color : C.border}`,
                  borderRadius: 20, padding: '5px 12px',
                  color: typeKey === t.key ? t.color : C.muted,
                  cursor: 'pointer', fontSize: 12,
                  fontWeight: typeKey === t.key ? 700 : 400,
                  transition: 'all 0.15s',
                }}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>
            {getTypeConfig(typeKey).desc}
          </div>
        </div>

        {/* Desc */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 12, color: C.muted, fontWeight: 600, marginBottom: 6 }}>
            描述（可选）
          </label>
          <textarea
            className="kn-input"
            value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder="简要描述这个知识库的用途..."
            rows={3}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: inputBg, border: `1px solid ${C.border}`,
              borderRadius: 8, color: C.text, fontSize: 13,
              padding: '9px 12px', fontFamily: 'inherit',
              resize: 'vertical', minHeight: 72,
            }}
          />
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: `1px solid ${C.border}`,
              borderRadius: 8, padding: '9px 20px',
              color: C.muted, cursor: 'pointer', fontSize: 13,
              transition: 'border-color 0.15s, color 0.15s',
            }}
          >
            取消
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            style={{
              background: name.trim() ? C.blue : C.border,
              border: 'none', borderRadius: 8,
              padding: '9px 20px', color: '#fff',
              cursor: name.trim() ? 'pointer' : 'default',
              fontSize: 13, fontWeight: 700,
              transition: 'background 0.15s',
            }}
          >
            创建知识库
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── List Page ────────────────────────────────────────────────────
const RepoList: React.FC<{
  repos: KnowledgeRepo[];
  onEnter: (repo: KnowledgeRepo) => void;
  onCreate: (repo: KnowledgeRepo) => void;
}> = ({ repos, onEnter, onCreate }) => {
  const C = useTheme();
  const blueLight = C.blue;
  const purpleLight = C.purple;
  const inputBg = C.bg;
  const [tab, setTab] = useState<'mine' | 'all' | 'chat'>('mine');
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | KnowledgeCategory>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [showCreate, setShowCreate] = useState(false);

  const baseRepos = tab === 'mine' ? repos.filter(r => r.isMine) : repos;
  const filtered = baseRepos.filter(r => {
    const cfg = getTypeConfig(r.typeKey);
    const matchSearch = search.trim() === '' || r.name.includes(search) || r.desc.includes(search) || r.owner.includes(search);
    const matchCat = filterCategory === 'all' || cfg.category === filterCategory;
    const matchType = filterType === 'all' || r.typeKey === filterType;
    return matchSearch && matchCat && matchType;
  });

  const categoryTypes = filterCategory === 'all'
    ? KNOWLEDGE_TYPES
    : KNOWLEDGE_TYPES.filter(t => t.category === filterCategory);

  const LIST_TABS = [
    { key: 'mine' as const,  label: '我的知识库', count: repos.filter(r => r.isMine).length },
    { key: 'all'  as const,  label: '全部知识库', count: repos.length },
    { key: 'chat' as const,  label: '💬 跨库对话', count: undefined },
  ];

  return (
    <div style={{ animation: 'fadeUp 0.4s ease' }}>
      {/* ── My / All / Chat Tab ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${C.border}`, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 0 }}>
        {LIST_TABS.map(({ key, label, count }) => {
          const active = tab === key;
          const isChat = key === 'chat';
          return (
            <button key={key} className="kn-tab"
              onClick={() => { setTab(key); if (!isChat) { setFilterType('all'); setFilterCategory('all'); } }}
              style={{
                background: 'transparent', border: 'none',
                borderBottom: `2px solid ${active ? (isChat ? C.purple : C.blue) : 'transparent'}`,
                padding: '10px 20px', color: active ? (isChat ? purpleLight : blueLight) : C.muted,
                cursor: 'pointer', fontSize: 14, fontWeight: active ? 700 : 400,
                transition: 'color 0.15s, border-color 0.15s',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              {label}
              {count !== undefined && (
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  background: active ? (isChat ? C.purple : C.blue) : C.border,
                  color: active ? '#fff' : C.muted,
                  borderRadius: 10, padding: '1px 6px',
                }}>{count}</span>
              )}
            </button>
          );
        })}
        </div>
        <button
          className="kn-btn"
          onClick={() => setShowCreate(true)}
          style={{
            background: C.blue, color: '#fff', border: 'none',
            borderRadius: 8, padding: '7px 16px',
            cursor: 'pointer', fontSize: 13, fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 6,
            marginBottom: 1,
          }}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> 新建知识库
        </button>
      </div>

      {/* ── Create Modal ── */}
      {showCreate && (
        <CreateRepoModal
          onClose={() => setShowCreate(false)}
          onCreate={repo => { onCreate(repo); setTab('mine'); }}
        />
      )}

      {/* ── Chat Tab 内容 ── */}
      {tab === 'chat' && (
        <div style={{ animation: 'fadeUp 0.3s ease' }}>
          <GlobalSearchBar onEnterRepo={onEnter} reposCount={repos.length} />
        </div>
      )}
      {tab === 'chat' && null /* 后续 return 提前退出 */}
      {tab !== 'chat' && (<>

      {/* ── Search + Filter ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 180 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.muted, display: 'flex' }}><Search size={13} /></span>
          <input
            className="kn-input"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索知识库名称、描述..."
            style={{
              width: '100%', boxSizing: 'border-box',
              background: inputBg, border: `1px solid ${C.border}`,
              borderRadius: 8, color: C.text, fontSize: 13,
              padding: '8px 12px 8px 32px', fontFamily: 'inherit',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
          />
        </div>

        {/* Category filter */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { key: 'all' as const, label: '全部分类' },
            { key: 'business' as const, label: '业务知识库' },
            { key: 'engineering' as const, label: '工程通识库' },
          ].map(({ key, label }) => (
            <button key={key} className="filter-chip"
              onClick={() => { setFilterCategory(key); setFilterType('all'); }}
              style={{
                background: filterCategory === key ? 'rgba(59,130,246,0.12)' : 'transparent',
                border: `1px solid ${filterCategory === key ? C.blue : C.border}`,
                borderRadius: 20, padding: '5px 12px',
                color: filterCategory === key ? blueLight : C.muted,
                cursor: 'pointer', fontSize: 12, fontWeight: filterCategory === key ? 700 : 400,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Type chips ── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        <button className="filter-chip"
          onClick={() => setFilterType('all')}
          style={{
            background: filterType === 'all' ? 'rgba(148,163,184,0.12)' : 'transparent',
            border: `1px solid ${filterType === 'all' ? C.muted : C.border}`,
            borderRadius: 20, padding: '4px 12px',
            color: filterType === 'all' ? C.text : C.muted,
            cursor: 'pointer', fontSize: 12, fontWeight: filterType === 'all' ? 700 : 400,
          }}
        >
          全部类型
        </button>
        {categoryTypes.map(t => (
          <button key={t.key} className="filter-chip"
            onClick={() => setFilterType(t.key)}
            style={{
              background: filterType === t.key ? `${t.color}15` : 'transparent',
              border: `1px solid ${filterType === t.key ? t.color : C.border}`,
              borderRadius: 20, padding: '4px 12px',
              color: filterType === t.key ? t.color : C.muted,
              cursor: 'pointer', fontSize: 12, fontWeight: filterType === t.key ? 700 : 400,
              display: 'inline-flex', alignItems: 'center', gap: 4,
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── Result count ── */}
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>
        共 <span style={{ color: C.text, fontWeight: 600 }}>{filtered.length}</span> 个知识库
      </div>

      {/* ── Repo Cards ── */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: C.muted, fontSize: 13 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
          没有找到匹配的知识库
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
          {filtered.map((repo, idx) => {
            const cfg = getTypeConfig(repo.typeKey);
            return (
              <div
                key={repo.id}
                className="kn-card"
                onClick={() => onEnter(repo)}
                style={{
                  background: C.card, border: `1px solid ${C.border}`,
                  borderRadius: C.radius, padding: '18px 20px',
                  cursor: 'pointer',
                  animation: `fadeUp 0.4s ease ${idx * 50}ms both`,
                }}
              >
                {/* Card header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 9,
                    background: `${cfg.color}18`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, flexShrink: 0,
                  }}>
                    {cfg.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {repo.name}
                    </div>
                    <TypeTag typeKey={repo.typeKey} />
                  </div>
                </div>

                {/* Desc */}
                <p style={{
                  margin: '0 0 14px', fontSize: 12, color: C.muted, lineHeight: 1.6,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>
                  {repo.desc}
                </p>

                {/* Meta */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                  <div style={{ display: 'flex', gap: 12, color: C.muted }}>
                    <span>{repo.ownerAvatar} {repo.owner}</span>
                    <span>📄 {repo.docCount}</span>
                    <span>👥 {repo.memberCount}</span>
                    {repo.prCount > 0 && (
                      <span style={{ color: C.orange }}>🔀 {repo.prCount} PR</span>
                    )}
                  </div>
                  <span style={{ color: C.border, fontSize: 11 }}>{repo.updatedAt}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>)}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────
const KnowledgePage: React.FC = () => {
  const C = useTheme();
  const [selectedRepo, setSelectedRepo] = useState<KnowledgeRepo | null>(null);
  const [repos, setRepos] = useState<KnowledgeRepo[]>(MOCK_REPOS);

  useEffect(() => {
    injectStyles(C);
  }, [C]);

  const handleCreateRepo = (repo: KnowledgeRepo) => {
    setRepos(prev => [repo, ...prev]);
  };

  const totalRepos = repos.length;
  const totalDocs = repos.reduce((s, r) => s + r.docCount, 0);
  const openPRs = repos.reduce((s, r) => s + r.prs.filter(p => p.status === 'open').length, 0);

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      {/* ── Page Header ── */}
      <div style={{
        padding: '40px 40px 0',
        background: 'linear-gradient(180deg, rgba(59,130,246,0.06) 0%, transparent 100%)',
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8, animation: 'fadeUp 0.5s ease both' }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'rgba(59,130,246,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Brain size={20} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.text }}>EvolveBase 知识库</h1>
              <p style={{ margin: 0, fontSize: 13, color: C.muted }}>沉淀业务与工程知识资产，让 AI 真正懂你的系统</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 32, marginBottom: 20, flexWrap: 'wrap', animation: 'fadeUp 0.5s ease 0.1s both' }}>
            {[
              { label: '知识库总数', value: totalRepos, color: C.blue },
              { label: '文档总数', value: totalDocs, color: C.green },
              { label: '待合并 PR', value: openPRs, color: C.orange },
              { label: '覆盖知识类型', value: KNOWLEDGE_TYPES.length, color: C.purple },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20, fontWeight: 800, color }}>{value}</span>
                <span style={{ fontSize: 12, color: C.muted }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ padding: '28px 40px 48px', maxWidth: 1100, margin: '0 auto' }}>
        {selectedRepo ? (
          <RepoDetail repo={selectedRepo} onBack={() => setSelectedRepo(null)} />
        ) : (
          <RepoList repos={repos} onEnter={setSelectedRepo} onCreate={handleCreateRepo} />
        )}
      </div>
    </div>
  );
};

export default KnowledgePage;
