import { useState } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'

const MENU_ITEMS = [
  { label: 'Отчетность', icon: '📊' },
  { label: 'Протоколы', icon: '📄' },
  { label: 'Поручения', icon: '📋' },
  { label: 'График', icon: '📅' },
  { label: 'Судебные дела', icon: '⚖️', arrow: true },
  { label: 'ПСД', icon: '📁', arrow: true },
  { label: 'СМР', icon: '📁', arrow: true },
]

const OPISER_SUB = [
  { to: '/opiser/kadry', label: 'Кадры' },
  { to: '/opiser/risk-map', label: 'Карта социальных рисков' },
  { to: '/opiser/orders-gg', label: 'Поручения ГГ' },
  { to: '/opiser/ser', label: 'СЭР' },
]

export default function Layout() {
  const [opiserOpen, setOpiserOpen] = useState(true)
  const location = useLocation()
  const isOpiser = location.pathname.startsWith('/opiser')

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">protocol</div>
        <nav className="sidebar-nav">
          {MENU_ITEMS.map((item) => (
            <button key={item.label} className="nav-item" type="button">
              <span>{item.icon}</span>
              <span>{item.label}</span>
              {item.arrow && <span className="arrow">›</span>}
            </button>
          ))}
          <div>
            <button
              type="button"
              className={`nav-item ${isOpiser ? 'active expanded' : ''}`}
              onClick={() => setOpiserOpen(!opiserOpen)}
            >
              <span>👥</span>
              <span>ОПИСЭР</span>
              <span className="arrow">›</span>
            </button>
            {opiserOpen && (
              <div className="subnav">
                {OPISER_SUB.map(({ to, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  >
                    <span>{label}</span>
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        </nav>
        <div className="sidebar-user">
          <div className="name">Смагулова Мадиа...</div>
          <div className="email">yerzhan.adayev@g...</div>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
