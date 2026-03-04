import React, { useState, useEffect } from 'react';

// ─── Design Tokens ───────────────────────────────────────────────
const C = {
  bg: '#0a0f1e',
  card: '#1a2235',
  cardHover: '#1e2a40',
  border: '#1e2d45',
  borderHover: '#2d4060',
  input: '#111827',
  text: '#f1f5f9',
  muted: '#94a3b8',
  blue: '#3b82f6',
  blueLight: '#60a5fa',
  green: '#10b981',
  greenLight: '#34d399',
  purple: '#8b5cf6',
  purpleLight: '#a78bfa',
  orange: '#f59e0b',
  red: '#ef4444',
  cyan: '#06b6d4',
  pink: '#ec4899',
  radius: '12px',
  radiusSm: '8px',
};

// ─── Style injection ──────────────────────────────────────────────
const injectStyles = () => {
  if (document.getElementById('knowledge-styles')) return;
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
    .kn-input:focus { outline: none; border-color: ${C.blue} !important; box-shadow: 0 0 0 3px rgba(59,130,246,0.15) !important; }
    .kn-card:hover { background: ${C.cardHover} !important; border-color: ${C.borderHover} !important; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.3); }
    .kn-card { transition: background 0.15s, border-color 0.15s, transform 0.2s, box-shadow 0.2s; }
    .kn-tree-item:hover { background: rgba(59,130,246,0.08) !important; }
    .kn-tree-item { transition: background 0.12s; }
    .kn-pr-row:hover { background: ${C.cardHover} !important; }
    .kn-pr-row { transition: background 0.12s; }
    .filter-chip:hover { border-color: ${C.blue} !important; color: ${C.text} !important; }
    .filter-chip { transition: border-color 0.15s, color 0.15s, background 0.15s; }
  `;
  document.head.appendChild(style);
};

// ─── Types ────────────────────────────────────────────────────────
type KnowledgeCategory = 'business' | 'engineering';

interface KnowledgeTypeConfig {
  key: string;
  label: string;
  category: KnowledgeCategory;
  color: string;
  icon: string;
  desc: string;
}

const KNOWLEDGE_TYPES: KnowledgeTypeConfig[] = [
  // 业务知识库
  { key: '业务知识', label: '业务知识', category: 'business', color: C.blue, icon: '💼', desc: 'PD 维护 · 业务概念/规则/产品文档' },
  { key: '项目知识', label: '项目知识', category: 'business', color: C.cyan, icon: '📋', desc: 'PM 维护 · 项目背景/人员/文档空间' },
  { key: '架构知识', label: '架构知识', category: 'business', color: C.purple, icon: '🏗️', desc: '架构师维护 · 架构域/规范/稳定性/安全' },
  { key: '系统知识', label: '系统知识', category: 'business', color: C.green, icon: '⚙️', desc: '系统 Owner 维护 · 核心系统/API/代码模板' },
  // 工程通识库
  { key: '后端通识', label: '后端通识', category: 'engineering', color: C.orange, icon: '🖥️', desc: '后端技术栈/中间件' },
  { key: '前端通识', label: '前端通识', category: 'engineering', color: C.pink, icon: '🎨', desc: '前端技术栈/组件库' },
  { key: '质量通识', label: '质量通识', category: 'engineering', color: C.green, icon: '✅', desc: '质量规范/卡点/工具' },
  { key: '数据通识', label: '数据通识', category: 'engineering', color: C.cyan, icon: '📊', desc: '数据规范/数据研发' },
  { key: '项管通识', label: '项管通识', category: 'engineering', color: C.purple, icon: '📌', desc: '项管流程/产研规范' },
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
}

// ─── Mock Data ────────────────────────────────────────────────────
const MOCK_REPOS: KnowledgeRepo[] = [
  {
    id: 1, name: '交易核心架构知识库', typeKey: '架构知识',
    desc: '交易域核心架构规范、稳定性设计、安全合规要求',
    owner: 'zhangwei', ownerAvatar: '👨‍💻', memberCount: 12, updatedAt: '2分钟前',
    docCount: 47, prCount: 3, isMine: true,
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
      {cfg.icon} {cfg.label}
    </span>
  );
};

const RoleBadge: React.FC<{ role: MemberRole }> = ({ role }) => {
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
          <span>📁</span>
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
        color: isSelected ? C.blueLight : C.muted,
        fontSize: 13,
        borderLeft: isSelected ? `2px solid ${C.blue}` : '2px solid transparent',
      }}
    >
      <span>📄</span>
      <span style={{ fontWeight: isSelected ? 600 : 400 }}>{node.name}</span>
    </div>
  );
};

// ─── Markdown Renderer (simple) ───────────────────────────────────
const MarkdownView: React.FC<{ content: string }> = ({ content }) => {
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
          background: '#0d1117', border: `1px solid ${C.border}`, borderRadius: 8,
          padding: '14px 16px', fontSize: 12, color: '#e6edf3', overflowX: 'auto',
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
      elements.push(<h3 key={i} style={{ fontSize: 14, fontWeight: 700, color: C.blueLight, margin: '16px 0 8px' }}>{line.slice(4)}</h3>);
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
        .replace(/`([^`]+)`/g, `<code style="background:#1e2d45;color:${C.blueLight};padding:1px 5px;border-radius:4px;font-family:monospace;font-size:12px">$1</code>`)
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

// ─── Detail Page ──────────────────────────────────────────────────
type DetailTab = 'docs' | 'prs' | 'members';

const RepoDetail: React.FC<{ repo: KnowledgeRepo; onBack: () => void }> = ({ repo, onBack }) => {
  const [activeTab, setActiveTab] = useState<DetailTab>('docs');
  const [selectedFile, setSelectedFile] = useState<string | null>('README.md');
  const [selectedContent, setSelectedContent] = useState<string>(
    repo.tree.find(n => n.name === 'README.md')?.content ?? ''
  );
  const [expandedPR, setExpandedPR] = useState<number | null>(null);
  const typeConfig = getTypeConfig(repo.typeKey);

  const handleFileSelect = (name: string, content: string) => {
    setSelectedFile(name);
    setSelectedContent(content);
  };

  const tabs: { key: DetailTab; label: string; count?: number }[] = [
    { key: 'docs', label: '📄 文档' },
    { key: 'prs', label: `🔀 PR`, count: repo.prs.filter(p => p.status === 'open').length },
    { key: 'members', label: '👥 成员', count: repo.members.length },
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
                color: active ? C.blueLight : C.muted,
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
          {repo.prs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: C.muted, fontSize: 13 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
              暂无 PR，知识库已是最新状态
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {repo.prs.map((pr) => (
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
                      background: '#0d1117', border: `1px solid ${C.blue}`,
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
    </div>
  );
};

// ─── List Page ────────────────────────────────────────────────────
const RepoList: React.FC<{ onEnter: (repo: KnowledgeRepo) => void }> = ({ onEnter }) => {
  const [tab, setTab] = useState<'mine' | 'all'>('mine');
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | KnowledgeCategory>('all');
  const [filterType, setFilterType] = useState<string>('all');

  const baseRepos = tab === 'mine' ? MOCK_REPOS.filter(r => r.isMine) : MOCK_REPOS;
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

  return (
    <div style={{ animation: 'fadeUp 0.4s ease' }}>
      {/* ── My / All Tab ── */}
      <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${C.border}`, marginBottom: 20 }}>
        {[{ key: 'mine' as const, label: '我的知识库', count: MOCK_REPOS.filter(r => r.isMine).length },
          { key: 'all' as const,  label: '全部知识库', count: MOCK_REPOS.length }].map(({ key, label, count }) => {
          const active = tab === key;
          return (
            <button key={key} className="kn-tab" onClick={() => { setTab(key); setFilterType('all'); setFilterCategory('all'); }}
              style={{
                background: 'transparent', border: 'none',
                borderBottom: `2px solid ${active ? C.blue : 'transparent'}`,
                padding: '10px 20px', color: active ? C.blueLight : C.muted,
                cursor: 'pointer', fontSize: 14, fontWeight: active ? 700 : 400,
                transition: 'color 0.15s, border-color 0.15s',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              {label}
              <span style={{
                fontSize: 11, fontWeight: 700,
                background: active ? C.blue : C.border,
                color: active ? '#fff' : C.muted,
                borderRadius: 10, padding: '1px 6px',
              }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* ── Search + Filter ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 180 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: C.muted }}>🔍</span>
          <input
            className="kn-input"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索知识库名称、描述..."
            style={{
              width: '100%', boxSizing: 'border-box',
              background: C.input, border: `1px solid ${C.border}`,
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
                color: filterCategory === key ? C.blueLight : C.muted,
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
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────
const KnowledgePage: React.FC = () => {
  const [selectedRepo, setSelectedRepo] = useState<KnowledgeRepo | null>(null);

  useEffect(() => {
    injectStyles();
  }, []);

  const totalRepos = MOCK_REPOS.length;
  const totalDocs = MOCK_REPOS.reduce((s, r) => s + r.docCount, 0);
  const openPRs = MOCK_REPOS.reduce((s, r) => s + r.prs.filter(p => p.status === 'open').length, 0);

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
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
            }}>
              🧠
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
          <RepoList onEnter={setSelectedRepo} />
        )}
      </div>
    </div>
  );
};

export default KnowledgePage;
