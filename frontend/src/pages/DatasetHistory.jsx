import React, { useState } from 'react';
import {
  History,
  Download,
  Trash2,
  FileSpreadsheet,
  FileJson,
  CheckCircle2,
  RefreshCw,
  FolderDown,
  Database
} from 'lucide-react';
import { downloadCsv, downloadJson } from '../services/api';
import AlertBanner from '../components/AlertBanner';

export default function DatasetHistory({
  activeDataset,
  history,
  onLoadDatasetFromHistory,
  onClearHistory,
  setCurrentPage
}) {
  const [downloading, setDownloading] = useState(false);
  const [msg, setMsg] = useState(null);

  const handleExportRawCsv = async () => {
    if (!activeDataset) return;
    setDownloading(true);
    try {
      await downloadCsv(
        activeDataset.columns,
        activeDataset.rows,
        `${activeDataset.name.toLowerCase().replace(/\s+/g, '_')}_raw.csv`
      );
      setMsg({ type: 'success', text: 'Original CSV exported successfully!' });
    } catch (err) {
      setMsg({ type: 'danger', text: 'Failed to export raw CSV.' });
    } finally {
      setDownloading(false);
    }
  };

  const handleExportCleanedCsv = async () => {
    if (!activeDataset?.cleaned_data) return;
    setDownloading(true);
    try {
      await downloadCsv(
        activeDataset.cleaned_data.columns,
        activeDataset.cleaned_data.rows,
        `${activeDataset.name.toLowerCase().replace(/\s+/g, '_')}_cleaned.csv`
      );
      setMsg({ type: 'success', text: 'Cleaned dataset CSV exported successfully!' });
    } catch (err) {
      setMsg({ type: 'danger', text: 'Failed to export cleaned CSV.' });
    } finally {
      setDownloading(false);
    }
  };

  const handleExportSummaryJson = async () => {
    if (!activeDataset) return;
    setDownloading(true);
    try {
      const summaryPayload = {
        project: 'Data Collection for Machine Learning',
        dataset_name: activeDataset.name,
        source_type: activeDataset.source_type,
        collected_at: activeDataset.collected_at,
        original_shape: {
          rows: activeDataset.total_rows,
          columns: activeDataset.total_columns
        },
        column_schema: activeDataset.columns,
        validation_report: activeDataset.validation,
        cleaning_applied: !!activeDataset.cleaned_data,
        cleaning_audit: activeDataset.cleaned_data?.summary || null,
        cleaned_shape: activeDataset.cleaned_data
          ? {
              rows: activeDataset.cleaned_data.rows.length,
              columns: activeDataset.cleaned_data.columns.length
            }
          : null,
        exported_at: new Date().toISOString()
      };

      await downloadJson(
        summaryPayload,
        `${activeDataset.name.toLowerCase().replace(/\s+/g, '_')}_quality_report.json`
      );
      setMsg({ type: 'success', text: 'Data Quality Summary JSON exported successfully!' });
    } catch (err) {
      setMsg({ type: 'danger', text: 'Failed to export JSON report.' });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div>
      {msg && <AlertBanner type={msg.type} message={msg.text} />}

      {/* Export Center for Active Dataset */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <FolderDown size={18} style={{ color: 'var(--primary)' }} />
              <span>Export Center (Current Workspace)</span>
            </div>
            <div className="card-subtitle">
              Download clean CSVs and structured metadata for downstream ML modeling in Scikit-Learn or PyTorch
            </div>
          </div>
        </div>

        {activeDataset ? (
          <div>
            <div style={{ marginBottom: '1.25rem', padding: '0.875rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
              <strong>Current Active:</strong> {activeDataset.name} ({activeDataset.total_rows} raw rows
              {activeDataset.cleaned_data
                ? `, ${activeDataset.cleaned_data.rows.length} cleaned rows`
                : ', not yet cleaned'}
              )
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              {/* Option 1: Original CSV */}
              <div style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <FileSpreadsheet size={18} style={{ color: 'var(--text-secondary)' }} />
                  <strong style={{ fontSize: '0.875rem' }}>Original Raw CSV</strong>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Unmodified baseline dataset with raw missing and duplicate values.
                </p>
                <button
                  onClick={handleExportRawCsv}
                  disabled={downloading}
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%' }}
                >
                  <Download size={14} /> Download Original CSV
                </button>
              </div>

              {/* Option 2: Cleaned CSV */}
              <div
                style={{
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  backgroundColor: activeDataset.cleaned_data ? 'var(--success-bg)' : '#fff'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <CheckCircle2 size={18} style={{ color: 'var(--success-text)' }} />
                  <strong style={{ fontSize: '0.875rem' }}>Cleaned Preprocessed CSV</strong>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  ML-ready data with imputed missing values and duplicates removed.
                </p>
                <button
                  onClick={handleExportCleanedCsv}
                  disabled={downloading || !activeDataset.cleaned_data}
                  className="btn btn-primary btn-sm"
                  style={{ width: '100%' }}
                >
                  <Download size={14} />
                  {activeDataset.cleaned_data ? 'Download Cleaned CSV' : 'Clean Dataset First'}
                </button>
              </div>

              {/* Option 3: JSON Quality Report */}
              <div style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <FileJson size={18} style={{ color: 'var(--primary)' }} />
                  <strong style={{ fontSize: '0.875rem' }}>Quality & Audit JSON</strong>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Comprehensive audit summary containing health metrics and transformation logs.
                </p>
                <button
                  onClick={handleExportSummaryJson}
                  disabled={downloading}
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%' }}
                >
                  <Download size={14} /> Download Summary JSON
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            No dataset loaded. Please ingest or select a dataset to export files.
          </div>
        )}
      </div>

      {/* Dataset Session History Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <History size={18} style={{ color: 'var(--primary)' }} />
              <span>Browser Session Dataset History</span>
            </div>
            <div className="card-subtitle">
              Lightweight local persistence tracking datasets ingested during this browser session
            </div>
          </div>

          {history && history.length > 0 && (
            <button
              onClick={onClearHistory}
              className="btn btn-danger btn-sm"
            >
              <Trash2 size={14} />
              <span>Clear History</span>
            </button>
          )}
        </div>

        {history && history.length > 0 ? (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Dataset Name</th>
                  <th>Source</th>
                  <th>Collected At</th>
                  <th>Rows</th>
                  <th>Columns</th>
                  <th>Quality Health</th>
                  <th>Cleaned?</th>
                  <th>Workspace Action</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600 }}>{item.name}</td>
                    <td>
                      <span className="badge badge-neutral">{item.source_type}</span>
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {item.collected_at}
                    </td>
                    <td>{item.total_rows}</td>
                    <td>{item.total_columns}</td>
                    <td>
                      <span
                        className={`badge ${
                          item.quality_score >= 80 ? 'badge-success' : 'badge-warning'
                        }`}
                      >
                        {item.quality_score}%
                      </span>
                    </td>
                    <td>
                      {item.is_cleaned ? (
                        <span className="badge badge-success">
                          Cleaned ({item.cleaned_rows} rows)
                        </span>
                      ) : (
                        <span className="badge badge-neutral">Raw</span>
                      )}
                    </td>
                    <td>
                      <button
                        onClick={() => onLoadDatasetFromHistory(item.id)}
                        className="btn btn-secondary btn-sm"
                      >
                        Load Workspace
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
            <History size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.5, display: 'block' }} />
            No history stored yet. Datasets loaded or cleaned in this session are automatically recorded.
          </div>
        )}
      </div>
    </div>
  );
}
