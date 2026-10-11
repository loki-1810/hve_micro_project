import React from 'react';
import {
  LayoutDashboard,
  Database,
  ShieldAlert,
  Sparkles,
  BarChart3,
  History,
  Binary
} from 'lucide-react';

export default function Sidebar({ currentPage, setCurrentPage, activeDataset }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'collect', label: 'Collect Data', icon: Database },
    {
      id: 'quality',
      label: 'Data Quality',
      icon: ShieldAlert,
      badge: activeDataset?.validation?.issues?.filter(i => i.type !== 'info')?.length || null
    },
    { id: 'clean', label: 'Clean Dataset', icon: Sparkles },
    { id: 'explore', label: 'Explore Data', icon: BarChart3 },
    { id: 'history', label: 'Dataset History', icon: History },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-badge">
          <Binary size={18} />
        </div>
        <div className="logo-text">
          <h1>ML DataPrep</h1>
          <span>College Micro-Project</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`nav-item ${isActive ? 'active' : ''}`}
              title={item.label}
            >
              <Icon size={18} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge && item.badge > 0 && (
                <span className="badge badge-warning" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
          Final Year B.Tech Project
        </div>
        <div>AI & Data Science</div>
        <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }}></span>
          <span>Local Engine Active</span>
        </div>
      </div>
    </aside>
  );
}
