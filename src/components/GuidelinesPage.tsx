import React, { useState } from 'react';

// ─── Style tokens ─────────────────────────────────────────────────────────────

const C = {
  bg:     '#0a0f1e',
  card:   '#1a2235',
  border: '#1e2d45',
  text:   '#f1f5f9',
  muted:  '#94a3b8',
  blue:   '#3b82f6',
  green:  '#10b981',
  purple: '#8b5cf6',
  orange: '#f59e0b',
  red:    '#ef4444',
  radius: '12px',
} as const;

// ─── Procurement Tab ──────────────────────────────────────────────────────────

const steps = [
  { num: 1, icon: '📝', title: '提交申请', desc: '在内部系统填写工具申请表，说明使用场景和预算' },
  { num: 2, icon: '✅', title: '部门审批', desc: '部门负责人在5个工作日内审批，超额需额外审批' },
  { num: 3, icon: '💳', title: '财务采购', desc: '财务统一采购，避免个人付款，保留发票' },
  { num: 4, icon: '📄', title: '报销凭证', desc: '提交发票和使用说明，按季度报销' },
];

const tableData = [
  { tool: 'Claude Code',    method: '企业账号', type: '软件服务费', cost: '$20/人',  note: '需IT审批'       },
  { tool: 'Cursor',         method: '企业订阅', type: '软件服务费', cost: '$40/人',  note: '可团购'         },
  { tool: 'GitHub Copilot', method: '企业账号', type: '软件服务费', cost: '$19/人',  note: '通过IT统一购买' },
  { tool: 'OpenCode',       method: '开源免费', type: '无需报销',   cost: '免费',    note: '直接使用'       },
];

const faqs = [
  {
    q: '可以用个人信用卡购买吗？',
    a: '不建议，建议通过企业采购流程，个人垫付需提前申请。',
  },
  {
    q: '试用期可以免费使用吗？',
    a: '内部评估中的工具可申请试用账号，联系效能团队获取。',
  },
  {
    q: '报销需要多长时间？',
    a: '按季度报销，提交后15个工作日内到账。',
  },
];

