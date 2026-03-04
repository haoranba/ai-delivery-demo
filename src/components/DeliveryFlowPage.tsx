import React, { useState, useEffect, useRef } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type NodeStatus = 'done' | 'active' | 'pending' | 'blocked' | 'reviewing'
type ExecMode = 'human' | 'agent' | null

interface FlowNode {
  id: string
  label: string
  icon: string
  desc: string
  platform?: string
  agentName?: string
  status: NodeStatus
  mode: ExecMode
  row: number
  parallel?: boolean
  color: string
}

interface ReviewGate {
  id: string
  afterRow: number
  label: string
  status: 'pass' | 'pending' | 'reject'
}

// ─── Mock requirement parse ───────────────────────────────────────────────────

interface ParsedReq {
  title: string
  owner: string
  priority: string
  deadline: string
  tags: string[]
  summary: string
}

function parseDimaUrl(url: string): ParsedReq {
  const id = url.replace(/\D/g, '').slice(-4) || '0001'
  const samples: Record<string, ParsedReq> = {
    default: {
      title: '活动发放系统',
      owner: '陈晓明',
      priority: 'P0',
      deadline: '2026-03-20',
      tags: ['营销', '发放', '风控'],
      summary: '节日活动发放，支持定向发放、金额配置、领取记录查询，需接入风控系统，日均流量预估 500w QPS。',
    },
  }
  const keys = Object.keys(samples)
  return samples[keys[parseInt(id, 10) % keys.length]] || samples.default
}

function buildNodes(req: ParsedReq): FlowNode[] {
  return [
    {
      id: 'req', label: '需求分析', icon: '📋',
      desc: `解析 Dima 需求，拆解用户故事\n「${req.title}」`,
      platform: 'Speco', agentName: 'Speco Agent',
      status: 'done', mode: null, row: 0, color: '#8b5cf6',
    },
    {
      id: 'design_ui', label: 'UI 设计', icon: '🎨',
      desc: '交互稿、视觉规范、D2C 还原',
      platform: 'Muse', agentName: 'Muse Agent',
      status: 'active', mode: null, row: 1, parallel: true, color: '#ec4899',
    },
    {
      id: 'design_arch', label: '架构设计', icon: '🏗️',
      desc: '系统架构、接口设计、数据模型',
      platform: 'Speco', agentName: 'Speco Agent',
      status: 'active', mode: null, row: 1, parallel: true, color: '#3b82f6',
    },
    {
      id: 'design_data', label: '数据方案', icon: '📊',
      desc: '埋点方案、指标设计、看板',
      platform: 'Dataflow', agentName: 'Dataflow Agent',
      status: 'active', mode: null, row: 1, parallel: true, color: '#f59e0b',
    },
    {
      id: 'dev_fe', label: '前端开发', icon: '🖥️',
      desc: 'React 组件开发，集成内部组件库',
      platform: 'Neo', agentName: 'Neo Agent',
      status: 'pending', mode: null, row: 2, parallel: true, color: '#10b981',
    },
    {
      id: 'dev_be', label: '后端开发', icon: '⚙️',
      desc: 'Java 服务，接入 RPC/ORM 框架',
      platform: 'Maco', agentName: 'Maco Agent',
      status: 'pending', mode: null, row: 2, parallel: true, color: '#10b981',
    },
    {
      id: 'dev_data', label: '数据开发', icon: '🔢',
      desc: 'SQL/Pipeline，实时离线任务',
      platform: 'Dataflow', agentName: 'Dataflow Agent',
      status: 'pending', mode: null, row: 2, parallel: true, color: '#10b981',
    },
    {
      id: 'test', label: '测试验证', icon: '🧪',
      desc: '单测/接口/UI 测试，缺陷管理',
      platform: 'DeepTest', agentName: 'DeepTest Agent',
      status: 'pending', mode: null, row: 3, color: '#f59e0b',
    },
    {
      id: 'deploy', label: '发布上线', icon: '🚀',
      desc: '灰度发布、监控验证、回滚预案',
      platform: '发布平台', agentName: 'Deploy Agent',
      status: 'pending', mode: null, row: 4, color: '#ef4444',
    },
  ]
}

