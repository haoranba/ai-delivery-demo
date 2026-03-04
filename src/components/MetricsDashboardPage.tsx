import React, { useState } from 'react';
import { Bot, Zap, Package, GitMerge, Clock, UserCheck, BarChart2, Users, Trophy, Code2, FileText, GitPullRequest, TestTube2 } from 'lucide-react';
import { useTheme } from '../ThemeContext';

// ─── Types ────────────────────────────────────────────────────────────────────
type Period = '本周' | '本月' | '本季度';
type ViewMode = 'personal' | 'team';

interface MetricCard {
  label: string;
  value: string;
  trend?: { text: string; positive: boolean };
  progress?: { current: number; total: number; label: string };
  target: string;
  color: string;
  icon: React.ReactElement;
}

interface TeamMember {
  name: string;
  avatar: string;
  role: string;
  aiRatio: string;
  cycle: string;
  prs: string;
  level: 'L1' | 'L2' | 'L3';
  trend: string;
  trendUp: boolean;
}

interface TeamData {
  id: string;
  name: string;
  aiRatio: string;
  cycle: string;
  superIndividuals: string;
  level: 'L1' | 'L2' | 'L3';
  members: TeamMember[];
  metrics: MetricCard[];
  trendData: number[];
}

// ─── Static data (no color references) ────────────────────────────────────────
const PERSONAL_TREND_DATA = [38, 43, 47, 52, 55, 57, 59, 61];
const PERSONAL_ACTIVITY = [
  { date: '03-04', event: '完成需求「红包活动」AI 辅助编码', type: 'code', ai: true },
  { date: '03-03', event: '通过需求评审，AI 生成 PRD 草稿', type: 'doc', ai: true },
  { date: '03-02', event: '合并 PR #142 — 风控接口改造', type: 'pr', ai: false },
  { date: '03-01', event: 'Cursor 辅助完成接口联调，节省 2h', type: 'code', ai: true },
  { date: '02-28', event: '完成测试用例 AI 生成，覆盖率 91%', type: 'test', ai: true },
  { date: '02-27', event: '参与方案评审，AI 生成架构图', type: 'doc', ai: true },
];

