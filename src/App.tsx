import React, { useState } from 'react'
import OverviewPage from './components/OverviewPage'
import KnowledgePage from './components/KnowledgePage'
import DeliveryFlowPage from './components/DeliveryFlowPage'
import MetricsDashboardPage from './components/MetricsDashboardPage'
import ToolsListPage from './components/ToolsListPage'
import GuidelinesPage from './components/GuidelinesPage'

const navItems = [
  { id: 'overview', label: '整体方案', icon: '🗺️' },
  { id: 'knowledge', label: '知识管理', icon: '🧠' },
  { id: 'delivery', label: '研发流程', icon: '⚡' },
  { id: 'metrics', label: '效能大盘', icon: '📊' },
  { id: 'tools', label: '工具列表', icon: '🛠️' },
  { id: 'guidelines', label: '使用规范', icon: '📋' },
]

const navIds = ['overview', 'knowledge', 'delivery', 'metrics', 'tools', 'guidelines']

export default function App() {
  const [active, setActive] = useState('overview')

  const handleNavigate = (index: number) => {
    const id = navIds[index]
    if (id) setActive(id)
  }

  const pageMap: Record<string, React.ReactElement> = {
    overview: <OverviewPage onNavigate={handleNavigate} />,
    knowledge: <KnowledgePage />,
    delivery: <DeliveryFlowPage />,
    metrics: <MetricsDashboardPage />,
    tools: <ToolsListPage />,
    guidelines: <GuidelinesPage />,
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0f1e', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* 左侧导航 */}
      <aside style={{
        width: 220,
        minHeight: '100vh',
        background: '#0d1526',
        borderRight: '1px solid #1e2d45',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{ padding: '28px 24px 20px', borderBottom: '1px solid #1e2d45' }}>
          <div style={{ fontSize: 13, color: '#3b82f6', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
            AI Delivery
          </div>
          <div style={{ fontSize: 11, color: '#475569', letterSpacing: '0.05em' }}>
            支付宝效能平台 Demo
          </div>
        </div>

        {/* Nav Items */}
        <nav style={{ flex: 1, padding: '16px 12px' }}>
          {navItems.map(item => {
            const isActive = active === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActive(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '10px 12px',
                  marginBottom: 4,
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  background: isActive ? 'rgba(59,130,246,0.15)' : 'transparent',
                  color: isActive ? '#60a5fa' : '#94a3b8',
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 400,
                  textAlign: 'left',
                  transition: 'all 0.15s',
                  borderLeft: isActive ? '2px solid #3b82f6' : '2px solid transparent',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)'
                    ;(e.currentTarget as HTMLButtonElement).style.color = '#cbd5e1'
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                    ;(e.currentTarget as HTMLButtonElement).style.color = '#94a3b8'
                  }
                }}
              >
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                <span>{item.label}</span>
                {isActive && (
                  <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: '#3b82f6' }} />
                )}
              </button>
            )
          })}
        </nav>

        {/* 底部 */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #1e2d45' }}>
          <div style={{ fontSize: 11, color: '#334155', textAlign: 'center' }}>
            v0.1.0 · Internal Demo
          </div>
        </div>
      </aside>

      {/* 右侧内容区 */}
      <main style={{ marginLeft: 220, flex: 1, minHeight: '100vh', overflow: 'auto' }}>
        {pageMap[active]}
      </main>
    </div>
  )
}
