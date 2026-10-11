import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle,
  RotateCcw,
  AlertCircle,
  Database,
  ArrowRight,
  Sliders,
  FileCheck2,
  Trash2,
  BarChart3
} from 'lucide-react';
import { cleanDataset } from '../services/api';
import DataTable from '../components/DataTable';
import AlertBanner from '../components/AlertBanner';

export default function CleanDataset({ activeDataset, onDatasetCleaned, setCurrentPage }) {
  if (!activeDataset) {
    return (
      <div className="empty-state">
        <Sparkles className="empty-icon" />
        <h3 className="empty-title">No Dataset Selected for Cleaning</h3>
        <p className="empty-desc">
          Load or upload a dataset first so that automated preprocessing operations can be executed.
        </p>
        <button onClick={() => setCurrentPage('collect')} className="btn btn-primary">
          <Database size={16} /> Collect Data
        </button>
      </div>
    );
  }

  const { columns = [], rows = [], validation = {}, cleaned_data, name } = activeDataset;
  const { numerical_columns = [], categorical_columns = [], duplicate_rows_count = 0 } = validation;

  // Cleaning Form States
  const [removeDuplicates, setRemoveDuplicates] = useState(true);
  const [globalStrategy, setGlobalStrategy] = useState('impute_auto'); // 'impute_auto' | 'drop_rows' | 'custom'
  const [columnStrategies, setColumnStrategies] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successNotice, setSuccessNotice] = useState(null);

  // Initialize or update per-column strategies
  const handleColActionChange = (col, action) => {
    setColumnStrategies((prev) => ({
      ...prev,
      [col]: { ...(prev[col] || {}), action }
    }));
  };

  const handleColCustomValueChange = (col, value) => {
    setColumnStrategies((prev) => ({
      ...prev,
      [col]: { ...(prev[col] || {}), value }
    }));
  };

  const handleRunCleaning = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessNotice(null);

    const rules = {
      remove_duplicates: removeDuplicates,
      global_missing_strategy: globalStrategy,
      column_strategies: globalStrategy === 'custom' ? columnStrategies : {}
    };

    try {
      const response = await cleanDataset(columns, rows, rules);
      onDatasetCleaned({
        columns: response.cleaned_columns,
        rows: response.cleaned_rows,
        summary: response.summary,
        validation: response.validation
      });
      setSuccessNotice('Dataset successfully preprocessed! Original data is preserved intact.');
    } catch (err) {
      setError(err.message || 'Cleaning execution failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Alert Notices */}
      {error && <AlertBanner type="danger" title="Cleaning Failed" message={error} />}
      {successNotice && <AlertBanner type="success" title="Success" message={successNotice} />}

      {/* Cleaning Config Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <Sliders size={18} style={{ color: 'var(--primary)' }} />
              <span>Preprocessing Configuration: {name}</span>
            </div>
            <div className="card-subtitle">
              Configure parameters to remediate missing observations and duplicate entries
            </div>
          </div>
          {cleaned_data && (
            <span className="badge badge-success">
              <CheckCircle size={12} /> Cleaned Version Available
            </span>
          )}
        </div>

        <form onSubmit={handleRunCleaning}>
          {/* Section 1: Duplicate Rows */}
          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={removeDuplicates}
                onChange={(e) => setRemoveDuplicates(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
              />
              <div>
                <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-main)' }}>
                  Remove exact duplicate rows
                </span>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {duplicate_rows_count > 0
                    ? `Identified ${duplicate_rows_count} redundant duplicate rows ready for removal.`
                    : 'No duplicate rows currently detected in raw data.'}
                </span>
              </div>
            </label>
          </div>

          {/* Section 2: Missing Value Strategy */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label className="form-label">Strategy for Handling Missing Values</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem', marginTop: '0.5rem' }}>
              <label
                style={{
                  border: `1px solid ${globalStrategy === 'impute_auto' ? 'var(--primary)' : 'var(--border-medium)'}`,
                  backgroundColor: globalStrategy === 'impute_auto' ? 'var(--primary-light)' : '#fff',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <input
                    type="radio"
                    name="strategy"
                    value="impute_auto"
                    checked={globalStrategy === 'impute_auto'}
                    onChange={() => setGlobalStrategy('impute_auto')}
                    style={{ accentColor: 'var(--primary)' }}
                  />
                  <strong style={{ fontSize: '0.875rem' }}>Auto Statistical Imputation</strong>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '1.4rem' }}>
                  Imputes numerical nulls with Median (outlier robust) and categorical nulls with Mode.
                </div>
              </label>

              <label
                style={{
                  border: `1px solid ${globalStrategy === 'drop_rows' ? 'var(--primary)' : 'var(--border-medium)'}`,
                  backgroundColor: globalStrategy === 'drop_rows' ? 'var(--primary-light)' : '#fff',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <input
                    type="radio"
                    name="strategy"
                    value="drop_rows"
                    checked={globalStrategy === 'drop_rows'}
                    onChange={() => setGlobalStrategy('drop_rows')}
                    style={{ accentColor: 'var(--primary)' }}
                  />
                  <strong style={{ fontSize: '0.875rem' }}>Drop Incomplete Rows</strong>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '1.4rem' }}>
                  Removes any instance containing one or more missing values (listwise deletion).
                </div>
              </label>

              <label
                style={{
                  border: `1px solid ${globalStrategy === 'custom' ? 'var(--primary)' : 'var(--border-medium)'}`,
                  backgroundColor: globalStrategy === 'custom' ? 'var(--primary-light)' : '#fff',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <input
                    type="radio"
                    name="strategy"
                    value="custom"
                    checked={globalStrategy === 'custom'}
                    onChange={() => setGlobalStrategy('custom')}
                    style={{ accentColor: 'var(--primary)' }}
                  />
                  <strong style={{ fontSize: '0.875rem' }}>Custom Per-Column Rules</strong>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '1.4rem' }}>
                  Manually define Mean, Median, Mode, or Constant value for individual columns.
                </div>
              </label>
            </div>
          </div>

          {/* Section 3: Custom Per-Column Matrix */}
          {globalStrategy === 'custom' && (
            <div style={{ marginTop: '1.25rem', marginBottom: '1.5rem', padding: '1rem', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-subtle)' }}>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.75rem', color: 'var(--text-main)' }}>
                Per-Column Imputation Matrix
              </div>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Column</th>
                      <th>Type</th>
                      <th>Cleaning Action</th>
                      <th>Custom Value (if applicable)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {columns.map((col) => {
                      const isNum = numerical_columns.includes(col);
                      const currentRule = columnStrategies[col] || { action: 'none', value: '' };
                      return (
                        <tr key={col}>
                          <td style={{ fontWeight: 600 }}>{col}</td>
                          <td>
                            <span className={`badge ${isNum ? 'badge-info' : 'badge-neutral'}`}>
                              {isNum ? 'numerical' : 'categorical'}
                            </span>
                          </td>
                          <td>
                            <select
                              value={currentRule.action}
                              onChange={(e) => handleColActionChange(col, e.target.value)}
                              className="form-select"
                              style={{ height: '30px', fontSize: '0.8rem' }}
                            >
                              <option value="none">No Action (Keep as is)</option>
                              <option value="drop_rows">Drop Affected Rows</option>
                              {isNum && <option value="median">Fill with Median</option>}
                              {isNum && <option value="mean">Fill with Mean</option>}
                              {!isNum && <option value="mode">Fill with Mode (Frequent)</option>}
                              <option value="constant">Fill with Custom Value</option>
                            </select>
                          </td>
                          <td>
                            {currentRule.action === 'constant' ? (
                              <input
                                type="text"
                                placeholder={isNum ? 'e.g., 0.0' : 'e.g., Unknown'}
                                value={currentRule.value || ''}
                                onChange={(e) => handleColCustomValueChange(col, e.target.value)}
                                className="form-input"
                                style={{ height: '30px', fontSize: '0.8rem' }}
                              />
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              <Sparkles size={16} />
              <span>{loading ? 'Cleaning Dataset...' : 'Apply Cleaning Operations'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Before and After Comparison (When Cleaned) */}
      {cleaned_data && (
        <>
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">
                  <FileCheck2 size={18} style={{ color: 'var(--success)' }} />
                  <span>Before & After Cleaning Audit</span>
                </div>
                <div className="card-subtitle">
                  Comparison between the preserved raw dataset and the clean preprocessed dataset
                </div>
              </div>
              <button
                onClick={() => setCurrentPage('explore')}
                className="btn btn-primary btn-sm"
              >
                <BarChart3 size={14} />
                <span>Explore Cleaned Charts</span>
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="grid-3" style={{ marginBottom: '1.25rem' }}>
              <div style={{ padding: '1rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Row Retention</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '0.2rem' }}>
                  {cleaned_data.rows.length} <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-muted)' }}>from {rows.length} rows</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: cleaned_data.summary.rows_dropped > 0 ? 'var(--warning-text)' : 'var(--success-text)', marginTop: '0.2rem' }}>
                  {cleaned_data.summary.rows_dropped > 0
                    ? `Dropped ${cleaned_data.summary.rows_dropped} rows (${cleaned_data.summary.duplicates_removed} duplicates)`
                    : 'All original rows retained'}
                </div>
              </div>

              <div style={{ padding: '1rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Missing Values Resolved</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success-text)', marginTop: '0.2rem' }}>
                  {cleaned_data.summary.missing_cells_resolved} cells
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Remaining nulls: {cleaned_data.summary.final_missing_cells}
                </div>
              </div>

              <div style={{ padding: '1rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Quality Health Improvement</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success-text)', marginTop: '0.2rem' }}>
                  {validation.quality_score}% → {cleaned_data.validation.quality_score}%
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Ready for machine learning estimators
                </div>
              </div>
            </div>

            {/* Operations Audit Log */}
            {cleaned_data.summary.operations && cleaned_data.summary.operations.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Transformation Audit Trail:
                </div>
                <ul style={{ fontSize: '0.8125rem', color: 'var(--text-main)', paddingLeft: '1.25rem', lineHeight: 1.6 }}>
                  {cleaned_data.summary.duplicates_removed > 0 && (
                    <li>
                      Removed <strong>{cleaned_data.summary.duplicates_removed}</strong> duplicate records.
                    </li>
                  )}
                  {cleaned_data.summary.operations.map((op, i) => (
                    <li key={i}>{op.note}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Cleaned Dataset Preview Table */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <CheckCircle size={18} style={{ color: 'var(--success)' }} />
                <span>Cleaned Dataset Preview (Non-Destructive)</span>
              </div>
              <span className="badge badge-success">
                {cleaned_data.rows.length} rows × {cleaned_data.columns.length} cols
              </span>
            </div>
            <DataTable
              columns={cleaned_data.columns}
              rows={cleaned_data.rows}
              title="Cleaned Records Preview"
            />
          </div>
        </>
      )}
    </div>
  );
}
