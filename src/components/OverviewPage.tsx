import React, { useState, useEffect } from 'react';

// ─── Design Tokens ───────────────────────────────────────────────
const C = {
  bg: '#0a0f1e',
  card: '#1a2235',
  cardHover: '#1e2a40',
  border: '#1e2d45',
  borderHover: '#2d4060',
  text: '#f1f5f9',
  muted: '#94a3b8',
  blue: '#3b82f6',
  blueLight: '#60a5fa',
  green: '#10b981',
  greenLight: '#34d399',
  purple: '#8b5cf6',
  purpleLight: '#a78bfa',
  orange: '#f59e0b',
  radius: '12px',
  radiusSm: '8px',
};

// ─── Keyframe injection ───────────────────────────────────────────
const injectStyles = () => {
  if (document.getElementById('overview-styles')) return;
  const style = document.createElement('style');
  style.id = 'overview-styles';
  style.textContent = `
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(24px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes pulse-ring {
      0%, 100% { box-shadow: 0 0 0 0 rgba(59,130,246,0.4); }
      50%       { box-shadow: 0 0 0 8px rgba(59,130,246,0); }
    }
    @keyframes shimmer {
      0%   { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    @keyframes shimmer-bg {
      0%   { background-position: -400% center; }
      100% { background-position: 400% center; }
    }
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50%       { transform: translateY(-8px); }
    }
    .overview-card:hover { background: ${C.cardHover} !important; border-color: ${C.borderHover} !important; transform: translateY(-2px); }
    .overview-card { transition: background 0.2s, border-color 0.2s, transform 0.2s; }
    .arch-card:hover { border-color: var(--arch-color) !important; box-shadow: 0 0 24px var(--arch-glow) !important; transform: translateY(-3px); }
    .arch-card { transition: border-color 0.3s, box-shadow 0.3s, transform 0.3s; }
    .level-card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,0.4) !important; }
    .level-card { transition: transform 0.25s, box-shadow 0.25s; }
    .feature-card:hover { border-color: var(--fc-color) !important; box-shadow: 0 0 20px var(--fc-glow) !important; transform: translateY(-3px); }
    .feature-card { transition: border-color 0.25s, box-shadow 0.25s, transform 0.25s; }
    .shimmer-text {
      background: linear-gradient(90deg, ${C.blue} 0%, ${C.purple} 35%, ${C.blueLight} 50%, ${C.purple} 65%, ${C.blue} 100%);
      background-size: 200% auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: shimmer 4s linear infinite;
    }
    .hero-badge-glow {
      animation: pulse-ring 2s ease-in-out infinite;
    }
    .topnav-btn {
      background: transparent;
      border: none;
      cursor: pointer;
      transition: color 0.15s, background 0.15s;
      white-space: nowrap;
    }
    .topnav-btn:hover { background: rgba(255,255,255,0.06) !important; color: #cbd5e1 !important; }
    .topnav-btn.active { color: #60a5fa !important; background: rgba(59,130,246,0.12) !important; }
    @media (max-width: 900px) {
      .arch-grid { grid-template-columns: 1fr !important; }
      .level-grid { grid-template-columns: 1fr !important; }
      .features-grid { grid-template-columns: 1fr 1fr !important; }
      .topnav-inner { gap: 4px !important; }
      .topnav-btn { font-size: 12px !important; padding: 6px 10px !important; }
    }
    @media (max-width: 600px) {
      .features-grid { grid-template-columns: 1fr !important; }
      .hero-title { font-size: 32px !important; }
      .hero-sub { font-size: 15px !important; }
      .topnav-inner { overflow-x: auto; padding-bottom: 2px; }
    }
  `;
  document.head.appendChild(style);
};

// ─── Sub-components ───────────────────────────────────────────────

const SectionTitle: React.FC<{ children: React.ReactNode; accent?: string }> = ({ children, accent = C.blue }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
    <div style={{ width: 4, height: 24, background: accent, borderRadius: 2, flexShrink: 0 }} />
    <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: C.text, letterSpacing: '-0.3px' }}>{children}</h2>
  </div>
);

// ─── Top Navigation Bar ───────────────────────────────────────────
const NAV_ITEMS = [
  { icon: '🗺️', label: '整体方案' },
  { icon: '🧠', label: '知识管理' },
  { icon: '⚡', label: '研发流程' },
  { icon: '📊', label: '效能大盘' },
  { icon: '🛠️', label: '工具列表' },
  { icon: '📋', label: '使用规范' },
];