const ProcurementTab: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Steps */}
      <section>
        <SectionTitle>采买流程</SectionTitle>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0', marginTop: '20px', position: 'relative' }}>
          {steps.map((step, idx) => (
            <React.Fragment key={step.num}>
              {/* Step card */}
              <div style={{
                flex: 1,
                backgroundColor: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: C.radius,
                padding: '20px 16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: '10px',
                position: 'relative',
                zIndex: 1,
              }}>
                {/* Step number badge */}
                <div style={{
                  width: '28px', height: '28px',
                  borderRadius: '50%',
                  backgroundColor: C.blue,
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '2px',
                }}>
                  {step.num}
                </div>
                <span style={{ fontSize: '24px' }}>{step.icon}</span>
                <div style={{ fontSize: '14px', fontWeight: 600, color: C.text }}>{step.title}</div>
                <div style={{ fontSize: '12px', color: C.muted, lineHeight: 1.6 }}>{step.desc}</div>
              </div>

              {/* Connector arrow */}
              {idx < steps.length - 1 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  flexShrink: 0,
                  alignSelf: 'center',
                  color: C.blue,
                  fontSize: '18px',
                  zIndex: 2,
                }}>
                  →
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* Table */}
      <section>
        <SectionTitle>常见工具采买指引</SectionTitle>
        <div style={{
          marginTop: '16px',
          backgroundColor: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: C.radius,
          overflow: 'hidden',
        }}>
          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr 1fr 0.8fr 1.2fr',
            padding: '12px 20px',
            borderBottom: `1px solid ${C.border}`,
            backgroundColor: `${C.blue}10`,
          }}>
            {['工具', '采买方式', '报销类型', '月均费用', '注意事项'].map((h) => (
              <span key={h} style={{ fontSize: '12px', fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
            ))}
          </div>
          {/* Rows */}
          {tableData.map((row, i) => (
            <div
              key={row.tool}
              style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 1fr 1fr 0.8fr 1.2fr',
                padding: '14px 20px',
                borderBottom: i < tableData.length - 1 ? `1px solid ${C.border}` : 'none',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '14px', fontWeight: 600, color: C.text }}>{row.tool}</span>
              <span style={{ fontSize: '13px', color: C.muted }}>{row.method}</span>
              <span style={{ fontSize: '13px', color: C.muted }}>{row.type}</span>
              <span style={{
                fontSize: '13px', fontWeight: 600,
                color: row.cost === '免费' ? C.green : C.orange,
              }}>{row.cost}</span>
              <span style={{
                fontSize: '12px',
                color: C.blue,
                backgroundColor: `${C.blue}15`,
                borderRadius: '6px',
                padding: '3px 10px',
                display: 'inline-block',
              }}>{row.note}</span>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Accordion */}
      <section>
        <SectionTitle>常见问题</SectionTitle>
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {faqs.map((faq, i) => {
            const open = openFaq === i;
            return (
              <div
                key={i}
                style={{
                  backgroundColor: C.card,
                  border: `1px solid ${open ? C.blue : C.border}`,
                  borderRadius: C.radius,
                  overflow: 'hidden',
                  transition: 'border-color 0.2s',
                }}
              >
                <button
                  onClick={() => setOpenFaq(open ? null : i)}
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: '14px', fontWeight: 500, color: C.text }}>
                    Q：{faq.q}
                  </span>
                  <span style={{
                    fontSize: '18px',
                    color: C.blue,
                    transform: open ? 'rotate(45deg)' : 'none',
                    transition: 'transform 0.2s',
                    lineHeight: 1,
                    flexShrink: 0,
                    marginLeft: '12px',
                  }}>+</span>
                </button>
                {open && (
                  <div style={{
                    padding: '0 20px 16px',
                    fontSize: '13px',
                    color: C.muted,
                    lineHeight: 1.7,
                    borderTop: `1px solid ${C.border}`,
                    paddingTop: '12px',
                  }}>
                    A：{faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

// ─── Security Tab ─────────────────────────────────────────────────────────────

const forbidden = [
  '禁止将客户真实数据、交易数据输入任何AI工具',
  '禁止使用未经IT审批的AI工具处理生产数据',
  '禁止将代码仓库完整内容上传至外部AI服务',
  '禁止在AI对话中透露系统架构和安全配置',
];

const recommended = [
  '使用脱敏数据进行AI辅助开发和测试',
  '优先使用内部部署的AI工具（Maco/Neo/DeepTest）',
  '定期检查AI生成代码的安全性',
  '发现安全问题及时上报安全团队',
];

const dataLevels = [
  { level: 'L1', label: '公开数据',   desc: '可直接输入AI工具，无限制',                   color: C.green  },
  { level: 'L2', label: '内部数据',   desc: '需脱敏后使用，建议内部工具',                 color: C.blue   },
  { level: 'L3', label: '敏感数据',   desc: '禁止输入外部AI，仅限内部工具',               color: C.orange },
  { level: 'L4', label: '机密数据',   desc: '禁止任何AI工具处理，需人工处理',             color: C.red    },
];

const SecurityTab: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
    {/* Forbidden */}
    <section>
      <SectionTitle>🚫 禁止事项</SectionTitle>
      <div style={{
        marginTop: '16px',
        backgroundColor: `${C.red}0d`,
        border: `1px solid ${C.red}40`,
        borderRadius: C.radius,
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}>
        {forbidden.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <span style={{ fontSize: '16px', flexShrink: 0, marginTop: '1px' }}>⚠️</span>
            <span style={{ fontSize: '14px', color: '#fca5a5', lineHeight: 1.6 }}>
              <span style={{ fontWeight: 600, color: C.red, marginRight: '4px' }}>🚫</span>
              {item}
            </span>
          </div>
        ))}
      </div>
    </section>

    {/* Recommended */}
    <section>
      <SectionTitle>✅ 推荐做法</SectionTitle>
      <div style={{
        marginTop: '16px',
        backgroundColor: `${C.green}0d`,
        border: `1px solid ${C.green}40`,
        borderRadius: C.radius,
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}>
        {recommended.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <span style={{ fontSize: '16px', flexShrink: 0, marginTop: '1px' }}>✅</span>
            <span style={{ fontSize: '14px', color: '#6ee7b7', lineHeight: 1.6 }}>{item}</span>
          </div>
        ))}
      </div>
    </section>

    {/* Data levels */}
    <section>
      <SectionTitle>数据分级说明</SectionTitle>
      <div style={{
        marginTop: '16px',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '14px',
      }}>
        {dataLevels.map((dl) => (
          <div key={dl.level} style={{
            backgroundColor: C.card,
            border: `1px solid ${dl.color}50`,
            borderRadius: C.radius,
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}>
            {/* Level badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px', height: '40px',
              borderRadius: '10px',
              backgroundColor: `${dl.color}20`,
              border: `1px solid ${dl.color}50`,
            }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: dl.color }}>{dl.level}</span>
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: C.text }}>{dl.label}</div>
            <div style={{ fontSize: '12px', color: C.muted, lineHeight: 1.6 }}>{dl.desc}</div>
            {/* Color indicator bar */}
            <div style={{
              height: '3px',
              borderRadius: '2px',
              backgroundColor: dl.color,
              opacity: 0.6,
              marginTop: '4px',
            }} />
          </div>
        ))}
      </div>
    </section>
  </div>
);

// ─── Shared helpers ───────────────────────────────────────────────────────────

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
    <div style={{ width: '3px', height: '18px', backgroundColor: C.blue, borderRadius: '2px', flexShrink: 0 }} />
    <h2 style={{ fontSize: '16px', fontWeight: 700, color: C.text, margin: 0 }}>{children}</h2>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const GuidelinesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'procurement' | 'security'>('procurement');

  return (
    <div style={{ backgroundColor: C.bg, minHeight: '100vh', padding: '32px 24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Page title */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: C.text, margin: 0 }}>使用规范</h1>
        <p style={{ fontSize: '14px', color: C.muted, marginTop: '6px' }}>AI 工具采买报销流程与安全使用指南</p>
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
        marginBottom: '32px',
      }}>
        {([
          { key: 'procurement', label: '采买报销流程', icon: '💳' },
          { key: 'security',    label: '安全使用规范', icon: '🔒' },
        ] as const).map(({ key, label, icon }) => {
          const active = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
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
              <span>{icon}</span>
              {label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'procurement' ? <ProcurementTab /> : <SecurityTab />}
    </div>
  );
};

export default GuidelinesPage;
