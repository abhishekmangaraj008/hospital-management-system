import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function DashboardLayout({ tabs, activeTab, onTabChange, children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="dash-shell">
      <aside className="sidebar">
        <div className="brand">MediCare</div>
        <div className="role-tag">{user?.role} · {user?.fullName}</div>
        <nav>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={activeTab === tab.key ? 'active' : ''}
              onClick={() => onTabChange(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <button className="logout-btn" onClick={handleLogout}>Log out</button>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  )
}