const initialGates: ReviewGate[] = [
  { id: 'g1', afterRow: 0, label: '需求评审', status: 'pass' },
  { id: 'g2', afterRow: 1, label: '方案评审', status: 'pending' },
  { id: 'g3', afterRow: 2, label: '代码评审', status: 'pending' },
  { id: 'g4', afterRow: 3, label: '上线评审', status: 'pending' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const statusStyle = (s: NodeStatus): React.CSSProperties => ({
  done:      { background: 'rgba(16,185,129,0.12)', border: '1.5px solid #10b981' },
  active:    { background: 'rgba(59,130,246,0.12)', border: '1.5px solid #3b82f6' },
  pending:   { background: 'rgba(148,163,184,0.06)', border: '1.5px solid #1e2d45' },
  blocked:   { background: 'rgba(239,68,68,0.12)', border: '1.5px solid #ef4444' },
  reviewing: { background: 'rgba(245,158,11,0.12)', border: '1.5px solid #f59e0b' },
}[s])

const statusLabel: Record<NodeStatus, string> = {
  done: '✅ 完成', active: '🔵 进行中', pending: '⏳ 待开始', blocked: '🔴 阻塞', reviewing: '🟡 评审中',
}
const statusColor: Record<NodeStatus, string> = {
  done: '#10b981', active: '#3b82f6', pending: '#475569', blocked: '#ef4444', reviewing: '#f59e0b',
}

const gateColor = { pass: '#10b981', pending: '#f59e0b', reject: '#ef4444' }
const gateLabel = { pass: '✅ 已通过', pending: '🟡 待评审', reject: '❌ 已打回' }

// ─── Gate Detail Panel Data ───────────────────────────────────────────────────

interface CheckItem {
  icon: string
  label: string
  status: 'ok' | 'warn'
}

interface GateDetail {
  id: string
  deliverableTitle: string
  deliverableType: 'prd' | 'tech' | 'diff' | 'checklist'
  checks: CheckItem[]
}

const gateDetails: Record<string, GateDetail> = {
  g1: {
    id: 'g1',
    deliverableTitle: 'PRD 文档 · 活动发放系统',
    deliverableType: 'prd',
    checks: [
      { icon: '✅', label: '需求完整性', status: 'ok' },
      { icon: '✅', label: '边界清晰', status: 'ok' },
      { icon: '✅', label: '验收标准', status: 'ok' },
      { icon: '⚠️', label: '技术可行性', status: 'warn' },
    ],
  },
  g2: {
    id: 'g2',
    deliverableTitle: '技术方案文档 · 系统架构 & 接口设计',
    deliverableType: 'tech',
    checks: [
      { icon: '✅', label: '架构合理性', status: 'ok' },
      { icon: '✅', label: '性能评估', status: 'ok' },
      { icon: '✅', label: '安全评估', status: 'ok' },
      { icon: '✅', label: '依赖梳理', status: 'ok' },
    ],
  },
  g3: {
    id: 'g3',
    deliverableTitle: 'PR Diff · feature/activity → main',
    deliverableType: 'diff',
    checks: [
      { icon: '✅', label: '代码规范', status: 'ok' },
      { icon: '✅', label: '测试覆盖', status: 'ok' },
      { icon: '✅', label: '性能影响', status: 'ok' },
      { icon: '✅', label: '安全扫描', status: 'ok' },
    ],
  },
  g4: {
    id: 'g4',
    deliverableTitle: '上线 Checklist · 灰度发布方案',
    deliverableType: 'checklist',
    checks: [
      { icon: '✅', label: '灰度方案', status: 'ok' },
      { icon: '✅', label: '回滚预案', status: 'ok' },
      { icon: '✅', label: '监控就绪', status: 'ok' },
      { icon: '✅', label: '业务验收', status: 'ok' },
    ],
  },
}

// ─── PRD Document Card ────────────────────────────────────────────────────────

function PrdCard() {
  return (
    <div style={{
      background: '#0a0f1e', border: '1px solid #1e2d45', borderRadius: 10,
      padding: '14px 16px', fontSize: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 16 }}>📄</span>
        <div>
          <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 13 }}>红包活动发放系统 PRD v2.1</div>
          <div style={{ color: '#475569', fontSize: 10, marginTop: 1 }}>最后更新：2026-03-04 · 作者：陈晓明 · 约 4,820 字</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {[
          { no: '1', title: '背景与目标', words: '420字', color: '#8b5cf6' },
          { no: '2', title: '用户故事与场景', words: '1,240字', color: '#3b82f6' },
          { no: '3', title: '功能需求详述', words: '1,860字', color: '#10b981' },
          { no: '4', title: '非功能需求（性能/安全/合规）', words: '680字', color: '#f59e0b' },
          { no: '5', title: '验收标准 & 测试用例清单', words: '620字', color: '#ec4899' },

        ].map(sec => (
          <div key={sec.no} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 10px', borderRadius: 6,
            background: '#1a2235', border: '1px solid #1e2d45',
          }}>
            <span style={{
              width: 18, height: 18, borderRadius: 4, background: `${sec.color}22`,
              border: `1px solid ${sec.color}55`, color: sec.color,
              fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>{sec.no}</span>
            <span style={{ flex: 1, color: '#94a3b8' }}>{sec.title}</span>
            <span style={{ color: '#475569', fontSize: 10 }}>{sec.words}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Tech Doc Card ────────────────────────────────────────────────────────────

function TechDocCard() {
  return (
    <div style={{
      background: '#0a0f1e', border: '1px solid #1e2d45', borderRadius: 10,
      padding: '14px 16px', fontSize: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 16 }}>🏗️</span>
        <div>
          <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 13 }}>技术方案文档 v1.0</div>
          <div style={{ color: '#475569', fontSize: 10, marginTop: 1 }}>Speco Agent 生成 · 2026-03-04 14:15</div>
        </div>
      </div>
      {/* 架构图描述 */}
      <div style={{ background: '#1a2235', border: '1px solid #1e2d45', borderRadius: 8, padding: '10px 12px', marginBottom: 10 }}>
        <div style={{ color: '#64748b', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', marginBottom: 8 }}>ARCHITECTURE OVERVIEW</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, flexWrap: 'wrap' }}>
          {[
            { label: 'H5 / App', color: '#ec4899' },
            { label: 'API Gateway', color: '#8b5cf6' },
            { label: 'Activity\nService', color: '#3b82f6' },
            { label: 'Risk\nService', color: '#ef4444' },
          ].map((box, i, arr) => (
            <React.Fragment key={box.label}>
              <div style={{
                padding: '6px 10px', borderRadius: 6, border: `1px solid ${box.color}55`,
                background: `${box.color}12`, color: box.color, fontSize: 10, fontWeight: 600,
                textAlign: 'center', whiteSpace: 'pre-line', lineHeight: 1.3,
              }}>{box.label}</div>
              {i < arr.length - 1 && (
                <div style={{ color: '#334155', fontSize: 14, margin: '0 4px' }}>→</div>
              )}
            </React.Fragment>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'center' }}>
          {[
            { label: 'MySQL 主从', color: '#f59e0b' },
            { label: 'Redis Cluster', color: '#10b981' },
            { label: 'MQ (异步)', color: '#64748b' },
          ].map(box => (
            <div key={box.label} style={{
              padding: '4px 8px', borderRadius: 4, border: `1px solid ${box.color}44`,
              background: `${box.color}10`, color: box.color, fontSize: 9, fontWeight: 600,
            }}>{box.label}</div>
          ))}
        </div>
      </div>
      {/* 接口设计摘要 */}
      <div style={{ color: '#64748b', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', marginBottom: 6 }}>接口设计摘要（共 23 个）</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {[
          { method: 'POST', path: '/api/activity/create', desc: '创建活动' },
          { method: 'POST', path: '/api/activity/join', desc: '用户参与活动（幂等）' },
          { method: 'GET',  path: '/api/activity/record', desc: '查询参与记录（分页）' },
          { method: 'POST', path: '/api/risk/check', desc: '风控校验（异步降级）' },
        ].map(api => (
          <div key={api.path} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '5px 8px', borderRadius: 5, background: '#0d1526',
          }}>
            <span style={{
              fontSize: 9, padding: '1px 5px', borderRadius: 3, fontWeight: 700, fontFamily: 'monospace',
              background: api.method === 'POST' ? 'rgba(59,130,246,0.2)' : 'rgba(16,185,129,0.2)',
              color: api.method === 'POST' ? '#60a5fa' : '#34d399',
            }}>{api.method}</span>
            <span style={{ fontFamily: 'monospace', color: '#94a3b8', fontSize: 11, flex: 1 }}>{api.path}</span>
            <span style={{ color: '#475569', fontSize: 10 }}>{api.desc}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Code Diff Card ───────────────────────────────────────────────────────────

function DiffCard() {
  const diffLines = [
    { type: 'meta', text: 'diff --git a/ActivityService.java b/ActivityService.java' },
    { type: 'meta', text: '@@ -142,8 +142,14 @@ public class ActivityService {' },
    { type: 'ctx',  text: '   public JoinResult joinActivity(String userId, String activityId) {' },
    { type: 'ctx',  text: '     String lockKey = "act:lock:" + activityId;' },
    { type: 'del',  text: '-    redisClient.setex(lockKey, 30, userId);' },
    { type: 'add',  text: '+    int expireSeconds = config.getInt("activity.lock.expire", 30);' },
    { type: 'add',  text: '+    redisClient.setex(lockKey, expireSeconds, userId);' },
    { type: 'ctx',  text: '     try {' },
    { type: 'del',  text: '-      return doJoin(userId, activityId);' },
    { type: 'add',  text: '+      JoinResult result = doJoin(userId, activityId);' },
    { type: 'add',  text: '+      metrics.increment("activity.join.success");' },
    { type: 'add',  text: '+      return result;' },
    { type: 'del',  text: '-    } catch (Exception e) {' },
    { type: 'add',  text: '+    } catch (RedisConnectionException e) {' },
    { type: 'add',  text: '+      log.error("Redis连接异常，降级处理", e);' },
    { type: 'add',  text: '+      return JoinResult.degraded();' },
    { type: 'del',  text: '-      throw new RuntimeException(e);' },
    { type: 'ctx',  text: '     }' },
    { type: 'ctx',  text: '   }' },
  ]

  const lineColor: Record<string, string> = {
    meta: '#64748b',
    ctx:  '#94a3b8',
    del:  '#fca5a5',
    add:  '#86efac',
  }
  const lineBg: Record<string, string> = {
    meta: 'transparent',
    ctx:  'transparent',
    del:  'rgba(239,68,68,0.08)',
    add:  'rgba(16,185,129,0.08)',
  }

  return (
    <div style={{
      background: '#0a0f1e', border: '1px solid #1e2d45', borderRadius: 10,
      padding: '14px 16px', fontSize: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 16 }}>🔀</span>
        <div>
          <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 13 }}>PR #247 · feature/activity → main</div>
          <div style={{ color: '#475569', fontSize: 10, marginTop: 1 }}>
            <span style={{ color: '#86efac' }}>+312</span>
            <span style={{ color: '#475569' }}> / </span>
            <span style={{ color: '#fca5a5' }}>-89</span>
            <span style={{ color: '#475569' }}> · 14 files changed · Maco Agent</span>
          </div>
        </div>
      </div>
      <div style={{
        background: '#070c18', border: '1px solid #1e2d45', borderRadius: 8,
        overflow: 'hidden', fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
      }}>
        {diffLines.map((line, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center',
            background: lineBg[line.type],
            padding: '1px 12px',
            borderBottom: i < diffLines.length - 1 ? '1px solid rgba(30,45,69,0.3)' : 'none',
          }}>
            <span style={{ color: lineColor[line.type], fontSize: 11, whiteSpace: 'pre', lineHeight: 1.7 }}>
              {line.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Online Checklist Card ────────────────────────────────────────────────────

function OnlineChecklistCard() {
  const [checked, setChecked] = useState<Record<string, boolean>>({
    gray: true, rollback: true, monitor: true, perf: true,
  })

  const items = [
    {
      key: 'gray', label: '灰度方案',
      desc: '5% → 20% → 100% 三阶段灰度，每阶段观察 30 分钟',
      icon: '🎯',
    },
    {
      key: 'rollback', label: '回滚方案',
      desc: '发布平台一键回滚，预计 < 2 分钟恢复，已演练验证',
      icon: '🔄',
    },
    {
      key: 'monitor', label: '监控告警',
      desc: 'P99 延迟 > 500ms / 错误率 > 0.1% 自动告警，已配置',
      icon: '📡',
    },
    {
      key: 'perf', label: '性能基线',
      desc: '压测基线：500w QPS，P99 < 200ms，已通过压测验证',
      icon: '⚡',
    },
  ]

  const allChecked = Object.values(checked).every(Boolean)

  return (
    <div style={{
      background: '#0a0f1e', border: '1px solid #1e2d45', borderRadius: 10,
      padding: '14px 16px', fontSize: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 16 }}>📋</span>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 13 }}>上线 Checklist · 灰度发布方案</div>
          <div style={{ color: '#475569', fontSize: 10, marginTop: 1 }}>Deploy Agent 生成 · 2026-03-04 22:30</div>
        </div>
        <div style={{
          fontSize: 10, padding: '2px 8px', borderRadius: 10, fontWeight: 700,
          background: allChecked ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
          color: allChecked ? '#10b981' : '#f59e0b',
          border: `1px solid ${allChecked ? '#10b98144' : '#f59e0b44'}`,
        }}>
          {Object.values(checked).filter(Boolean).length}/{items.length} 完成
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map(item => (
          <div
            key={item.key}
            onClick={() => setChecked(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
              background: checked[item.key] ? 'rgba(16,185,129,0.07)' : '#1a2235',
              border: `1px solid ${checked[item.key] ? '#10b98133' : '#1e2d45'}`,
              transition: 'all 0.2s',
            }}
          >
            {/* Checkbox */}
            <div style={{
              width: 16, height: 16, borderRadius: 4, flexShrink: 0, marginTop: 1,
              background: checked[item.key] ? '#10b981' : 'transparent',
              border: `1.5px solid ${checked[item.key] ? '#10b981' : '#334155'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}>
              {checked[item.key] && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4L3.5 6.5L9 1" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <span style={{ fontSize: 14, flexShrink: 0 }}>{item.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{
                fontWeight: 600, fontSize: 12, marginBottom: 2,
                color: checked[item.key] ? '#94a3b8' : '#f1f5f9',
                textDecoration: checked[item.key] ? 'none' : 'none',
              }}>{item.label}</div>
              <div style={{ color: '#475569', fontSize: 11, lineHeight: 1.4 }}>{item.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Gate Detail Panel (inline expand) ───────────────────────────────────────

function GateDetailPanel({ gate, detail, onClose, onApprove, onReject }: {
  gate: ReviewGate
  detail: GateDetail
  onClose: () => void
  onApprove: () => void
  onReject: () => void
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // trigger slideDown
    const t = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(t)
  }, [])

  const gc = gateColor[gate.status]

  return (
    <div
      ref={panelRef}
      style={{
        overflow: 'hidden',
        maxHeight: visible ? 800 : 0,
        opacity: visible ? 1 : 0,
        transition: 'max-height 0.38s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease',
        width: '100%',
        maxWidth: 680,
      }}
    >
      <div style={{
        background: '#0d1526',
        border: `1px solid ${gc}44`,
        borderRadius: 12,
        marginTop: 10,
        overflow: 'hidden',
        boxShadow: `0 4px 24px rgba(0,0,0,0.3), 0 0 0 1px ${gc}22`,
      }}>
        {/* Panel Header */}
        <div style={{
          padding: '12px 16px',
          borderBottom: `1px solid ${gc}22`,
          background: `${gc}08`,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 13 }}>
              {detail.deliverableTitle}
            </div>
            <div style={{ color: '#475569', fontSize: 10, marginTop: 2 }}>
              {gate.label} · 交付物详情
            </div>
          </div>
          <span style={{
            fontSize: 10, padding: '2px 8px', borderRadius: 10,
            background: `${gc}18`, border: `1px solid ${gc}55`, color: gc, fontWeight: 700,
          }}>
            {gateLabel[gate.status]}
          </span>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: '#475569', cursor: 'pointer',
            fontSize: 16, padding: '0 4px', lineHeight: 1,
          }}>✕</button>
        </div>

        <div style={{ padding: '14px 16px' }}>
          {/* Deliverable */}
          {detail.deliverableType === 'prd' && <PrdCard />}
          {detail.deliverableType === 'tech' && <TechDocCard />}
          {detail.deliverableType === 'diff' && <DiffCard />}
          {detail.deliverableType === 'checklist' && <OnlineChecklistCard />}

          {/* Check Items */}
          <div style={{ marginTop: 12 }}>
            <div style={{ color: '#475569', fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', marginBottom: 8 }}>
              评审检查项
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {detail.checks.map(c => (
                <div key={c.label} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 10px', borderRadius: 8,
                  background: c.status === 'ok' ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
                  border: `1px solid ${c.status === 'ok' ? '#10b98133' : '#f59e0b33'}`,
                }}>
                  <span style={{ fontSize: 12 }}>{c.icon}</span>
                  <span style={{
                    fontSize: 11, fontWeight: 600,
                    color: c.status === 'ok' ? '#10b981' : '#f59e0b',
                  }}>{c.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, marginTop: 14, justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={{
              padding: '6px 14px', borderRadius: 7, border: '1px solid #334155',
              background: 'transparent', color: '#64748b', cursor: 'pointer', fontSize: 12,
            }}>收起</button>
            <button onClick={onReject} style={{
              padding: '6px 14px', borderRadius: 7, border: '1px solid #ef4444',
              background: 'rgba(239,68,68,0.1)', color: '#f87171', cursor: 'pointer', fontSize: 12, fontWeight: 600,
            }}>❌ 打回</button>
            <button onClick={onApprove} style={{
              padding: '6px 14px', borderRadius: 7, border: 'none',
              background: '#10b981', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600,
            }}>✅ 审批通过</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Agent Panel ──────────────────────────────────────────────────────────────

const agentReplies: Record<string, string[]> = {
  req:         ['正在解析需求文档...', '✅ 需求解析完成\n\n**识别到 12 个用户故事，3 个核心场景：**\n1. 活动发放配置（P0）\n2. 用户参与流程（P0）\n3. 记录查询与对账（P1）\n\n**验收标准已自动生成，是否确认进入方案设计阶段？**'],
  design_ui:   ['正在生成 UI 原型...', '✅ 已完成交互稿设计\n\n生成了 8 个页面原型，覆盖活动发放、用户参与、记录查询等核心流程。\n\n**D2C 代码已就绪，可直接导入 Neo 进行前端开发。**'],
  design_arch: ['正在设计系统架构...', '✅ 架构方案完成\n\n微服务架构，拆分为 3 个服务：\n- ActivityService（核心发放/参与）\n- RiskService（风控接入）\n- RecordService（记录查询）\n\n**接口文档已生成（23 个接口）。**'],
  design_data: ['正在设计数据方案...', '✅ 数据方案完成\n\n埋点事件 18 个，核心指标 6 个，看板模板已创建。'],
  dev_fe:      ['正在生成前端代码...', '✅ 前端代码生成完成\n\n已生成 React 组件 14 个，集成内部组件库\n单测覆盖率：87%\n\n**代码已推送到 feature/activity-fe，请 CR。**'],
  dev_be:      ['正在生成后端服务...', '✅ 后端服务生成完成\n\nJava 代码已生成，接入 RPC/ORM 框架\n幂等处理：Token + Redis\n单测覆盖率：91%\n\n**代码已推送到 feature/activity-be，请 CR。**'],
  dev_data:    ['正在生成数据任务...', '✅ 数据开发完成\n\n实时任务 2 个，离线任务 3 个，均已接入调度系统。'],
  test:        ['正在执行测试用例...', '✅ 测试执行完成\n\n共执行 156 个用例：\n- 单测：98 个 ✅\n- 接口测试：45 个 ✅\n- UI 测试：13 个 ✅\n\n**发现 2 个 P2 缺陷已记录，建议修复后上线。**'],
  deploy:      ['正在执行灰度发布...', '✅ 灰度发布完成\n\n当前灰度比例：5%\n监控指标正常，无报警。\n\n**是否扩大灰度到 100%？**'],
}

function AgentPanel({ node, onClose }: { node: FlowNode; onClose: () => void }) {
  const [messages, setMessages] = useState<{ role: 'user' | 'agent'; text: string }[]>([
    { role: 'agent', text: `你好！我是 **${node.agentName}**，负责「${node.label}」阶段的自主交付。\n\n请告诉我具体需求，或点击下方快捷指令开始。` }
  ])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const replies = agentReplies[node.id] || ['正在处理...', '✅ 任务完成！']
  const replyIdx = React.useRef(0)

  const sendMessage = (text: string) => {
    if (!text.trim() || typing) return
    setMessages(prev => [...prev, { role: 'user', text }])
    setInput('')
    setTyping(true)
    setTimeout(() => {
      const reply = replies[replyIdx.current % replies.length]
      replyIdx.current++
      let i = 0
      setMessages(prev => [...prev, { role: 'agent', text: '' }])
      const timer = setInterval(() => {
        i += 3
        setMessages(prev => {
          const next = [...prev]
          next[next.length - 1] = { role: 'agent', text: reply.slice(0, i) }
          return next
        })
        if (i >= reply.length) { clearInterval(timer); setTyping(false) }
      }, 18)
    }, 500)
  }

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, width: 420,
      background: '#0d1526', borderLeft: '1px solid #1e2d45',
      display: 'flex', flexDirection: 'column', zIndex: 200,
      boxShadow: '-8px 0 32px rgba(0,0,0,0.5)'
    }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e2d45', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 20 }}>{node.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 14 }}>{node.agentName}</div>
          <div style={{ color: '#64748b', fontSize: 11 }}>自主交付模式 · {node.label}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginRight: 8 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981' }} />
          <span style={{ color: '#10b981', fontSize: 11 }}>在线</span>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 18 }}>✕</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '85%', padding: '10px 14px',
              borderRadius: m.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
              background: m.role === 'user' ? '#3b82f6' : '#1a2235',
              color: '#f1f5f9', fontSize: 13, lineHeight: 1.65, whiteSpace: 'pre-wrap', wordBreak: 'break-word'
            }}>
              {m.text || (typing && i === messages.length - 1 ? <span style={{ opacity: 0.4 }}>▋</span> : '')}
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding: '8px 20px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {['开始自动交付', '查看当前进度', '生成交付报告'].map(cmd => (
          <button key={cmd} onClick={() => sendMessage(cmd)} style={{
            padding: '4px 10px', borderRadius: 20, border: '1px solid #1e2d45',
            background: 'transparent', color: '#94a3b8', fontSize: 11, cursor: 'pointer'
          }}>{cmd}</button>
        ))}
      </div>
      <div style={{ padding: '12px 20px', borderTop: '1px solid #1e2d45', display: 'flex', gap: 8 }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
          placeholder="输入指令..."
          style={{ flex: 1, padding: '10px 14px', borderRadius: 8, background: '#1a2235', border: '1px solid #1e2d45', color: '#f1f5f9', fontSize: 13, outline: 'none' }}
        />
        <button onClick={() => sendMessage(input)} style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>发送</button>
      </div>
    </div>
  )
}

// ─── Mode Modal ───────────────────────────────────────────────────────────────

function ModeModal({ node, onSelect, onClose }: {
  node: FlowNode
  onSelect: (mode: 'human' | 'agent') => void
  onClose: () => void
}) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}
      onClick={onClose}>
      <div style={{ background: '#1a2235', border: '1px solid #1e2d45', borderRadius: 16, padding: 32, width: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 22, marginBottom: 4 }}>{node.icon} {node.label}</div>
        <div style={{ color: '#64748b', fontSize: 13, marginBottom: 24 }}>{node.desc}</div>
        <div style={{ color: '#94a3b8', fontSize: 11, marginBottom: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>选择执行模式</div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => onSelect('human')} style={{
            flex: 1, padding: 18, borderRadius: 12, border: '1.5px solid #8b5cf6',
            background: 'rgba(139,92,246,0.1)', color: '#f1f5f9', cursor: 'pointer', textAlign: 'left'
          }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>🤝</div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>人工协同</div>
            <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>跳转到 <strong style={{ color: '#a78bfa' }}>{node.platform}</strong> 平台，由人工操作完成</div>
          </button>
          <button onClick={() => onSelect('agent')} style={{
            flex: 1, padding: 18, borderRadius: 12, border: '1.5px solid #3b82f6',
            background: 'rgba(59,130,246,0.1)', color: '#f1f5f9', cursor: 'pointer', textAlign: 'left'
          }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>🤖</div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>自主交付</div>
            <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>由 <strong style={{ color: '#60a5fa' }}>{node.agentName}</strong> 自主完成，全程 AI 执行</div>
          </button>
        </div>
        <button onClick={onClose} style={{ marginTop: 16, width: '100%', padding: 8, borderRadius: 8, border: '1px solid #334155', background: 'transparent', color: '#64748b', cursor: 'pointer' }}>取消</button>
      </div>
    </div>
  )
}

// ─── Flow View ────────────────────────────────────────────────────────────────

function FlowView({ req, dimaUrl, onReset }: { req: ParsedReq; dimaUrl: string; onReset: () => void }) {
  const [nodes, setNodes] = useState<FlowNode[]>(buildNodes(req))
  const [gates, setGates] = useState<ReviewGate[]>(initialGates)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [modeModal, setModeModal] = useState<FlowNode | null>(null)
  const [agentNode, setAgentNode] = useState<FlowNode | null>(null)
  // expanded gate id for inline detail panel
  const [expandedGateId, setExpandedGateId] = useState<string | null>(null)

  const handleNodeClick = (node: FlowNode) => {
    if (node.status === 'pending') return
    setSelectedId(node.id)
    setModeModal(node)
  }

  const handleModeSelect = (mode: 'human' | 'agent') => {
    if (!modeModal) return
    setNodes(prev => prev.map(n => n.id === modeModal.id ? { ...n, mode } : n))
    if (mode === 'agent') setAgentNode(modeModal)
    else window.open(`https://internal.example.com/${modeModal.platform?.toLowerCase()}`, '_blank')
    setModeModal(null)
  }

  const toggleGateDetail = (gate: ReviewGate) => {
    setExpandedGateId(prev => prev === gate.id ? null : gate.id)
  }

  const approveGate = (gateId: string) => {
    setGates(prev => prev.map(g => g.id === gateId ? { ...g, status: 'pass' } : g))
    setExpandedGateId(null)
  }

  const rejectGate = (gateId: string) => {
    setGates(prev => prev.map(g => g.id === gateId ? { ...g, status: 'reject' } : g))
    setExpandedGateId(null)
  }

  const handleReqChange = () => {
    setNodes(prev => prev.map(n =>
      ['design_ui', 'design_arch', 'design_data'].includes(n.id) ? { ...n, status: 'reviewing' } : n
    ))
    setGates(prev => prev.map(g => g.id === 'g2' ? { ...g, status: 'pending' } : g))
  }

  const handleBugFlow = () => {
    setNodes(prev => prev.map(n =>
      ['dev_fe', 'dev_be'].includes(n.id) ? { ...n, status: 'blocked' } : n
    ))
    setGates(prev => prev.map(g => g.id === 'g3' ? { ...g, status: 'reject' } : g))
  }

  const rows = [0,1,2,3,4].map(r => nodes.filter(n => n.row === r))

  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1e', padding: '28px 36px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <button onClick={onReset} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 13, padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
              ← 返回
            </button>
            <span style={{ color: '#1e2d45' }}>|</span>
            <span style={{ fontSize: 11, color: '#475569', fontFamily: 'monospace' }}>{dimaUrl}</span>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', margin: 0, marginBottom: 4 }}>
            ⚡ {req.title}
          </h2>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>负责人：<span style={{ color: '#94a3b8' }}>{req.owner}</span></span>
            <span style={{ fontSize: 12, color: '#64748b' }}>截止：<span style={{ color: '#94a3b8' }}>{req.deadline}</span></span>
            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid #ef444444' }}>{req.priority}</span>
            {req.tags.map(t => (
              <span key={t} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid #3b82f644' }}>{t}</span>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleReqChange} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #f59e0b', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', cursor: 'pointer', fontSize: 12 }}>🔄 需求变更</button>
          <button onClick={handleBugFlow} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #ef4444', background: 'rgba(239,68,68,0.1)', color: '#ef4444', cursor: 'pointer', fontSize: 12 }}>🐛 Bug 回流</button>
        </div>
      </div>

      {/* 需求摘要 */}
      <div style={{ background: '#0d1526', border: '1px solid #1e2d45', borderRadius: 10, padding: '12px 16px', marginBottom: 28, fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>
        📝 {req.summary}
      </div>

      {/* DAG */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {rows.map((rowNodes, rowIdx) => {
          const gate = gates.find(g => g.afterRow === rowIdx)
          const isExpanded = gate ? expandedGateId === gate.id : false
          const detail = gate ? gateDetails[gate.id] : null

          return (
            <React.Fragment key={rowIdx}>
              {/* 连接线 */}
              {rowIdx > 0 && <div style={{ width: 1, height: 20, background: '#1e2d45' }} />}

              {/* Row */}
              <div style={{ display: 'flex', gap: 20, justifyContent: 'center', alignItems: 'flex-start' }}>
                {rowNodes.map(node => {
                  const ss = statusStyle(node.status)
                  const isSelected = selectedId === node.id
                  const isClickable = node.status !== 'pending'
                  return (
                    <div key={node.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div
                        onClick={() => isClickable && handleNodeClick(node)}
                        style={{
                          ...ss,
                          borderRadius: 10, padding: '12px 14px',
                          minWidth: 148, maxWidth: 160,
                          cursor: isClickable ? 'pointer' : 'default',
                          opacity: isClickable ? 1 : 0.45,
                          transition: 'all 0.2s',
                          boxShadow: isSelected
                            ? `0 0 0 2px ${node.color}, 0 4px 20px rgba(0,0,0,0.3)`
                            : '0 2px 8px rgba(0,0,0,0.2)',
                          position: 'relative', overflow: 'hidden',
                        }}
                      >
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: node.color, borderRadius: '10px 10px 0 0' }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                          <span style={{ fontSize: 15 }}>{node.icon}</span>
                          <span style={{ fontWeight: 600, fontSize: 13, color: '#f1f5f9' }}>{node.label}</span>
                        </div>
                        <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.4, marginBottom: 8 }}>{node.desc}</div>
                        <div style={{ fontSize: 10, color: statusColor[node.status], fontWeight: 600 }}>{statusLabel[node.status]}</div>
                        {node.parallel && (
                          <div style={{ position: 'absolute', top: 8, right: 8, fontSize: 9, color: '#475569', background: '#0d1526', padding: '1px 4px', borderRadius: 3 }}>并行</div>
                        )}
                      </div>
                      {/* 执行模式标签 */}
                      {node.mode && (
                        <div style={{
                          marginTop: 6, fontSize: 10, padding: '2px 8px', borderRadius: 10,
                          background: node.mode === 'agent' ? 'rgba(59,130,246,0.12)' : 'rgba(139,92,246,0.12)',
                          color: node.mode === 'agent' ? '#60a5fa' : '#a78bfa',
                          border: `1px solid ${node.mode === 'agent' ? '#3b82f644' : '#8b5cf644'}`
                        }}>
                          {node.mode === 'agent' ? '🤖 自主交付' : `🤝 ${node.platform}`}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Gate + Inline Detail Panel */}
              {gate && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 680 }}>
                  <div style={{ width: 1, height: 18, background: '#1e2d45' }} />

                  {/* Gate Button */}
                  <button
                    onClick={() => toggleGateDetail(gate)}
                    style={{
                      padding: '6px 18px', borderRadius: 20,
                      background: isExpanded ? `${gateColor[gate.status]}28` : `${gateColor[gate.status]}18`,
                      border: `1px solid ${gateColor[gate.status]}`,
                      color: gateColor[gate.status],
                      fontSize: 11, cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap',
                      display: 'flex', alignItems: 'center', gap: 6,
                      transition: 'all 0.15s',
                      boxShadow: isExpanded ? `0 0 12px ${gateColor[gate.status]}33` : 'none',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = `${gateColor[gate.status]}30`)}
                    onMouseLeave={e => (e.currentTarget.style.background = isExpanded ? `${gateColor[gate.status]}28` : `${gateColor[gate.status]}18`)}
                  >
                    {gateLabel[gate.status]} · {gate.label}
                    <span style={{
                      fontSize: 10, opacity: 0.7,
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.25s',
                      display: 'inline-block',
                    }}>▾</span>
                  </button>

                  {/* Inline Detail Panel */}
                  {detail && isExpanded && (
                    <GateDetailPanel
                      gate={gate}
                      detail={detail}
                      onClose={() => setExpandedGateId(null)}
                      onApprove={() => approveGate(gate.id)}
                      onReject={() => rejectGate(gate.id)}
                    />
                  )}

                  <div style={{ width: 1, height: 18, background: '#1e2d45' }} />
                </div>
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* Modals */}
      {modeModal && <ModeModal node={modeModal} onSelect={handleModeSelect} onClose={() => setModeModal(null)} />}
      {agentNode && <AgentPanel node={agentNode} onClose={() => setAgentNode(null)} />}
    </div>
  )
}

// ─── Entry Page ───────────────────────────────────────────────────────────────

const RECENT_LINKS = [
  { url: 'https://req.internal.com/req/20260304/ACTIVITY-001', title: '活动发放系统', priority: 'P0', owner: '陈晓明' },
  { url: 'https://req.internal.com/req/20260301/MEMBER-CARD-089', title: '会员卡权益改版', priority: 'P1', owner: '李婷' },
  { url: 'https://req.internal.com/req/20260228/RISK-ENGINE-023', title: '风控引擎升级', priority: 'P0', owner: '王磊' },
]

export default function DeliveryFlowPage() {
  const [dimaUrl, setDimaUrl] = useState('')
  const [req, setReq] = useState<ParsedReq | null>(null)
  const [loading, setLoading] = useState(false)
  const [inputFocused, setInputFocused] = useState(false)

  const handleSubmit = (url: string) => {
    if (!url.trim()) return
    setLoading(true)
    setTimeout(() => {
      setReq(parseDimaUrl(url))
      setLoading(false)
    }, 1200)
  }

  if (req) {
    return <FlowView req={req} dimaUrl={dimaUrl} onReset={() => { setReq(null); setDimaUrl('') }} />
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0f1e',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px',
    }}>
      {/* 标题区 */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⚡</div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#f1f5f9', margin: 0, marginBottom: 10 }}>
          AI 研发流程
        </h1>
        <p style={{ color: '#64748b', fontSize: 15, margin: 0, maxWidth: 420, lineHeight: 1.6 }}>
          输入需求链接，自动解析需求并生成围绕该需求的 AI 交付任务流程
        </p>
      </div>

      {/* 输入框 */}
      <div style={{ width: '100%', maxWidth: 560 }}>
        <div style={{
          display: 'flex', gap: 0,
          border: `1.5px solid ${inputFocused ? '#3b82f6' : '#1e2d45'}`,
          borderRadius: 12, overflow: 'hidden',
          background: '#0d1526',
          boxShadow: inputFocused ? '0 0 0 3px rgba(59,130,246,0.15)' : 'none',
          transition: 'all 0.2s',
        }}>
          <div style={{ padding: '14px 16px', color: '#475569', fontSize: 15 }}>🔗</div>
          <input
            value={dimaUrl}
            onChange={e => setDimaUrl(e.target.value)}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit(dimaUrl)}
            placeholder="粘贴需求链接，例如 https://req.internal.com/req/..."
            style={{
              flex: 1, padding: '14px 0', background: 'transparent',
              border: 'none', outline: 'none', color: '#f1f5f9', fontSize: 14,
            }}
          />
          <button
            onClick={() => handleSubmit(dimaUrl)}
            disabled={loading || !dimaUrl.trim()}
            style={{
              padding: '0 24px', background: dimaUrl.trim() ? '#3b82f6' : '#1e2d45',
              border: 'none', color: dimaUrl.trim() ? '#fff' : '#475569',
              cursor: dimaUrl.trim() ? 'pointer' : 'default',
              fontSize: 14, fontWeight: 600, transition: 'all 0.2s',
              minWidth: 80,
            }}
          >
            {loading ? '解析中...' : '开始'}
          </button>
        </div>

        {/* 加载动画 */}
        {loading && (
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: 13 }}>
              <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              正在解析需求，生成交付流程...
            </div>
          </div>
        )}
      </div>

      {/* 最近使用 */}
      <div style={{ width: '100%', maxWidth: 560, marginTop: 36 }}>
        <div style={{ fontSize: 11, color: '#334155', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
          最近使用
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {RECENT_LINKS.map(item => (
            <button
              key={item.url}
              onClick={() => { setDimaUrl(item.url); handleSubmit(item.url) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px', borderRadius: 10,
                background: '#0d1526', border: '1px solid #1e2d45',
                color: '#f1f5f9', cursor: 'pointer', textAlign: 'left',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#334155')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#1e2d45')}
            >
              <span style={{ fontSize: 18 }}>📋</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{item.title}</div>
                <div style={{ fontSize: 11, color: '#475569', fontFamily: 'monospace' }}>{item.url}</div>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 6, background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid #ef444433' }}>{item.priority}</span>
                <span style={{ fontSize: 11, color: '#475569' }}>{item.owner}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 功能说明 */}
      <div style={{ display: 'flex', gap: 20, marginTop: 48, flexWrap: 'wrap', justifyContent: 'center' }}>
        {[
          ['🔀', 'DAG 并行编排', '多节点并行，自动识别依赖关系'],
          ['🔒', '准入准出卡点', '需求/方案/代码/上线四道评审门'],
          ['🤝', '人工协同', '跳转 Muse / Maco / Neo 等平台'],
          ['🤖', '自主交付', 'Agent 全程接管，对话式完成'],
        ].map(([icon, title, desc]) => (
          <div key={title} style={{ textAlign: 'center', maxWidth: 130 }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>{title}</div>
            <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.5 }}>{desc}</div>
          </div>
        ))}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