const ALL_TEAMS_STATIC = [
  {
    id: 'logistics',
    name: '物流团队',
    aiRatio: '58%',
    cycle: '6.2天',
    superIndividuals: '5人',
    level: 'L2' as const,
    trendData: [40, 44, 47, 50, 53, 55, 57, 58],
    members: [
      { name: '张明', avatar: '👨‍💻', role: '高级工程师', aiRatio: '71%', cycle: '4.8天', prs: '12', level: 'L3' as const, trend: '↑8%', trendUp: true },
      { name: '李雯', avatar: '👩‍💻', role: '工程师', aiRatio: '64%', cycle: '5.5天', prs: '9', level: 'L2' as const, trend: '↑12%', trendUp: true },
      { name: '王磊', avatar: '👨‍💻', role: '工程师', aiRatio: '58%', cycle: '6.1天', prs: '8', level: 'L2' as const, trend: '↑5%', trendUp: true },
      { name: '赵芳', avatar: '👩‍💻', role: '初级工程师', aiRatio: '41%', cycle: '8.2天', prs: '5', level: 'L1' as const, trend: '↑18%', trendUp: true },
    ],
  },
  {
    id: 'life',
    name: '生活服务',
    aiRatio: '51%',
    cycle: '7.1天',
    superIndividuals: '4人',
    level: 'L2' as const,
    trendData: [32, 36, 39, 42, 45, 47, 49, 51],
    members: [
      { name: '陈浩', avatar: '👨‍💻', role: '高级工程师', aiRatio: '68%', cycle: '5.2天', prs: '11', level: 'L2' as const, trend: '↑14%', trendUp: true },
      { name: '刘静', avatar: '👩‍💻', role: '工程师', aiRatio: '55%', cycle: '6.8天', prs: '8', level: 'L2' as const, trend: '↑9%', trendUp: true },
      { name: '孙伟', avatar: '👨‍💻', role: '工程师', aiRatio: '48%', cycle: '7.5天', prs: '7', level: 'L1' as const, trend: '↑7%', trendUp: true },
      { name: '周丽', avatar: '👩‍💻', role: '初级工程师', aiRatio: '33%', cycle: '9.8天', prs: '4', level: 'L1' as const, trend: '↑21%', trendUp: true },
    ],
  },
  {
    id: 'growth',
    name: '用增团队',
    aiRatio: '47%',
    cycle: '8.5天',
    superIndividuals: '3人',
    level: 'L1' as const,
    trendData: [28, 31, 34, 37, 39, 42, 45, 47],
    members: [
      { name: '吴鹏', avatar: '👨‍💻', role: '高级工程师', aiRatio: '62%', cycle: '6.1天', prs: '10', level: 'L2' as const, trend: '↑11%', trendUp: true },
      { name: '郑婷', avatar: '👩‍💻', role: '工程师', aiRatio: '49%', cycle: '8.0天', prs: '7', level: 'L1' as const, trend: '↑8%', trendUp: true },
      { name: '冯强', avatar: '👨‍💻', role: '工程师', aiRatio: '38%', cycle: '10.2天', prs: '5', level: 'L1' as const, trend: '↑15%', trendUp: true },
    ],
  },
  {
    id: 'member',
    name: '会员团队',
    aiRatio: '43%',
    cycle: '9.2天',
    superIndividuals: '2人',
    level: 'L1' as const,
    trendData: [25, 28, 31, 34, 37, 39, 41, 43],
    members: [
      { name: '蒋华', avatar: '👨‍💻', role: '高级工程师', aiRatio: '59%', cycle: '6.8天', prs: '9', level: 'L2' as const, trend: '↑13%', trendUp: true },
      { name: '韩梅', avatar: '👩‍💻', role: '工程师', aiRatio: '44%', cycle: '9.1天', prs: '6', level: 'L1' as const, trend: '↑6%', trendUp: true },
      { name: '杨军', avatar: '👨‍💻', role: '工程师', aiRatio: '31%', cycle: '11.5天', prs: '4', level: 'L1' as const, trend: '↑19%', trendUp: true },
    ],
  },
  {
    id: 'travel',
    name: '出行团队',
    aiRatio: '38%',
    cycle: '10.1天',
    superIndividuals: '1人',
    level: 'L1' as const,
    trendData: [20, 23, 26, 29, 32, 34, 36, 38],
    members: [
      { name: '林杰', avatar: '👨‍💻', role: '高级工程师', aiRatio: '52%', cycle: '7.5天', prs: '8', level: 'L2' as const, trend: '↑16%', trendUp: true },
      { name: '许燕', avatar: '👩‍💻', role: '工程师', aiRatio: '38%', cycle: '10.0天', prs: '5', level: 'L1' as const, trend: '↑10%', trendUp: true },
      { name: '曹磊', avatar: '👨‍💻', role: '初级工程师', aiRatio: '24%', cycle: '13.2天', prs: '3', level: 'L1' as const, trend: '↑22%', trendUp: true },
    ],
  },
];

// ─── Shared Sub-components ────────────────────────────────────────────────────

const MetricCardItem: React.FC<{ card: MetricCard }> = ({ card }) => {
  const C = useTheme();
  return (
    <div style={{ padding: '20px 22px', borderRadius: 12, background: C.card, border: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, color: C.muted, fontWeight: 500 }}>{card.label}</span>
        <span style={{ color: C.muted, display: 'flex', alignItems: 'center' }}>{card.icon}</span>
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, color: card.color, lineHeight: 1 }}>{card.value}</div>
      {card.trend && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: card.trend.positive ? C.green : C.red, background: card.trend.positive ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', padding: '2px 8px', borderRadius: 6 }}>{card.trend.text}</span>
          <span style={{ fontSize: 12, color: C.muted }}>较上期</span>
        </div>
      )}
      {card.progress && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: C.muted }}>完成进度</span>
            <span style={{ fontSize: 12, color: card.color, fontWeight: 600 }}>{card.progress.label}</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: C.border, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 3, background: card.color, width: `${(card.progress.current / card.progress.total) * 100}%`, transition: 'width 0.6s ease' }} />
          </div>
        </div>
      )}
      <div style={{ fontSize: 12, color: C.muted }}>{card.target}</div>
    </div>
  );
};

