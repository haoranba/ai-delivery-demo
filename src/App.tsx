import React, { useState } from 'react'
import { Map, Brain, Zap, BarChart2, Wrench, ClipboardList, Sun, Moon } from 'lucide-react'
import OverviewPage from './components/OverviewPage'
import KnowledgePage from './components/KnowledgePage'
import DeliveryFlowPage from './components/DeliveryFlowPage'
import MetricsDashboardPage from './components/MetricsDashboardPage'
import ToolsListPage from './components/ToolsListPage'
import GuidelinesPage from './components/GuidelinesPage'
import { useTheme, useThemeToggle } from './ThemeContext'

const navItems: { id: string; label: string; icon: React.ReactElement }[] = [
  { id: 'overview',   label: '整体方案', icon: <Map size={16} /> },
  { id: 'knowledge',  label: '知识管理', icon: <Brain size={16} /> },
  { id: 'delivery',   label: '研发流程', icon: <Zap size={16} /> },
  { id: 'metrics',    label: '效能大盘', icon: <BarChart2 size={16} /> },
  { id: 'tools',      label: '工具列表', icon: <Wrench size={16} /> },
  { id: 'guidelines', label: '使用规范', icon: <ClipboardList size={16} /> },
]

const navIds = ['overview', 'knowledge', 'delivery', 'metrics', 'tools', 'guidelines']

export default function App() {
  const [active, setActive] = useState('overview')
  const C = useTheme()
  const { mode, toggle } = useThemeToggle()

  const handleNavigate = (index: number) => {
    const id = navIds[index]
    if (id) setActive(id)
  }

  const pageMap: Record<string, React.ReactElement> = {
    overview:   <OverviewPage onNavigate={handleNavigate} />,
    knowledge:  <KnowledgePage />,
    delivery:   <DeliveryFlowPage />,
    metrics:    <MetricsDashboardPage />,
    tools:      <ToolsListPage />,
    guidelines: <GuidelinesPage />,
  }

  // Active nav text is brighter blue in dark mode, solid blue in light mode
  const navActiveColor = mode === 'dark' ? '#60a5fa' : C.blue

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.bg, fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* 左侧导航 */}
      <aside style={{
        width: 220,
        minHeight: '100vh',
        background: C.sidebarBg,
        borderRight: `1px solid ${C.border}`,
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{ padding: '28px 24px 20px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 13, color: C.blue, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
            AI Delivery
          </div>
          <div style={{ fontSize: 11, color: C.muted, letterSpacing: '0.05em' }}>
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
                  background: isActive ? `${C.blue}26` : 'transparent',
                  color: isActive ? navActiveColor : C.muted,
                  fontSize: 14,
                  fontWeight: isActive ? 600 : 400,
                  textAlign: 'left',
                  transition: 'all 0.15s',
                  borderLeft: isActive ? `2px solid ${C.blue}` : '2px solid transparent',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    ;(e.currentTarget as HTMLButtonElement).style.background =
                      mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'
                    ;(e.currentTarget as HTMLButtonElement).style.color = C.text
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                    ;(e.currentTarget as HTMLButtonElement).style.color = C.muted
                  }
                }}
              >
                {item.icon}
                <span>{item.label}</span>
                {isActive && (
                  <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: C.blue }} />
                )}
              </button>
            )
          })}
        </nav>

        {/* 底部 */}
        <div style={{ padding: '16px 24px', borderTop: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* 主题切换按钮 */}
          <button
            onClick={toggle}
            title={mode === 'light' ? '切换到夜间模式' : '切换到日间模式'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              width: '100%',
              padding: '7px 0',
              borderRadius: 8,
              border: `1px solid ${C.border}`,
              cursor: 'pointer',
              background: 'transparent',
              color: C.muted,
              fontSize: 12,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              ;(e.currentTarget as HTMLButtonElement).style.background = `${C.blue}15`
              ;(e.currentTarget as HTMLButtonElement).style.color = C.blue
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = `${C.blue}60`
            }}
            onMouseLeave={e => {
              ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
              ;(e.currentTarget as HTMLButtonElement).style.color = C.muted
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = C.border
            }}
          >
            {mode === 'light' ? <Moon size={13} /> : <Sun size={13} />}
            {mode === 'light' ? '夜间模式' : '日间模式'}
          </button>
          <div style={{ fontSize: 11, color: C.border, textAlign: 'center' }}>
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
