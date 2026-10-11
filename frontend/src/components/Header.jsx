import React from 'react';
import { Database, PlusCircle, CheckCircle2 } from 'lucide-react';

const PAGE_TITLES = {
  dashboard: 'Workspace Overview & Metrics',
  collect: 'Collect & Ingest Data',
  quality: 'Data Validation & Quality Inspection',
  clean: 'Clean & Preprocess Dataset',
  explore: 'Exploratory Data Analysis',
  history: 'Session History & Export Center'
};

export default function Header({ currentPage, setCurrentPage, activeDataset }) {
  return (
    <header className="top-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <h2 className="page-title">{PAGE_TITLES[currentPage] || 'Data Collection'}</h2>
      </div>

      <div className="header-status">
        {activeDataset ? (
          <div className="active-dataset-chip">
            <span className="chip-dot" />
            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
              {activeDataset.name}
            </span>
            <span style={{ color: 'var(--text-muted)' }}>
              ({activeDataset.total_rows} rows × {activeDataset.total_columns} cols)
            </span>
            {activeDataset.cleaned_data && (
              <span className="badge badge-success" style={{ marginLeft: '0.25rem' }}>
                <CheckCircle2 size={12} /> Cleaned
              </span>
            )}
          </div>
        ) : (
          <button
            onClick={() => setCurrentPage('collect')}
            className="btn btn-primary btn-sm"
          >
            <PlusCircle size={14} />
            <span>Select Dataset</span>
          </button>
        )}

        <div className="session-indicator" title="Data stored in browser memory & local storage">
          <Database size={14} />
          <span>Local Session</span>
        </div>
      </div>
    </header>
  );
}