interface TopNavProps {
  onNavigate: (index: number) => void;
  currentIndex?: number;
}
const TopNav: React.FC<TopNavProps> = ({ onNavigate, currentIndex = 0 }) => (
  <div style={{
    position: 'sticky',
    top: 0,
    zIndex: 200,
    background: 'rgba(10,15,30,0.92)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderBottom: `1px solid ${C.border}`,
  }}>
    <div
      className="topnav-inner"
      style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '0 40px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        height: 56,
      }}
    >
      {/* Brand */}
      <div style={{ marginRight: 20, flexShrink: 0 }}>
        <span style={{
          fontSize: 14,
          fontWeight: 800,
          letterSpacing: '0.05em',
          background: `linear-gradient(90deg, ${C.blue}, ${C.purple})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          AI Delivery
        </span>
      </div>

      {/* Nav buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
        {NAV_ITEMS.map((item, i) => {
          const isActive = i === currentIndex;
          return (
            <button
              key={item.label}
              className={`topnav-btn${isActive ? ' active' : ''}`}
              onClick={() => onNavigate(i)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? C.blueLight : C.muted,
                background: isActive ? 'rgba(59,130,246,0.12)' : 'transparent',
                position: 'relative',
              }}
            >
              <span style={{ fontSize: 14 }}>{item.icon}</span>
              <span>{item.label}</span>
              {isActive && (
                <span style={{
                  position: 'absolute',
                  bottom: -1,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '60%',
                  height: 2,
                  background: C.blue,
                  borderRadius: 1,
                }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  </div>
);

// ─── Feature Card ─────────────────────────────────────────────────
interface FeatureCardProps {
  icon: string;
  title: string;
  desc: string;
  color: string;
  glow: string;
  index: number;
}
const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, desc, color, glow, index }) => (
  <div
    className="feature-card"
    style={{ '--fc-color': color, '--fc-glow': glow } as React.CSSProperties & Record<string, string>}
  >
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: C.radius,
        padding: '24px',
        animation: `fadeUp 0.6s ease both`,
        animationDelay: `${index * 80}ms`,
        height: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: `${color}18`,
        border: `1px solid ${color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22, marginBottom: 16,
      }}>
        {icon}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 8 }}>{title}</div>
      <p style={{ margin: 0, fontSize: 13, color: C.muted, lineHeight: 1.65 }}>{desc}</p>
      <div style={{
        marginTop: 16, height: 2, borderRadius: 1,
        background: `linear-gradient(90deg, ${color}, transparent)`,
        opacity: 0.5,
      }} />
    </div>
  </div>
);

// ─── Arch Card ────────────────────────────────────────────────────
interface ArchCardProps {
  layer: string;
  name: string;
  desc: string;
  bullets: string[];
  color: string;
  glow: string;
  icon: string;
  index: number;
}
const ArchCard: React.FC<ArchCardProps> = ({ layer, name, desc, bullets, color, glow, icon, index }) => (
  <div
    className="arch-card"
    style={{ '--arch-color': color, '--arch-glow': glow } as React.CSSProperties & Record<string, string>}
  >
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: C.radius,
        padding: '28px 24px',
        animation: `fadeUp 0.6s ease both`,
        animationDelay: `${index * 120}ms`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
          {icon}
        </div>
        <div>
          <div style={{ fontSize: 11, color, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 2 }}>{layer}</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: C.text }}>{name}</div>
        </div>
      </div>
      <p style={{ margin: '0 0 16px', fontSize: 14, color: C.muted, lineHeight: 1.6 }}>{desc}</p>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {bullets.map((b, i) => (
          <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: C.muted }}>
            <span style={{ color, marginTop: 1, flexShrink: 0 }}>▸</span>
            {b}
          </li>
        ))}
      </ul>
    </div>
  </div>
);