const LevelBadge: React.FC<{ level: 'L1' | 'L2' | 'L3' }> = ({ level }) => {
  const C = useTheme();
  const colorMap = { L1: C.blue, L2: C.purple, L3: C.green };
  return (
    <span style={{ padding: '3px 10px', borderRadius: 6, background: `${colorMap[level]}20`, color: colorMap[level], fontSize: 12, fontWeight: 700, border: `1px solid ${colorMap[level]}40` }}>
      {level}
    </span>
  );
};

const MiniLineChart: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
  const C = useTheme();
  const W = 200; const H = 60; const padL = 8; const padR = 8; const padT = 8; const padB = 8;
  const chartW = W - padL - padR; const chartH = H - padT - padB;
  const minVal = Math.min(...data) - 2; const maxVal = Math.max(...data) + 2;
  const toX = (i: number) => padL + (i / (data.length - 1)) * chartW;
  const toY = (v: number) => padT + chartH - ((v - minVal) / (maxVal - minVal)) * chartH;
  const points = data.map((v, i) => ({ x: toX(i), y: toY(v) }));
  const polyline = points.map(p => `${p.x},${p.y}`).join(' ');
  const areaPath = [`M ${points[0].x} ${padT + chartH}`, ...points.map(p => `L ${p.x} ${p.y}`), `L ${points[points.length - 1].x} ${padT + chartH}`, 'Z'].join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 60, display: 'block' }}>
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#grad-${color.replace('#', '')})`} />
      <polyline points={polyline} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r={3.5} fill={C.bg} stroke={color} strokeWidth={2} />
    </svg>
  );
};

const SectionTitle: React.FC<{ text: string; sub?: string }> = ({ text, sub }) => {
  const C = useTheme();
  return (
    <div style={{ marginBottom: 20 }}>
      <h2 style={{ fontSize: 17, fontWeight: 700, color: C.text, margin: '0 0 4px' }}>{text}</h2>
      {sub && <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>{sub}</p>}
    </div>
  );
};

// ─── Personal View ─────────────────────────────────────────────────────────────

