import React from 'react';
import { AlertTriangle, AlertCircle, CheckCircle, Info } from 'lucide-react';

export default function AlertBanner({ type = 'info', title, message, suggestion }) {
  const icons = {
    warning: AlertTriangle,
    danger: AlertCircle,
    success: CheckCircle,
    info: Info
  };

  const Icon = icons[type] || Info;

  return (
    <div className={`alert alert-${type}`}>
      <Icon size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
      <div style={{ flex: 1 }}>
        {title && <div style={{ fontWeight: 600, marginBottom: '0.15rem' }}>{title}</div>}
        {message && <div>{message}</div>}
        {suggestion && (
          <div style={{ marginTop: '0.35rem', fontSize: '0.8rem', opacity: 0.9 }}>
            <strong>Recommendation:</strong> {suggestion}
          </div>
        )}
      </div>
    </div>
  );
}