// ─── Level Card ───────────────────────────────────────────────────
interface LevelCardProps {
  level: string;
  title: string;
  subtitle: string;
  criteria: string;
  color: string;
  bg: string;
  features: string[];
  index: number;
}
const LevelCard: React.FC<LevelCardProps> = ({ level, title, subtitle, criteria, color, bg, features, index }) => (
  <div
    className="level-card"
    style={{
      background: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: C.radius,
      padding: '24px',
      animation: `fadeUp 0.6s ease both`,
      animationDelay: `${index * 100}ms`,
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, background: bg, borderRadius: '0 12px 0 80px', opacity: 0.6 }} />
    <div style={{ position: 'relative', zIndex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: C.bg, background: color, borderRadius: 6, padding: '3px 10px', letterSpacing: '0.5px' }}>{level}</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{title}</span>
      </div>
      <p style={{ margin: '0 0 6px', fontSize: 13, color: C.muted }}>{subtitle}</p>
      <div style={{ marginBottom: 14, fontSize: 12, color, background: `${color}15`, borderRadius: 6, padding: '6px 10px', fontWeight: 600 }}>
        📊 {criteria}
      </div>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {features.map((f, i) => (
          <li key={i} style={{ fontSize: 12, color: C.muted, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0, display: 'inline-block' }} />
            {f}
          </li>
        ))}
      </ul>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────

interface OverviewPageProps {
  onNavigate?: (index: number) => void;
}

const OverviewPage: React.FC<OverviewPageProps> = ({ onNavigate }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    injectStyles();
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  const handleNavigate = (index: number) => {
    if (onNavigate) onNavigate(index);
  };

  const features: FeatureCardProps[] = [
    {
      icon: '🤖',
      title: '多 Agent 并行',
      desc: 'Codex / Claude / Gemini 协同工作，任务自动分配给最合适的模型，并行执行提升交付速度。',
      color: C.blue,
      glow: 'rgba(59,130,246,0.15)',
      index: 0,
    },
    {
      icon: '🔄',
      title: 'Ralph Loop V2',
      desc: '失败自动分析根因，用更智能的 prompt 策略重试，持续学习让成功率越来越高。',
      color: C.green,
      glow: 'rgba(16,185,129,0.15)',
      index: 1,
    },
    {
      icon: '📋',
      title: '全流程追踪',
      desc: '从需求到 PR，每个节点可视化呈现。任务链路清晰，随时掌握交付进度与质量状态。',
      color: C.purple,
      glow: 'rgba(139,92,246,0.15)',
      index: 2,
    },
    {
      icon: '🧠',
      title: '知识沉淀',
      desc: '每次交付自动提炼团队知识，积累业务领域资产，让 AI 越用越懂你的项目。',
      color: C.orange,
      glow: 'rgba(245,158,11,0.15)',
      index: 3,
    },
    {
      icon: '📊',
      title: '效能度量',
      desc: '个人和团队双视角效能大盘，AI 贡献度、交付质量、研发速度一目了然。',
      color: C.blueLight,
      glow: 'rgba(96,165,250,0.15)',
      index: 4,
    },
    {
      icon: '🛡️',
      title: '评审卡点',
      desc: '4 个关键节点设置评审门禁，AI 辅助人工判断，在速度与质量之间找到最优平衡。',
      color: C.greenLight,
      glow: 'rgba(52,211,153,0.15)',
      index: 5,
    },
  ];

  const archLayers: ArchCardProps[] = [
    {
      layer: 'Layer 1',
      name: 'EvolveBase',
      desc: '知识底座层 — 让 AI 懂业务，沉淀支付宝特色知识资产',
      bullets: [
        '结构化沉淀业务领域知识、架构决策、工程规范',
        '支持多模态知识入库：文档、代码、设计稿、会议纪要',
        '知识图谱自动构建，实体关联与语义检索',
        '持续校准机制，确保知识准确性与时效性',
      ],
      color: C.blue,
      glow: 'rgba(59,130,246,0.15)',
      icon: '🧠',
      index: 0,
    },
    {
      layer: 'Layer 2',
      name: 'Agents',
      desc: '技能沉淀层 — 让 AI 有能力，覆盖研发全流程的 Agent 能力',
      bullets: [
        '需求分析 Agent：自动拆解 PRD，生成技术方案',
        '编码 Agent：代码生成、补全、重构、Review',
        '测试 Agent：用例生成、自动化执行、缺陷定位',
        '运维 Agent：告警分析、故障诊断、变更评估',
      ],
      color: C.green,
      glow: 'rgba(16,185,129,0.15)',
      icon: '🤖',
      index: 1,
    },
    {
      layer: 'Layer 3',
      name: 'Orchestration',
      desc: '编排层 — 让 AI 能协作，重构人机协同工作流',
      bullets: [
        '多 Agent 协同编排，复杂任务自动分解与调度',
        '人机协同决策节点，关键环节人工审核介入',
        '全流程可观测，任务链路追踪与质量度量',
        '与研发效能平台深度集成，无缝嵌入现有工作流',
      ],
      color: C.purple,
      glow: 'rgba(139,92,246,0.15)',
      icon: '🔗',
      index: 2,
    },
  ];

  const levels: LevelCardProps[] = [
    {
      level: 'L1',
      title: 'AI Coding',
      subtitle: 'AI 辅助编码',
      criteria: 'AI 代码采纳率 > 60%',
      color: C.blue,
      bg: 'rgba(59,130,246,0.08)',
      features: ['代码补全与生成', '智能 Code Review', '单元测试自动生成', '文档自动撰写'],
      index: 0,
    },
    {
      level: 'L2',
      title: 'AI Developing',
      subtitle: 'AI 协同开发',
      criteria: '50%+ 核心研发活动 AI 化',
      color: C.green,
      bg: 'rgba(16,185,129,0.08)',
      features: ['需求到代码自动化', '架构设计辅助', '联调测试 AI 驱动', '性能优化建议'],
      index: 1,
    },
    {
      level: 'L3',
      title: 'AI Engineering',
      subtitle: 'AI 自主交付',
      criteria: '100% 核心研发活动 AI 化',
      color: C.purple,
      bg: 'rgba(139,92,246,0.08)',
      features: ['端到端自主交付', '多 Agent 协同研发', '自适应架构演进', '智能风险管控'],
      index: 2,
    },
  ];

  if (!visible) return null;

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* ── Top Navigation Bar ───────────────────────────────────── */}
      <TopNav onNavigate={handleNavigate} currentIndex={0} />

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <div
        style={{
          padding: '96px 40px 80px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background radial glow */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `
            radial-gradient(ellipse 70% 60% at 50% 0%, rgba(59,130,246,0.15) 0%, transparent 60%),
            radial-gradient(ellipse 40% 40% at 20% 80%, rgba(139,92,246,0.08) 0%, transparent 50%),
            radial-gradient(ellipse 40% 40% at 80% 80%, rgba(16,185,129,0.06) 0%, transparent 50%)
          `,
        }} />
        {/* Decorative grid */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: `linear-gradient(${C.border} 1px, transparent 1px), linear-gradient(90deg, ${C.border} 1px, transparent 1px)`,
          backgroundSize: '60px 60px', opacity: 0.25,
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(59,130,246,0.1)',
            border: `1px solid rgba(59,130,246,0.28)`,
            borderRadius: 20, padding: '6px 18px', marginBottom: 28,
            fontSize: 12, color: C.blueLight, fontWeight: 600, letterSpacing: '0.5px',
            animation: 'fadeUp 0.5s ease both',
          }}>
            <span
              className="hero-badge-glow"
              style={{ width: 7, height: 7, borderRadius: '50%', background: C.green, display: 'inline-block' }}
            />
            AI-Native 研发效能平台
          </div>

          {/* Main title with shimmer */}
          <h1
            className="hero-title shimmer-text"
            style={{
              fontSize: 56,
              fontWeight: 900,
              margin: '0 0 20px',
              lineHeight: 1.1,
              letterSpacing: '-1.5px',
              animation: 'fadeUp 0.6s ease 0.08s both',
            }}
          >
            AI Delivery
          </h1>

          {/* Subtitle */}
          <p
            className="hero-sub"
            style={{
              fontSize: 20,
              color: C.muted,
              margin: '0 auto 16px',
              maxWidth: 520,
              lineHeight: 1.6,
              animation: 'fadeUp 0.6s ease 0.16s both',
            }}
          >
            让 AI 完成从需求到交付的全流程
          </p>

          {/* Secondary desc */}
          <p style={{
            fontSize: 14, color: '#475569', margin: '0 auto 40px', maxWidth: 480,
            lineHeight: 1.7, animation: 'fadeUp 0.6s ease 0.22s both',
          }}>
            多 Agent 协同 · 全流程追踪 · 知识持续沉淀 · 效能智能度量
          </p>

          {/* CTA buttons */}
          <div style={{
            display: 'flex', justifyContent: 'center', gap: 12,
            animation: 'fadeUp 0.6s ease 0.3s both',
            flexWrap: 'wrap',
          }}>
            <button
              onClick={() => handleNavigate(2)}
              style={{
                padding: '12px 28px',
                borderRadius: 10,
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 700,
                background: `linear-gradient(135deg, ${C.blue}, ${C.purple})`,
                color: '#fff',
                letterSpacing: '0.3px',
                boxShadow: '0 4px 20px rgba(59,130,246,0.35)',
                transition: 'opacity 0.15s, transform 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.88'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}
            >
              查看研发流程 →
            </button>
            <button
              onClick={() => handleNavigate(1)}
              style={{
                padding: '12px 28px',
                borderRadius: 10,
                border: `1px solid ${C.border}`,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600,
                background: 'rgba(255,255,255,0.04)',
                color: C.muted,
                letterSpacing: '0.3px',
                transition: 'border-color 0.15s, color 0.15s, background 0.15s',
              }}
              onMouseEnter={e => {
                const btn = e.currentTarget as HTMLButtonElement;
                btn.style.borderColor = C.borderHover;
                btn.style.color = C.text;
                btn.style.background = 'rgba(255,255,255,0.08)';
              }}
              onMouseLeave={e => {
                const btn = e.currentTarget as HTMLButtonElement;
                btn.style.borderColor = C.border;
                btn.style.color = C.muted;
                btn.style.background = 'rgba(255,255,255,0.04)';
              }}
            >
              知识管理体系
            </button>
          </div>

          {/* Stats row */}
          <div style={{
            display: 'flex', justifyContent: 'center', gap: 48, marginTop: 56,
            flexWrap: 'wrap', animation: 'fadeUp 0.6s ease 0.38s both',
          }}>
            {[
              { label: '目标 AI 代码占比', value: '60%', color: C.blue },
              { label: '标杆业务', value: '5 个', color: C.green },
              { label: '超级个体', value: '100 人', color: C.purple },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: '0 40px 80px', maxWidth: 1200, margin: '0 auto' }}>

        {/* ── Feature Cards ─────────────────────────────────────── */}
        <section style={{ marginBottom: 64 }}>
          <SectionTitle accent={C.blue}>✨ 产品特性</SectionTitle>
          <div
            className="features-grid"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}
          >
            {features.map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </section>

        {/* ── Architecture ─────────────────────────────────────── */}
        <section style={{ marginBottom: 64 }}>
          <SectionTitle accent={C.green}>🏗️ 三层架构体系</SectionTitle>
          {/* Layer connection visual */}
          <div style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: C.radius,
            padding: '16px 24px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0,
            animation: 'fadeUp 0.5s ease both',
            overflow: 'hidden',
          }}>
            {[
              { label: 'EvolveBase', sublabel: '知识底座', color: C.blue },
              { label: 'Agents', sublabel: '技能沉淀', color: C.green },
              { label: 'Orchestration', sublabel: '协同编排', color: C.purple },
            ].map(({ label, sublabel, color }, i) => (
              <React.Fragment key={label}>
                <div style={{ textAlign: 'center', padding: '8px 20px' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color }}>{label}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{sublabel}</div>
                </div>
                {i < 2 && (
                  <div style={{ color: C.muted, fontSize: 18, opacity: 0.4, padding: '0 4px' }}>→</div>
                )}
              </React.Fragment>
            ))}
          </div>
          <div
            className="arch-grid"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}
          >
            {archLayers.map((a) => (
              <ArchCard key={a.name} {...a} />
            ))}
          </div>
        </section>

        {/* ── Maturity Levels ──────────────────────────────────── */}
        <section style={{ marginBottom: 8 }}>
          <SectionTitle accent={C.purple}>📈 成熟度模型</SectionTitle>
          {/* Progress bar visual */}
          <div style={{
            background: C.card, border: `1px solid ${C.border}`, borderRadius: C.radius,
            padding: '20px 24px', marginBottom: 20,
            animation: 'fadeUp 0.6s ease both',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, position: 'relative' }}>
              {[
                { label: 'L1 AI Coding', color: C.blue },
                { label: 'L2 AI Developing', color: C.green },
                { label: 'L3 AI Engineering', color: C.purple },
              ].map(({ label, color }, i) => (
                <div key={label} style={{ flex: 1, position: 'relative' }}>
                  <div style={{
                    height: 8, background: `${color}30`,
                    borderRadius: i === 0 ? '4px 0 0 4px' : i === 2 ? '0 4px 4px 0' : 0,
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%', width: '100%', background: color,
                      borderRadius: 'inherit',
                    }} />
                  </div>
                  <div style={{ fontSize: 11, color, marginTop: 6, fontWeight: 600, textAlign: 'center' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
          <div
            className="level-grid"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}
          >
            {levels.map((l) => (
              <LevelCard key={l.level} {...l} />
            ))}
          </div>
        </section>

      </div>
    </div>
  );
};

export default OverviewPage;