const PersonalView: React.FC<{ period: Period }> = ({ period }) => {
  const C = useTheme();

  const PERSONAL_METRICS: MetricCard[] = [
    { label: 'AI 代码占比', value: '61%', trend: { text: '↑19%', positive: true }, target: '目标 60% ✅', color: C.green, icon: <Bot size={20} /> },
    { label: '需求交付周期', value: '5.8天', trend: { text: '↓28%', positive: true }, target: '目标 ↓25% ✅', color: C.blue, icon: <Zap size={20} /> },
    { label: '本月交付需求', value: '7个', trend: { text: '↑40%', positive: true }, target: '目标 6个 ✅', color: C.purple, icon: <Package size={20} /> },
    { label: 'PR 合并数', value: '34次', trend: { text: '↑22%', positive: true }, target: '团队均值 21次', color: C.orange, icon: <GitMerge size={20} /> },
    { label: 'AI 工具使用时长', value: '38h', trend: { text: '↑15%', positive: true }, target: '团队均值 24h', color: '#ec4899', icon: <Clock size={20} /> },
    { label: '超级个体评级', value: 'L2', progress: { current: 2, total: 3, label: 'L2 / L3' }, target: '下一级：L3', color: C.purple, icon: <UserCheck size={20} /> },
  ];

  const SKILL_RADAR = [
    { label: 'AI Coding', value: 85, color: C.blue },
    { label: '需求分析', value: 72, color: C.purple },
    { label: '架构设计', value: 68, color: C.green },
    { label: '测试覆盖', value: 91, color: C.orange },
    { label: '交付效率', value: 78, color: '#ec4899' },
  ];

  const actTypeColor: Record<string, string> = { code: C.blue, doc: C.purple, pr: C.green, test: C.orange };
  const actTypeLabel: Record<string, string> = { code: 'Coding', doc: '文档', pr: 'PR', test: '测试' };
  const actTypeIcon: Record<string, React.ReactElement> = {
    code: <Code2 size={14} />,
    doc: <FileText size={14} />,
    pr: <GitPullRequest size={14} />,
    test: <TestTube2 size={14} />,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Identity card */}
      <div style={{ padding: '24px', borderRadius: 14, background: C.card, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: `linear-gradient(135deg, ${C.blue}, ${C.purple})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>👨‍💻</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 4 }}>张三 · 高级工程师</div>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 10 }}>物流团队 · 加入 847 天</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <LevelBadge level="L2" />
            <span style={{ padding: '3px 10px', borderRadius: 6, background: 'rgba(16,185,129,0.15)', color: C.green, fontSize: 12, fontWeight: 700, border: '1px solid rgba(16,185,129,0.3)', display: 'inline-flex', alignItems: 'center', gap: 4 }}><UserCheck size={12} /> 超级个体</span>
            <span style={{ padding: '3px 10px', borderRadius: 6, background: 'rgba(245,158,11,0.15)', color: C.orange, fontSize: 12, fontWeight: 700, border: '1px solid rgba(245,158,11,0.3)', display: 'inline-flex', alignItems: 'center', gap: 4 }}><Trophy size={12} /> 本月 Top 3</span>
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>本月 AI 代码占比</div>
          <div style={{ fontSize: 40, fontWeight: 800, color: C.green, lineHeight: 1 }}>61%</div>
          <div style={{ fontSize: 11, color: C.green, marginTop: 4 }}>↑19% 较上月</div>
        </div>
      </div>

      {/* 6 metric cards */}
      <section>
        <SectionTitle text="我的效能指标" sub={`${period}个人数据`} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {PERSONAL_METRICS.map(m => <MetricCardItem key={m.label} card={m} />)}
        </div>
      </section>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Trend */}
        <div style={{ padding: '24px', borderRadius: 12, background: C.card, border: `1px solid ${C.border}` }}>
          <SectionTitle text="AI 代码占比趋势" sub="近 8 周个人数据（%）" />
          <PersonalLineChart />
        </div>

        {/* Skill radar */}
        <div style={{ padding: '24px', borderRadius: 12, background: C.card, border: `1px solid ${C.border}` }}>
          <SectionTitle text="能力雷达" sub="各维度 AI 使用成熟度" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {SKILL_RADAR.map(s => (
              <div key={s.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 13, color: C.text }}>{s.label}</span>
                  <span style={{ fontSize: 13, color: s.color, fontWeight: 700 }}>{s.value}</span>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: C.border, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 4, background: `linear-gradient(90deg, ${s.color}99, ${s.color})`, width: `${s.value}%`, transition: 'width 0.8s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity log */}
      <section>
        <div style={{ padding: '24px', borderRadius: 12, background: C.card, border: `1px solid ${C.border}` }}>
          <SectionTitle text="近期 AI 活动记录" sub="过去 7 天的 AI 使用轨迹" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {PERSONAL_ACTIVITY.map((act, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '12px 0', borderBottom: i < PERSONAL_ACTIVITY.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: actTypeColor[act.type], marginTop: 5 }} />
                  {i < PERSONAL_ACTIVITY.length - 1 && <div style={{ width: 1, height: 28, background: C.border, marginTop: 4 }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>{act.event}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 5 }}>
                    <span style={{ fontSize: 11, color: C.muted }}>{act.date}</span>
                    <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 4, background: `${actTypeColor[act.type]}18`, color: actTypeColor[act.type], border: `1px solid ${actTypeColor[act.type]}30`, display: 'inline-flex', alignItems: 'center', gap: 3 }}>{actTypeIcon[act.type]}{actTypeLabel[act.type]}</span>
                    {act.ai && <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 4, background: 'rgba(139,92,246,0.15)', color: C.purple, border: '1px solid rgba(139,92,246,0.3)', display: 'inline-flex', alignItems: 'center', gap: 3 }}><Bot size={11} /> AI 参与</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

const PersonalLineChart: React.FC = () => {
  const C = useTheme();
  const W = 560; const H = 180; const padL = 48; const padR = 20; const padT = 20; const padB = 36;
  const chartW = W - padL - padR; const chartH = H - padT - padB;
  const minVal = 30; const maxVal = 70;
  const toX = (i: number) => padL + (i / (PERSONAL_TREND_DATA.length - 1)) * chartW;
  const toY = (v: number) => padT + chartH - ((v - minVal) / (maxVal - minVal)) * chartH;
  const points = PERSONAL_TREND_DATA.map((v, i) => ({ x: toX(i), y: toY(v), v }));
  const polyline = points.map(p => `${p.x},${p.y}`).join(' ');
  const areaPath = [`M ${points[0].x} ${padT + chartH}`, ...points.map(p => `L ${p.x} ${p.y}`), `L ${points[points.length - 1].x} ${padT + chartH}`, 'Z'].join(' ');
  const weeks = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'];
  const yTicks = [30, 40, 50, 60, 70];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      <defs>
        <linearGradient id="personalGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.green} stopOpacity="0.25" />
          <stop offset="100%" stopColor={C.green} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      {yTicks.map(t => (
        <g key={t}>
          <line x1={padL} y1={toY(t)} x2={W - padR} y2={toY(t)} stroke={C.border} strokeWidth={1} strokeDasharray="4 4" />
          <text x={padL - 8} y={toY(t) + 4} textAnchor="end" fill={C.muted} fontSize={11}>{t}%</text>
        </g>
      ))}
      <path d={areaPath} fill="url(#personalGrad)" />
      <polyline points={polyline} fill="none" stroke={C.green} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={5} fill={C.bg} stroke={C.green} strokeWidth={2} />
          <text x={p.x} y={p.y - 10} textAnchor="middle" fill={C.green} fontSize={11} fontWeight={600}>{p.v}%</text>
          <text x={p.x} y={H - 4} textAnchor="middle" fill={C.muted} fontSize={11}>{weeks[i]}</text>
        </g>
      ))}
    </svg>
  );
};

// ─── Team View ─────────────────────────────────────────────────────────────────

const TeamView: React.FC<{ period: Period }> = ({ period }) => {
  const C = useTheme();
  const [selectedTeam, setSelectedTeam] = useState<string>('all');

  const ALL_TEAMS: TeamData[] = [
    {
      ...ALL_TEAMS_STATIC[0],
      metrics: [
        { label: 'AI 代码占比', value: '58%', trend: { text: '↑16%', positive: true }, target: '目标 60%', color: C.blue, icon: <Bot size={20} /> },
        { label: '需求交付周期', value: '6.2天', trend: { text: '↓22%', positive: true }, target: '目标 ↓25%', color: C.green, icon: <Zap size={20} /> },
        { label: '月交付需求', value: '68个', trend: { text: '↑31%', positive: true }, target: '目标 ↑30% ✅', color: C.purple, icon: <Package size={20} /> },
        { label: '超级个体数', value: '5人', progress: { current: 5, total: 20, label: '5 / 20' }, target: '目标 20人', color: C.orange, icon: <UserCheck size={20} /> },
      ],
    },
    {
      ...ALL_TEAMS_STATIC[1],
      metrics: [
        { label: 'AI 代码占比', value: '51%', trend: { text: '↑19%', positive: true }, target: '目标 60%', color: C.blue, icon: <Bot size={20} /> },
        { label: '需求交付周期', value: '7.1天', trend: { text: '↓15%', positive: true }, target: '目标 ↓25%', color: C.green, icon: <Zap size={20} /> },
        { label: '月交付需求', value: '54个', trend: { text: '↑22%', positive: true }, target: '目标 ↑30%', color: C.purple, icon: <Package size={20} /> },
        { label: '超级个体数', value: '4人', progress: { current: 4, total: 18, label: '4 / 18' }, target: '目标 18人', color: C.orange, icon: <UserCheck size={20} /> },
      ],
    },
    {
      ...ALL_TEAMS_STATIC[2],
      metrics: [
        { label: 'AI 代码占比', value: '47%', trend: { text: '↑19%', positive: true }, target: '目标 60%', color: C.blue, icon: <Bot size={20} /> },
        { label: '需求交付周期', value: '8.5天', trend: { text: '↓12%', positive: true }, target: '目标 ↓25%', color: C.green, icon: <Zap size={20} /> },
        { label: '月交付需求', value: '41个', trend: { text: '↑17%', positive: true }, target: '目标 ↑30%', color: C.purple, icon: <Package size={20} /> },
        { label: '超级个体数', value: '3人', progress: { current: 3, total: 15, label: '3 / 15' }, target: '目标 15人', color: C.orange, icon: <UserCheck size={20} /> },
      ],
    },
    {
      ...ALL_TEAMS_STATIC[3],
      metrics: [
        { label: 'AI 代码占比', value: '43%', trend: { text: '↑18%', positive: true }, target: '目标 60%', color: C.blue, icon: <Bot size={20} /> },
        { label: '需求交付周期', value: '9.2天', trend: { text: '↓9%', positive: true }, target: '目标 ↓25%', color: C.green, icon: <Zap size={20} /> },
        { label: '月交付需求', value: '36个', trend: { text: '↑14%', positive: true }, target: '目标 ↑30%', color: C.purple, icon: <Package size={20} /> },
        { label: '超级个体数', value: '2人', progress: { current: 2, total: 12, label: '2 / 12' }, target: '目标 12人', color: C.orange, icon: <UserCheck size={20} /> },
      ],
    },
    {
      ...ALL_TEAMS_STATIC[4],
      metrics: [
        { label: 'AI 代码占比', value: '38%', trend: { text: '↑18%', positive: true }, target: '目标 60%', color: C.blue, icon: <Bot size={20} /> },
        { label: '需求交付周期', value: '10.1天', trend: { text: '↓7%', positive: true }, target: '目标 ↓25%', color: C.green, icon: <Zap size={20} /> },
        { label: '月交付需求', value: '28个', trend: { text: '↑11%', positive: true }, target: '目标 ↑30%', color: C.purple, icon: <Package size={20} /> },
        { label: '超级个体数', value: '1人', progress: { current: 1, total: 10, label: '1 / 10' }, target: '目标 10人', color: C.orange, icon: <UserCheck size={20} /> },
      ],
    },
  ];

  const MATURITY_DATA = [
    { level: 'L1 AI Coding', pct: 78, color: C.blue },
    { level: 'L2 AI Developing', pct: 18, color: C.purple },
    { level: 'L3 AI Engineering', pct: 4, color: C.green },
  ];

  const teamOptions = [{ id: 'all', name: '全部团队' }, ...ALL_TEAMS.map(t => ({ id: t.id, name: t.name }))];
  const filteredTeams = selectedTeam === 'all' ? ALL_TEAMS : ALL_TEAMS.filter(t => t.id === selectedTeam);
  const isAll = selectedTeam === 'all';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Team filter bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 13, color: C.muted, flexShrink: 0 }}>筛选团队：</span>
        <select
          value={selectedTeam}
          onChange={e => setSelectedTeam(e.target.value)}
          style={{
            padding: '8px 36px 8px 14px',
            borderRadius: 8,
            border: `1px solid ${C.border}`,
            background: C.card,
            color: C.text,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            outline: 'none',
            appearance: 'none',
            WebkitAppearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2394a3b8' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 12px center',
            minWidth: 140,
          }}
        >
          {teamOptions.map(opt => (
            <option key={opt.id} value={opt.id}>{opt.name}</option>
          ))}
        </select>
      </div>

      {/* All teams: leaderboard + maturity */}
      {isAll && (
        <>
          {/* Leaderboard */}
          <section>
            <div style={{ padding: '24px', borderRadius: 12, background: C.card, border: `1px solid ${C.border}` }}>
              <SectionTitle text="各业务团队排行榜" sub={`${period} · AI 研发效能综合排名`} />
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                      {['#', '团队', 'AI 代码占比', '交付周期趋势', '超级个体', '成熟度'].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: C.muted, borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ALL_TEAMS.map((t, i) => (
                      <tr key={t.id}
                        style={{ background: i === 0 ? 'rgba(59,130,246,0.04)' : 'transparent', cursor: 'pointer', transition: 'background 0.2s' }}
                        onClick={() => setSelectedTeam(t.id)}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                        onMouseLeave={e => (e.currentTarget.style.background = i === 0 ? 'rgba(59,130,246,0.04)' : 'transparent')}
                      >
                        <td style={{ padding: '14px 16px', fontSize: 14, color: i === 0 ? C.orange : C.muted, fontWeight: 700, borderBottom: `1px solid ${C.border}` }}>
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: 14, color: C.text, fontWeight: 600, borderBottom: `1px solid ${C.border}` }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {t.name}
                            <span style={{ fontSize: 11, color: C.blue, opacity: 0.7 }}>查看详情 →</span>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: 14, color: C.green, fontWeight: 700, borderBottom: `1px solid ${C.border}` }}>{t.aiRatio}</td>
                        <td style={{ padding: '8px 16px', borderBottom: `1px solid ${C.border}`, width: 120 }}>
                          <MiniLineChart data={t.trendData} color={C.blue} />
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: 14, color: C.purple, fontWeight: 600, borderBottom: `1px solid ${C.border}` }}>{t.superIndividuals}</td>
                        <td style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}` }}><LevelBadge level={t.level} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Maturity */}
          <div style={{ padding: '24px', borderRadius: 12, background: C.card, border: `1px solid ${C.border}` }}>
            <SectionTitle text="全局 AI 成熟度分布" sub="需求维度 L1 / L2 / L3 分布" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {MATURITY_DATA.map(d => (
                <div key={d.level}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{d.level}</span>
                    <span style={{ fontSize: 13, color: d.color, fontWeight: 700 }}>{d.pct}%</span>
                  </div>
                  <div style={{ height: 10, borderRadius: 5, background: C.border, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 5, background: `linear-gradient(90deg, ${d.color}cc, ${d.color})`, width: `${d.pct}%`, transition: 'width 0.8s ease' }} />
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{d.pct}% 的需求</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Single team detail */}
      {!isAll && filteredTeams.map(team => (
        <div key={team.id} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Team header */}
          <div style={{ padding: '24px', borderRadius: 14, background: C.card, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 6 }}>{team.name}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <LevelBadge level={team.level} />
                <span style={{ padding: '3px 10px', borderRadius: 6, background: 'rgba(16,185,129,0.15)', color: C.green, fontSize: 12, fontWeight: 700, border: '1px solid rgba(16,185,129,0.3)' }}>超级个体 {team.superIndividuals}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 32 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: C.blue, lineHeight: 1 }}>{team.aiRatio}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>AI 代码占比</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: C.green, lineHeight: 1 }}>{team.cycle}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>交付周期</div>
              </div>
            </div>
          </div>

          {/* Team metrics */}
          <section>
            <SectionTitle text="团队核心指标" sub={`${period}数据`} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
              {team.metrics.map(m => <MetricCardItem key={m.label} card={m} />)}
            </div>
          </section>

          {/* Trend chart */}
          <div style={{ padding: '24px', borderRadius: 12, background: C.card, border: `1px solid ${C.border}` }}>
            <SectionTitle text="AI 代码占比趋势" sub="近 8 周团队数据（%）" />
            <TeamLineChart data={team.trendData} color={C.blue} />
          </div>

          {/* Member table */}
          <div style={{ padding: '24px', borderRadius: 12, background: C.card, border: `1px solid ${C.border}` }}>
            <SectionTitle text="成员效能排行" sub="团队内个人 AI 使用情况" />
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                    {['#', '成员', '角色', 'AI 代码占比', '交付周期', 'PR 数', '成熟度', '趋势'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: C.muted, borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {team.members.map((m, i) => (
                    <tr key={m.name}
                      style={{ transition: 'background 0.2s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '14px 16px', fontSize: 14, color: i === 0 ? C.orange : C.muted, fontWeight: 700, borderBottom: `1px solid ${C.border}` }}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                      </td>
                      <td style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 20 }}>{m.avatar}</span>
                          <span style={{ fontSize: 14, color: C.text, fontWeight: 600 }}>{m.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: C.muted, borderBottom: `1px solid ${C.border}` }}>{m.role}</td>
                      <td style={{ padding: '14px 16px', fontSize: 14, color: C.green, fontWeight: 700, borderBottom: `1px solid ${C.border}` }}>{m.aiRatio}</td>
                      <td style={{ padding: '14px 16px', fontSize: 14, color: C.muted, borderBottom: `1px solid ${C.border}` }}>{m.cycle}</td>
                      <td style={{ padding: '14px 16px', fontSize: 14, color: C.purple, fontWeight: 600, borderBottom: `1px solid ${C.border}` }}>{m.prs}</td>
                      <td style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}` }}><LevelBadge level={m.level} /></td>
                      <td style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}` }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: m.trendUp ? C.green : C.red, background: m.trendUp ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', padding: '2px 8px', borderRadius: 6 }}>{m.trend}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const TeamLineChart: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
  const C = useTheme();
  const W = 560; const H = 160; const padL = 48; const padR = 20; const padT = 20; const padB = 36;
  const chartW = W - padL - padR; const chartH = H - padT - padB;
  const minVal = 15; const maxVal = 65;
  const toX = (i: number) => padL + (i / (data.length - 1)) * chartW;
  const toY = (v: number) => padT + chartH - ((v - minVal) / (maxVal - minVal)) * chartH;
  const points = data.map((v, i) => ({ x: toX(i), y: toY(v), v }));
  const polyline = points.map(p => `${p.x},${p.y}`).join(' ');
  const areaPath = [`M ${points[0].x} ${padT + chartH}`, ...points.map(p => `L ${p.x} ${p.y}`), `L ${points[points.length - 1].x} ${padT + chartH}`, 'Z'].join(' ');
  const weeks = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'];
  const yTicks = [20, 30, 40, 50, 60];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      <defs>
        <linearGradient id={`teamGrad-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      {yTicks.map(t => (
        <g key={t}>
          <line x1={padL} y1={toY(t)} x2={W - padR} y2={toY(t)} stroke={C.border} strokeWidth={1} strokeDasharray="4 4" />
          <text x={padL - 8} y={toY(t) + 4} textAnchor="end" fill={C.muted} fontSize={11}>{t}%</text>
        </g>
      ))}
      <path d={areaPath} fill={`url(#teamGrad-${color.replace('#','')})`} />
      <polyline points={polyline} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={5} fill={C.bg} stroke={color} strokeWidth={2} />
          <text x={p.x} y={p.y - 10} textAnchor="middle" fill={color} fontSize={11} fontWeight={600}>{p.v}%</text>
          <text x={p.x} y={H - 4} textAnchor="middle" fill={C.muted} fontSize={11}>{weeks[i]}</text>
        </g>
      ))}
    </svg>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const MetricsDashboardPage: React.FC = () => {
  const C = useTheme();
  const [period, setPeriod] = useState<Period>('本月');
  const [viewMode, setViewMode] = useState<ViewMode>('personal');
  const periods: Period[] = ['本周', '本月', '本季度'];

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: "'PingFang SC', 'Helvetica Neue', Arial, sans-serif", padding: '40px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px', borderRadius: 20, background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', color: C.purple, fontSize: 12, fontWeight: 600, marginBottom: 12 }}>
              <BarChart2 size={14} /> 效能度量大盘
            </div>
            <h1 style={{ fontSize: 30, fontWeight: 800, color: C.text, margin: '0 0 6px', letterSpacing: '-0.4px' }}>AI 研发效能度量大盘</h1>
            <p style={{ fontSize: 14, color: C.muted, margin: 0 }}>实时追踪 AI 赋能研发效能的核心指标</p>
          </div>
          {/* Period selector */}
          <div style={{ display: 'flex', gap: 6, padding: 4, borderRadius: 10, background: C.card, border: `1px solid ${C.border}`, alignSelf: 'flex-start' }}>
            {periods.map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{ padding: '7px 18px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.2s', background: period === p ? C.blue : 'transparent', color: period === p ? '#fff' : C.muted, boxShadow: period === p ? '0 2px 8px rgba(59,130,246,0.3)' : 'none' }}>{p}</button>
            ))}
          </div>
        </div>

        {/* View mode toggle */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 28, borderRadius: 12, overflow: 'hidden', border: `1px solid ${C.border}`, width: 'fit-content', background: C.card }}>
          {([
            ['personal', <><span>👤</span> 个人视角</>] as [ViewMode, React.ReactElement],
            ['team', <><Users size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> 团队视角</>] as [ViewMode, React.ReactElement],
          ]).map(([mode, label]) => (
            <button key={mode} onClick={() => setViewMode(mode as ViewMode)} style={{
              padding: '10px 28px', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, transition: 'all 0.2s',
              background: viewMode === mode ? C.blue : 'transparent',
              color: viewMode === mode ? '#fff' : C.muted,
              boxShadow: viewMode === mode ? 'inset 0 0 0 1px rgba(255,255,255,0.1)' : 'none',
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}>{label}</button>
          ))}
        </div>

        {/* Content */}
        {viewMode === 'personal' ? <PersonalView period={period} /> : <TeamView period={period} />}

        {/* Footer */}
        <div style={{ marginTop: 40, textAlign: 'center', fontSize: 12, color: C.muted, padding: '16px 0', borderTop: `1px solid ${C.border}` }}>
          数据更新时间：2026-03-04 00:00 &nbsp;·&nbsp; AI 效能平台 v2.0
        </div>
      </div>
    </div>
  );
};

export default MetricsDashboardPage;
