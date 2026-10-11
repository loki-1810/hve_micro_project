import React from 'react';

export default function StatCard({ label, value, icon: Icon, subtext, statusColor }) {
  return (
    <div className="stat-card">
      <div>
        <div className="stat-header">
          <span className="stat-label">{label}</span>
          {Icon && <Icon size={18} className="stat-icon" />}
        </div>
        <div className="stat-value" style={statusColor ? { color: statusColor } : {}}>
          {value}
        </div>
      </div>
      {subtext && <div className="stat-subtext">{subtext}</div>}
    </div>
  );
}
