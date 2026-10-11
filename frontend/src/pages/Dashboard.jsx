import React from 'react';
import {
  Database,
  Layers,
  AlertTriangle,
  CheckCircle2,
  PlusCircle,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  BarChart3,
  Clock
} from 'lucide-react';
import StatCard from '../components/StatCard';

export default function Dashboard({
  sessionStats,
  activeDataset,
  history,
  setCurrentPage,
  onLoadDatasetFromHistory
}) {
  return (
    <div>
      {/* Welcome Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)',
          borderColor: '#bae6fd',
          marginBottom: '1.75rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span className="badge badge-info">Micro-Project</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>B.Tech AI & Data Science</span>
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              Data Collection for Machine Learning
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem', maxWidth: '680px' }}>
              Collect, validate, clean, analyze, and export datasets prior to model training.
              A complete data preprocessing pipeline that ensures high-quality training inputs.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => setCurrentPage('collect')}
              className="btn btn-primary"
            >
              <PlusCircle size={16} />
              <span>Collect New Dataset</span>
            </button>
            {activeDataset && (
              <button
                onClick={() => setCurrentPage('quality')}
                className="btn btn-secondary"
              >
                <span>Inspect Current Data</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="stat-grid">
        <StatCard
          label="Datasets Ingested"
          value={sessionStats.datasetsCollected}
          icon={Database}
          subtext="Active session datasets"
        />
        <StatCard
          label="Records Processed"
          value={sessionStats.totalRecords.toLocaleString()}
          icon={Layers}
          subtext="Total instances across datasets"
        />
        <StatCard
          label="Quality Issues Detected"
          value={sessionStats.qualityIssuesDetected}
          icon={AlertTriangle}
          subtext="Missing values & duplicates"
          statusColor={sessionStats.qualityIssuesDetected > 0 ? '#d97706' : '#10b981'}
        />
        <StatCard
          label="Cleaned Datasets"
          value={sessionStats.datasetsCleaned}
          icon={CheckCircle2}
          subtext="Preprocessed and ready for ML"
          statusColor="#059669"
        />
      </div>

      {/* Active Dataset Spotlight (if available) */}
      {activeDataset ? (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <Database size={18} style={{ color: 'var(--primary)' }} />
                <span>Active Dataset: {activeDataset.name}</span>
              </div>
              <div className="card-subtitle">
                Source: {activeDataset.source_type} • Collected at: {activeDataset.collected_at}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setCurrentPage('quality')}
                className="btn btn-secondary btn-sm"
              >
                <ShieldCheck size={14} />
                <span>Quality ({activeDataset.validation?.quality_score ?? 0}%)</span>
              </button>
              <button
                onClick={() => setCurrentPage('clean')}
                className="btn btn-secondary btn-sm"
              >
                <Sparkles size={14} />
                <span>Clean</span>
              </button>
              <button
                onClick={() => setCurrentPage('explore')}
                className="btn btn-primary btn-sm"
              >
                <BarChart3 size={14} />
                <span>Explore Statistics</span>
              </button>
            </div>
          </div>

          <div className="grid-3" style={{ marginTop: '1rem' }}>
            <div style={{ padding: '0.875rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Dimensions</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                {activeDataset.total_rows} rows × {activeDataset.total_columns} columns
              </div>
            </div>
            <div style={{ padding: '0.875rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Data Health Score</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 600, color: activeDataset.validation?.quality_score > 80 ? 'var(--success-text)' : 'var(--warning-text)', marginTop: '0.2rem' }}>
                {activeDataset.validation?.quality_score ?? 0} / 100
              </div>
            </div>
            <div style={{ padding: '0.875rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Preprocessing Status</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 600, color: activeDataset.cleaned_data ? 'var(--success-text)' : 'var(--text-secondary)', marginTop: '0.2rem' }}>
                {activeDataset.cleaned_data ? 'Cleaned & Ready' : 'Unprocessed (Raw)'}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="empty-state" style={{ marginBottom: '1.5rem' }}>
          <Database className="empty-icon" />
          <h3 className="empty-title">No Active Dataset Loaded</h3>
          <p className="empty-desc">
            Load one of the bundled sample datasets or upload a CSV file to begin data validation and machine learning preparation.
          </p>
          <button
            onClick={() => setCurrentPage('collect')}
            className="btn btn-primary"
          >
            <PlusCircle size={16} />
            <span>Choose a Dataset to Start</span>
          </button>
        </div>
      )}

      {/* ML Pipeline Flow Diagram */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <span>Machine Learning Data Preparation Lifecycle</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Best Practice Workflow
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
          {[
            { step: '1. Collect', desc: 'Ingest CSV, manual tables, or sample data.', color: '#0284c7' },
            { step: '2. Validate', desc: 'Audit missing values, duplicate rows & types.', color: '#0369a1' },
            { step: '3. Clean', desc: 'Impute missing features and drop duplicates.', color: '#0d9488' },
            { step: '4. Explore', desc: 'Study distributions, statistics & correlations.', color: '#16a34a' },
            { step: '5. Export', desc: 'Download ML-ready CSV and JSON metadata.', color: '#4f46e5' }
          ].map((item, i) => (
            <div
              key={i}
              style={{
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                backgroundColor: 'var(--bg-subtle)'
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: item.color, marginBottom: '0.25rem' }}>
                {item.step}
              </div>
              <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
                {item.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Session Activity */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Clock size={16} />
            <span>Recent Dataset Activity</span>
          </div>
          <button
            onClick={() => setCurrentPage('history')}
            className="btn btn-secondary btn-sm"
          >
            <span>View All History</span>
          </button>
        </div>

        {history && history.length > 0 ? (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Dataset Name</th>
                  <th>Source</th>
                  <th>Rows</th>
                  <th>Columns</th>
                  <th>Quality Score</th>
                  <th>Cleaning Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {history.slice(0, 5).map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600 }}>{item.name}</td>
                    <td>
                      <span className="badge badge-neutral">{item.source_type}</span>
                    </td>
                    <td>{item.total_rows}</td>
                    <td>{item.total_columns}</td>
                    <td>
                      <span className={`badge ${item.quality_score >= 80 ? 'badge-success' : 'badge-warning'}`}>
                        {item.quality_score}%
                      </span>
                    </td>
                    <td>
                      {item.is_cleaned ? (
                        <span className="badge badge-success">Cleaned</span>
                      ) : (
                        <span className="badge badge-neutral">Raw</span>
                      )}
                    </td>
                    <td>
                      <button
                        onClick={() => onLoadDatasetFromHistory(item.id)}
                        className="btn btn-secondary btn-sm"
                      >
                        Load
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No recent activity recorded. Datasets loaded during this session will appear here.
          </div>
        )}
      </div>
    </div>
  );
}
