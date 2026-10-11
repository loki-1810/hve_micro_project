import React from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Info,
  Copy,
  Layers,
  ArrowRight,
  Database,
  Sparkles
} from 'lucide-react';
import AlertBanner from '../components/AlertBanner';

export default function DataQuality({ activeDataset, setCurrentPage }) {
  if (!activeDataset || !activeDataset.validation) {
    return (
      <div className="empty-state">
        <ShieldAlert className="empty-icon" />
        <h3 className="empty-title">No Dataset Loaded for Quality Inspection</h3>
        <p className="empty-desc">
          Please select a sample dataset, upload a CSV file, or enter manual data first to perform an audit.
        </p>
        <button onClick={() => setCurrentPage('collect')} className="btn btn-primary">
          <Database size={16} /> Collect Data
        </button>
      </div>
    );
  }

  const { validation, name, total_rows, total_columns } = activeDataset;
  const {
    quality_score,
    issues = [],
    columns = [],
    duplicate_rows_count = 0,
    duplicate_percentage = 0,
    total_missing_cells = 0,
    overall_missing_percentage = 0,
    numerical_columns = [],
    categorical_columns = []
  } = validation;

  const scoreColor =
    quality_score >= 85 ? 'var(--success)' : quality_score >= 65 ? 'var(--warning)' : 'var(--danger)';

  const nonInfoIssues = issues.filter((i) => i.type !== 'info');

  return (
    <div>
      {/* Top Overview: Quality Meter & Summary */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <ShieldAlert size={18} style={{ color: 'var(--primary)' }} />
              <span>Dataset Quality Audit: {name}</span>
            </div>
            <div className="card-subtitle">
              Automated heuristics check for missing values, duplicates, and feature integrity
            </div>
          </div>
          <button
            onClick={() => setCurrentPage('clean')}
            className="btn btn-primary btn-sm"
          >
            <Sparkles size={14} />
            <span>Proceed to Clean Data</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="quality-meter">
          <div className="score-circle" style={{ backgroundColor: scoreColor }}>
            <span className="number">{quality_score}</span>
            <span className="label">HEALTH</span>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {quality_score >= 85
                  ? 'High Quality Dataset'
                  : quality_score >= 65
                  ? 'Moderate Quality — Cleaning Recommended'
                  : 'Low Quality — Preprocessing Critical'}
              </h3>
              <span className={`badge ${quality_score >= 85 ? 'badge-success' : 'badge-warning'}`}>
                Score: {quality_score}/100
              </span>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              {nonInfoIssues.length === 0
                ? 'No critical defects found. All columns have complete data with no redundant records.'
                : `Detected ${nonInfoIssues.length} data quality concern${
                    nonInfoIssues.length === 1 ? '' : 's'
                  } that could introduce bias or runtime exceptions during machine learning model fitting.`}
            </p>
          </div>
        </div>

        {/* 4 Key Validation Metric Tiles */}
        <div className="grid-3" style={{ marginTop: '1.25rem' }}>
          <div style={{ padding: '0.875rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Missing Values</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, color: total_missing_cells > 0 ? 'var(--danger-text)' : 'var(--text-main)', marginTop: '0.15rem' }}>
              {total_missing_cells} cells <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>({overall_missing_percentage}%)</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              {total_missing_cells > 0 ? 'Requires imputation or deletion' : 'Clean & complete'}
            </div>
          </div>

          <div style={{ padding: '0.875rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Duplicate Records</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, color: duplicate_rows_count > 0 ? 'var(--warning-text)' : 'var(--text-main)', marginTop: '0.15rem' }}>
              {duplicate_rows_count} rows <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>({duplicate_percentage}%)</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              {duplicate_rows_count > 0 ? 'Can cause sample weight imbalance' : 'No duplicates'}
            </div>
          </div>

          <div style={{ padding: '0.875rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Feature Breakdown</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.15rem' }}>
              {numerical_columns.length} num <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-muted)' }}>/</span> {categorical_columns.length} cat
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Total: {total_columns} columns
            </div>
          </div>
        </div>
      </div>

      {/* Issues Diagnostic List */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <AlertTriangle size={18} style={{ color: '#d97706' }} />
            <span>Diagnostics & Actionable Recommendations</span>
          </div>
          <span className="badge badge-neutral">{issues.length} notifications</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {issues.map((issue, idx) => (
            <AlertBanner
              key={idx}
              type={issue.type}
              title={issue.title}
              message={issue.description}
              suggestion={issue.suggestion}
            />
          ))}
        </div>
      </div>

      {/* Column Schema & Missing Analysis Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Layers size={18} style={{ color: 'var(--primary)' }} />
            <span>Column Schema & Quality Profile</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Inspection by column
          </span>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Column Name</th>
                <th>Inferred Type</th>
                <th>Raw DType</th>
                <th>Missing Count</th>
                <th>Missing %</th>
                <th>Unique Values</th>
                <th>Sample Values</th>
              </tr>
            </thead>
            <tbody>
              {columns.map((col) => (
                <tr key={col.name}>
                  <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{col.name}</td>
                  <td>
                    <span
                      className={`badge ${
                        col.inferred_type === 'numerical'
                          ? 'badge-info'
                          : col.inferred_type === 'categorical'
                          ? 'badge-neutral'
                          : 'badge-neutral'
                      }`}
                    >
                      {col.inferred_type}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {col.dtype}
                  </td>
                  <td>
                    {col.missing_count > 0 ? (
                      <span style={{ color: 'var(--danger-text)', fontWeight: 600 }}>
                        {col.missing_count}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--success-text)' }}>0</span>
                    )}
                  </td>
                  <td>
                    {col.missing_percentage > 0 ? (
                      <span className="badge badge-warning">{col.missing_percentage}%</span>
                    ) : (
                      <span className="badge badge-success">0%</span>
                    )}
                  </td>
                  <td>{col.unique_values_count}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {col.samples && col.samples.length > 0 ? col.samples.join(', ') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
