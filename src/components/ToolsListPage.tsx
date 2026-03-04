import React, { useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Tool {
  name: string;
  icon: string;
  category: string;
  description: string;
  status: '推荐' | '试用中' | '评估中';
  note: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const internalTools: Tool[] = [
  { name: 'Speco',      icon: '🎯', category: '需求设计', description: 'AI驱动的需求分析和系统设计工具，自动生成PRD和技术方案', status: '推荐',  note: '适用：需求阶段' },
  { name: 'Muse',       icon: '🎨', category: '原型设计', description: '智能UI原型生成，支持D2C和交互稿自动生成',                 status: '推荐',  note: '适用：设计阶段' },
  { name: 'Maco',       icon: '⚙️', category: '后端开发', description: '后端代码生成Agent，支持Java/Python，深度集成内部框架',   status: '推荐',  note: '适用：开发阶段' },
  { name: 'Neo',        icon: '🖥️', category: '前端开发', description: '前端代码生成，支持React/Vue，集成内部组件库',             status: '推荐',  note: '适用：开发阶段' },
  { name: 'Dataflow',   icon: '📊', category: '数据开发', description: '数据管道和SQL生成，支持实时和离线任务',                   status: '试用中', note: '适用：数据阶段' },
  { name: 'DeepTest',   icon: '🧪', category: '自动测试', description: '测试用例自动生成和执行，覆盖单测/接口/UI测试',             status: '推荐',  note: '适用：测试阶段' },
  { name: '蜻蜓队长',   icon: '📋', category: '项目管理', description: 'AI项目管理助手，智能排期、风险识别、进度跟踪',             status: '试用中', note: '适用：项目管理' },
  { name: 'EvolveBase', icon: '🧠', category: '知识管理', description: '自主进化知识底座，沉淀业务知识和最佳实践',                 status: '推荐',  note: '适用：全流程' },
];

const externalTools: Tool[] = [
  { name: 'Claude Code',        icon: '🤖', category: 'AI编码',  description: 'Anthropic出品，代码生成能力强，适合复杂逻辑',   status: '推荐',  note: '需申请'   },
  { name: 'OpenCode',           icon: '💻', category: 'AI编码',  description: '开源终端AI编程助手，多模型支持',                 status: '推荐',  note: '免费'     },
  { name: 'Cursor',             icon: '✏️', category: 'IDE插件', description: 'AI原生代码编辑器，上下文理解强',                  status: '推荐',  note: '需采购'   },
  { name: 'GitHub Copilot',     icon: '🐙', category: '代码补全', description: 'GitHub出品，代码补全和对话',                    status: '评估中', note: '需采购'   },
  { name: 'Gemini Code Assist', icon: '🌟', category: '代码审查', description: 'Google出品，代码审查能力强',                    status: '试用中', note: '免费额度' },
  { name: 'Codex',              icon: '⚡', category: '自动化',  description: 'OpenAI出品，适合自动化任务和Agent编排',           status: '评估中', note: '需申请'   },
];

// ─── Style tokens ─────────────────────────────────────────────────────────────

const C = {
  bg:       '#0a0f1e',
  card:     '#1a2235',
  border:   '#1e2d45',
  text:     '#f1f5f9',
  muted:    '#94a3b8',
  blue:     '#3b82f6',
  green:    '#10b981',
  purple:   '#8b5cf6',
  orange:   '#f59e0b',
  red:      '#ef4444',
  radius:   '12px',
} as const;

const statusColor: Record<Tool['status'], string> = {
  '推荐':  C.green,
  '试用中': C.blue,
  '评估中': C.orange,
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const Badge: React.FC<{ status: Tool['status'] }> = ({ status }) => (
  <span style={{
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.03em',
    color: '#fff',
    backgroundColor: statusColor[status],
  }}>
    {status}
  </span>
);

const ToolCard: React.FC<{ tool: Tool }> = ({ tool }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: C.card,
        border: `1px solid ${hovered ? C.blue : C.border}`,
        borderRadius: C.radius,
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        boxShadow: hovered ? `0 0 0 1px ${C.blue}33, 0 4px 20px rgba(59,130,246,0.1)` : 'none',
        cursor: 'default',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '22px', lineHeight: 1 }}>{tool.icon}</span>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: C.text }}>{tool.name}</div>
            <div style={{ fontSize: '11px', color: C.muted, marginTop: '1px' }}>{tool.category}</div>
          </div>
        </div>
        <Badge status={tool.status} />
      </div>

      {/* Description */}
      <p style={{ fontSize: '13px', color: C.muted, lineHeight: 1.6, margin: 0, flexGrow: 1 }}>
        {tool.description}
      </p>

      {/* Footer note */}
      <div style={{
        fontSize: '11px',
        color: C.blue,
        backgroundColor: `${C.blue}15`,
        borderRadius: '6px',
        padding: '4px 10px',
        display: 'inline-block',
        alignSelf: 'flex-start',
      }}>
        {tool.note}
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const ToolsListPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'internal' | 'external'>('internal');

  const tools = activeTab === 'internal' ? internalTools : externalTools;

  return (
    <div style={{ backgroundColor: C.bg, minHeight: '100vh', padding: '32px 24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Page title */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: C.text, margin: 0 }}>AI 工具库</h1>
        <p style={{ fontSize: '14px', color: C.muted, marginTop: '6px' }}>探索和使用团队推荐的 AI 开发工具</p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '4px',
        backgroundColor: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: C.radius,
        padding: '4px',
        width: 'fit-content',
        marginBottom: '28px',
      }}>
        {(['internal', 'external'] as const).map((tab) => {
          const label = tab === 'internal' ? '内部工具' : '外部工具';
          const count = tab === 'internal' ? internalTools.length : externalTools.length;
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 20px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: active ? 600 : 400,
                color: active ? '#fff' : C.muted,
                backgroundColor: active ? C.blue : 'transparent',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {label}
              <span style={{
                fontSize: '11px',
                backgroundColor: active ? 'rgba(255,255,255,0.2)' : C.border,
                color: active ? '#fff' : C.muted,
                borderRadius: '10px',
                padding: '1px 7px',
                fontWeight: 500,
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Section label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
        <div style={{ width: '3px', height: '18px', backgroundColor: C.blue, borderRadius: '2px' }} />
        <span style={{ fontSize: '15px', fontWeight: 600, color: C.text }}>
          {activeTab === 'internal' ? '内部自研工具' : '外部商业工具'}
        </span>
        <span style={{ fontSize: '13px', color: C.muted }}>
          {activeTab === 'internal' ? '— 深度集成企业内部框架和规范' : '— 经过评估的外部 AI 编程工具'}
        </span>
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
      }}>
        {tools.map((tool) => (
          <ToolCard key={tool.name} tool={tool} />
        ))}
      </div>

      {/* Legend */}
      <div style={{
        marginTop: '32px',
        padding: '16px 20px',
        backgroundColor: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: C.radius,
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
        flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: '13px', color: C.muted, fontWeight: 500 }}>状态说明：</span>
        {(['推荐', '试用中', '评估中'] as const).map((s) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              width: '8px', height: '8px', borderRadius: '50%',
              backgroundColor: statusColor[s], display: 'inline-block',
            }} />
            <span style={{ fontSize: '13px', color: C.muted }}>{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ToolsListPage;
