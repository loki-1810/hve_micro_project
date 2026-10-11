import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Table,
  Layers,
  Activity,
  RefreshCw,
  Database,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from 'recharts';
import { analyzeDataset } from '../services/api';
import DataTable from '../components/DataTable';
import AlertBanner from '../components/AlertBanner';

export default function ExploreData({ activeDataset, setCurrentPage }) {
  if (!activeDataset) {
    return (
      <div className="empty-state">
        <BarChart3 className="empty-icon" />
        <h3 className="empty-title">No Dataset to Explore</h3>
        <p className="empty-desc">
          Please select or upload a dataset first to generate interactive distributions and statistical summaries.
        </p>
        <button onClick={() => setCurrentPage('collect')} className="btn btn-primary">
          <Database size={16} /> Collect Data
        </button>
      </div>
    );
  }

  const [datasetView, setDatasetView] = useState(
    activeDataset.cleaned_data ? 'cleaned' : 'raw'
  ); // 'raw' | 'cleaned'

  const [activeTab, setActiveTab] = useState('visualizations'); // 'visualizations' | 'statistics' | 'correlations' | 'table'
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Selected feature for distribution visualization
  const [selectedNumCol, setSelectedNumCol] = useState('');
  const [selectedCatCol, setSelectedCatCol] = useState('');

  // Determine current active columns & rows based on toggle
  const currentColumns =
    datasetView === 'cleaned' && activeDataset.cleaned_data
      ? activeDataset.cleaned_data.columns
      : activeDataset.columns;

  const currentRows =
    datasetView === 'cleaned' && activeDataset.cleaned_data
      ? activeDataset.cleaned_data.rows
      : activeDataset.rows;

  useEffect(() => {
    runAnalysis();
  }, [datasetView, activeDataset]);

  const runAnalysis = async () => {
    if (!currentColumns || !currentRows || currentRows.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await analyzeDataset(currentColumns, currentRows);
      setAnalysis(res.analysis);

      // Default selected columns
      if (res.analysis?.numerical_columns?.length > 0) {
        setSelectedNumCol(res.analysis.numerical_columns[0]);
      }
      if (res.analysis?.categorical_columns?.length > 0) {
        setSelectedCatCol(res.analysis.categorical_columns[0]);
      }
    } catch (err) {
      setError(err.message || 'Failed to compute dataset analysis.');
    } finally {
      setLoading(false);
    }
  };

  const numStats = analysis?.numerical_statistics || {};
  const catStats = analysis?.categorical_statistics || {};
  const histograms = analysis?.histograms || {};
  const catCharts = analysis?.categorical_charts || {};
  const correlations = analysis?.correlations || { columns: [], matrix: [] };

  return (
    <div>
      {error && <AlertBanner type="danger" title="Analysis Error" message={error} />}

      {/* Dataset State Toggle Header */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {activeDataset.name}
              </h3>
              <span className="badge badge-neutral">
                {currentRows.length} rows × {currentColumns.length} columns
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Inspecting statistical distribution profiles for machine learning feature selection
            </div>
          </div>

          {activeDataset.cleaned_data && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--bg-subtle)', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
              <button
                type="button"
                onClick={() => setDatasetView('raw')}
                className={`btn btn-sm ${datasetView === 'raw' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ border: 'none' }}
              >
                Raw Data ({activeDataset.rows.length} rows)
              </button>
              <button
                type="button"
                onClick={() => setDatasetView('cleaned')}
                className={`btn btn-sm ${datasetView === 'cleaned' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ border: 'none' }}
              >
                <CheckCircle size={12} /> Cleaned Data ({activeDataset.cleaned_data.rows.length} rows)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Exploration View Tabs */}
      <div className="tabs-nav">
        <button
          onClick={() => setActiveTab('visualizations')}
          className={`tab-btn ${activeTab === 'visualizations' ? 'active' : ''}`}
        >
          <BarChart3 size={16} />
          <span>Distributions & Histograms</span>
        </button>

        <button
          onClick={() => setActiveTab('statistics')}
          className={`tab-btn ${activeTab === 'statistics' ? 'active' : ''}`}
        >
          <Activity size={16} />
          <span>Descriptive Statistics</span>
        </button>

        <button
          onClick={() => setActiveTab('correlations')}
          className={`tab-btn ${activeTab === 'correlations' ? 'active' : ''}`}
        >
          <Layers size={16} />
          <span>Feature Correlation Matrix</span>
        </button>

        <button
          onClick={() => setActiveTab('table')}
          className={`tab-btn ${activeTab === 'table' ? 'active' : ''}`}
        >
          <Table size={16} />
          <span>Records Browser</span>
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <RefreshCw size={24} className="spin" style={{ margin: '0 auto 0.5rem', display: 'block' }} />
          Computing statistical distributions and chart bins...
        </div>
      ) : (
        <>
          {/* Tab 1: Visualizations */}
          {activeTab === 'visualizations' && (
            <div className="grid-2">
              {/* Numerical Histogram */}
              <div className="card">
                <div className="card-header">
                  <div>
                    <div className="card-title">
                      <span>Numerical Feature Histogram</span>
                    </div>
                    <div className="card-subtitle">
                      Inspect skewness, normality, and outlier spread
                    </div>
                  </div>

                  {analysis?.numerical_columns?.length > 0 && (
                    <select
                      value={selectedNumCol}
                      onChange={(e) => setSelectedNumCol(e.target.value)}
                      className="form-select"
                      style={{ width: 'auto', height: '30px', fontSize: '0.8rem' }}
                    >
                      {analysis.numerical_columns.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {selectedNumCol && histograms[selectedNumCol] ? (
                  <div style={{ width: '100%', height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={histograms[selectedNumCol]}
                        margin={{ top: 10, right: 10, left: -10, bottom: 25 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis
                          dataKey="range"
                          tick={{ fontSize: 11, fill: '#64748b' }}
                          angle={-15}
                          textAnchor="end"
                        />
                        <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.75rem'
                          }}
                        />
                        <Bar dataKey="count" fill="#0284c7" radius={[4, 4, 0, 0]} name="Frequency" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No numerical columns available for histogram plotting.
                  </div>
                )}
              </div>

              {/* Categorical Distribution Chart */}
              <div className="card">
                <div className="card-header">
                  <div>
                    <div className="card-title">
                      <span>Categorical Class Frequencies</span>
                    </div>
                    <div className="card-subtitle">
                      Inspect category balance for classification targets
                    </div>
                  </div>

                  {analysis?.categorical_columns?.length > 0 && (
                    <select
                      value={selectedCatCol}
                      onChange={(e) => setSelectedCatCol(e.target.value)}
                      className="form-select"
                      style={{ width: 'auto', height: '30px', fontSize: '0.8rem' }}
                    >
                      {analysis.categorical_columns.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {selectedCatCol && catCharts[selectedCatCol] ? (
                  <div style={{ width: '100%', height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={catCharts[selectedCatCol]}
                        margin={{ top: 10, right: 10, left: -10, bottom: 25 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis
                          dataKey="category"
                          tick={{ fontSize: 11, fill: '#64748b' }}
                          angle={-15}
                          textAnchor="end"
                        />
                        <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.75rem'
                          }}
                        />
                        <Bar dataKey="count" fill="#0d9488" radius={[4, 4, 0, 0]} name="Count" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No categorical features available for frequency bar plotting.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Descriptive Statistics Table */}
          {activeTab === 'statistics' && (
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">
                    <Activity size={18} style={{ color: 'var(--primary)' }} />
                    <span>Numerical Descriptive Statistics Summary</span>
                  </div>
                  <div className="card-subtitle">
                    Standard central tendency, dispersion, and shape parameters for ML modeling
                  </div>
                </div>
              </div>

              {Object.keys(numStats).length > 0 ? (
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Feature</th>
                        <th>Count</th>
                        <th>Missing</th>
                        <th>Mean</th>
                        <th>Std Dev</th>
                        <th>Min</th>
                        <th>25% (Q1)</th>
                        <th>Median (50%)</th>
                        <th>75% (Q3)</th>
                        <th>Max</th>
                        <th>Skewness</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(numStats).map(([col, s]) => (
                        <tr key={col}>
                          <td style={{ fontWeight: 600 }}>{col}</td>
                          <td>{s.count}</td>
                          <td>{s.missing > 0 ? <span className="cell-null">{s.missing}</span> : 0}</td>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>{s.mean ?? '—'}</td>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>{s.std ?? '—'}</td>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>{s.min ?? '—'}</td>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>{s.p25 ?? '—'}</td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--primary)' }}>
                            {s.median ?? '—'}
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>{s.p75 ?? '—'}</td>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>{s.max ?? '—'}</td>
                          <td style={{ fontFamily: 'var(--font-mono)', color: Math.abs(s.skew || 0) > 1 ? 'var(--warning-text)' : 'var(--text-main)' }}>
                            {s.skew ?? '0.0'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No numerical columns found in this dataset.
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Correlation Matrix */}
          {activeTab === 'correlations' && (
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">
                    <Layers size={18} style={{ color: 'var(--primary)' }} />
                    <span>Pairwise Pearson Correlation Matrix (r)</span>
                  </div>
                  <div className="card-subtitle">
                    Identifies multicollinearity between features and strong linear predictors
                  </div>
                </div>
              </div>

              {correlations.matrix && correlations.matrix.length > 0 ? (
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Feature</th>
                        {correlations.columns.map((c) => (
                          <th key={c}>{c}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {correlations.matrix.map((row) => (
                        <tr key={row.column}>
                          <td style={{ fontWeight: 600 }}>{row.column}</td>
                          {row.values.map((v) => {
                            const val = v.value;
                            // Color intensity based on correlation strength
                            const isSelf = row.column === v.x;
                            const isPositive = val > 0;
                            const alpha = Math.min(Math.abs(val), 1);
                            const bg = isSelf
                              ? '#f1f5f9'
                              : isPositive
                              ? `rgba(2, 132, 199, ${alpha * 0.35})`
                              : `rgba(239, 68, 68, ${alpha * 0.35})`;

                            return (
                              <td
                                key={v.x}
                                style={{
                                  backgroundColor: bg,
                                  textAlign: 'center',
                                  fontFamily: 'var(--font-mono)',
                                  fontSize: '0.8rem',
                                  fontWeight: Math.abs(val) > 0.5 ? 600 : 400
                                }}
                              >
                                {val.toFixed(2)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  At least 2 numerical features are required to compute pairwise correlations.
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Raw Records Viewer */}
          {activeTab === 'table' && (
            <div className="card">
              <DataTable
                columns={currentColumns}
                rows={currentRows}
                title={`Active Records (${datasetView === 'cleaned' ? 'Cleaned' : 'Raw'})`}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
