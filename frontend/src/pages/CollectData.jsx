import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  Edit3,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  RefreshCw,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { fetchSampleDatasets, loadSampleDataset, uploadDatasetFile, submitManualDataset } from '../services/api';
import AlertBanner from '../components/AlertBanner';

export default function CollectData({ onDatasetLoaded, setCurrentPage }) {
  const [activeTab, setActiveTab] = useState('samples'); // 'samples' | 'upload' | 'manual'
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // File Upload State
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');

  // Manual Entry State
  const [manualName, setManualName] = useState('Custom ML Sample');
  const [manualDesc, setManualDesc] = useState('Manually curated dataset for classification test');
  const [manualColumns, setManualColumns] = useState(['age', 'income', 'credit_score', 'loan_approved']);
  const [manualRows, setManualRows] = useState([
    { age: '25', income: '45000', credit_score: '680', loan_approved: 'Yes' },
    { age: '34', income: '72000', credit_score: '740', loan_approved: 'Yes' },
    { age: '45', income: '31000', credit_score: '590', loan_approved: 'No' },
    { age: '29', income: '', credit_score: '650', loan_approved: 'Yes' }, // intentional missing
    { age: '52', income: '88000', credit_score: '790', loan_approved: 'Yes' },
    { age: '25', income: '45000', credit_score: '680', loan_approved: 'Yes' }, // intentional duplicate
  ]);
  const [newColName, setNewColName] = useState('');

  useEffect(() => {
    loadSamplesList();
  }, []);

  const loadSamplesList = async () => {
    try {
      const data = await fetchSampleDatasets();
      setSamples(data.samples || []);
    } catch (err) {
      console.warn('Could not load sample list from backend, using fallback list', err);
      setSamples([
        {
          id: 'student_performance',
          name: 'Student Exam Performance',
          description: 'Tracks study hours, attendance, parental education, and test scores with missing values & duplicates.',
          target_variable: 'final_score',
          task_type: 'Regression'
        },
        {
          id: 'house_prices',
          name: 'Residential Real Estate Valuation',
          description: 'Property area, bedrooms, location type, and pricing. Features null values and duplicate listings.',
          target_variable: 'price_in_lakhs',
          task_type: 'Regression'
        }
      ]);
    }
  };

  const handleSelectSample = async (sampleId) => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const dataset = await loadSampleDataset(sampleId);
      onDatasetLoaded(dataset);
      setSuccessMsg(`Successfully loaded "${dataset.name}" (${dataset.total_rows} rows).`);
      setTimeout(() => {
        setCurrentPage('quality');
      }, 700);
    } catch (err) {
      setError(err.message || 'Failed to load sample dataset.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      setError('Please select a CSV or JSON file from your computer.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('name', uploadName || uploadFile.name.replace(/\.[^/.]+$/, ''));
    formData.append('description', uploadDesc);

    try {
      const dataset = await uploadDatasetFile(formData);
      onDatasetLoaded(dataset);
      setSuccessMsg(`Dataset "${dataset.name}" successfully parsed (${dataset.total_rows} records).`);
      setTimeout(() => {
        setCurrentPage('quality');
      }, 700);
    } catch (err) {
      setError(err.message || 'Error uploading file.');
    } finally {
      setLoading(false);
    }
  };

  // Manual Table Helpers
  const addManualRow = () => {
    const emptyRow = {};
    manualColumns.forEach((c) => {
      emptyRow[c] = '';
    });
    setManualRows([...manualRows, emptyRow]);
  };

  const removeManualRow = (index) => {
    if (manualRows.length <= 1) return;
    setManualRows(manualRows.filter((_, i) => i !== index));
  };

  const updateManualCell = (rowIndex, col, value) => {
    const updated = [...manualRows];
    updated[rowIndex] = { ...updated[rowIndex], [col]: value };
    setManualRows(updated);
  };

  const addColumn = () => {
    const col = newColName.trim();
    if (!col || manualColumns.includes(col)) return;
    setManualColumns([...manualColumns, col]);
    setManualRows(manualRows.map((r) => ({ ...r, [col]: '' })));
    setNewColName('');
  };

  const removeColumn = (colToRemove) => {
    if (manualColumns.length <= 1) return;
    setManualColumns(manualColumns.filter((c) => c !== colToRemove));
    setManualRows(
      manualRows.map((r) => {
        const copy = { ...r };
        delete copy[colToRemove];
        return copy;
      })
    );
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const payload = {
        name: manualName,
        description: manualDesc,
        columns: manualColumns,
        rows: manualRows
      };
      const dataset = await submitManualDataset(payload);
      onDatasetLoaded(dataset);
      setSuccessMsg(`Manual dataset saved and verified (${dataset.total_rows} rows).`);
      setTimeout(() => {
        setCurrentPage('quality');
      }, 700);
    } catch (err) {
      setError(err.message || 'Error submitting manual dataset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Alert Notices */}
      {error && <AlertBanner type="danger" title="Collection Error" message={error} />}
      {successMsg && <AlertBanner type="success" title="Success" message={successMsg} />}

      {/* Tabs */}
      <div className="tabs-nav">
        <button
          onClick={() => setActiveTab('samples')}
          className={`tab-btn ${activeTab === 'samples' ? 'active' : ''}`}
        >
          <FileSpreadsheet size={16} />
          <span>Bundled Sample Datasets</span>
        </button>

        <button
          onClick={() => setActiveTab('upload')}
          className={`tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
        >
          <UploadCloud size={16} />
          <span>Upload CSV File</span>
        </button>

        <button
          onClick={() => setActiveTab('manual')}
          className={`tab-btn ${activeTab === 'manual' ? 'active' : ''}`}
        >
          <Edit3 size={16} />
          <span>Manual Data Entry</span>
        </button>
      </div>

      {/* Tab 1: Bundled Samples */}
      {activeTab === 'samples' && (
        <div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
            Choose a pre-configured sample dataset. Each dataset includes realistic features, along with intentional
            data quality issues (missing values and duplicate rows) to demonstrate automated validation and cleaning.
          </p>

          <div className="grid-2">
            {samples.map((sample) => (
              <div key={sample.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      {sample.name}
                    </h3>
                    <span className="badge badge-info">{sample.task_type || 'ML Benchmark'}</span>
                  </div>

                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.5 }}>
                    {sample.description}
                  </p>

                  <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', fontSize: '0.75rem', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Target Variable:</span>
                      <strong style={{ color: 'var(--text-main)' }}>{sample.target_variable || 'N/A'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Data Defects:</span>
                      <span style={{ color: 'var(--warning-text)', fontWeight: 600 }}>Includes missing cells & duplicate records</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleSelectSample(sample.id)}
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                >
                  {loading ? (
                    <>
                      <RefreshCw size={16} className="spin" />
                      <span>Loading Dataset...</span>
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet size={16} />
                      <span>Load Dataset</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: CSV Upload */}
      {activeTab === 'upload' && (
        <div className="card" style={{ maxWidth: '720px' }}>
          <div className="card-header">
            <div className="card-title">
              <UploadCloud size={18} style={{ color: 'var(--primary)' }} />
              <span>Upload CSV / JSON Dataset</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Max file size: 10MB</span>
          </div>

          <form onSubmit={handleFileUpload}>
            <div className="form-group">
              <label className="form-label">Dataset Display Name</label>
              <input
                type="text"
                placeholder="e.g., Customer Churn Data 2026"
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description / Source Details</label>
              <textarea
                rows={2}
                placeholder="Provide context regarding feature definitions, target labels, or data collection methodology..."
                value={uploadDesc}
                onChange={(e) => setUploadDesc(e.target.value)}
                className="form-textarea"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Select File (*.csv, *.txt, *.json)</label>
              <div
                style={{
                  border: '2px dashed var(--border-medium)',
                  borderRadius: 'var(--radius-md)',
                  padding: '2rem 1rem',
                  textAlign: 'center',
                  backgroundColor: 'var(--bg-subtle)',
                  cursor: 'pointer'
                }}
                onClick={() => document.getElementById('csv-file-input').click()}
              >
                <UploadCloud size={32} style={{ color: 'var(--primary)', margin: '0 auto 0.5rem' }} />
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  {uploadFile ? uploadFile.name : 'Click to browse or drop file here'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  {uploadFile ? `${(uploadFile.size / 1024).toFixed(1)} KB selected` : 'Supports standard comma-separated and JSON formats'}
                </div>
                <input
                  id="csv-file-input"
                  type="file"
                  accept=".csv,.txt,.json"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setUploadFile(e.target.files[0]);
                      if (!uploadName) {
                        setUploadName(e.target.files[0].name.replace(/\.[^/.]+$/, ''));
                      }
                    }
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                type="button"
                onClick={() => {
                  setUploadFile(null);
                  setUploadName('');
                  setUploadDesc('');
                }}
                className="btn btn-secondary"
                disabled={loading}
              >
                Clear
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !uploadFile}
              >
                {loading ? 'Processing Dataset...' : 'Upload & Validate'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 3: Manual Data Entry */}
      {activeTab === 'manual' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Edit3 size={18} style={{ color: 'var(--primary)' }} />
              <span>Interactive Data Entry Grid</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Edit values, add columns, or simulate missing/duplicate cells
            </span>
          </div>

          <form onSubmit={handleManualSubmit}>
            <div className="grid-2" style={{ marginBottom: '1.25rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Dataset Name</label>
                <input
                  type="text"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Description</label>
                <input
                  type="text"
                  value={manualDesc}
                  onChange={(e) => setManualDesc(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            {/* Column Management Toolbar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="New column name..."
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  className="form-input"
                  style={{ height: '32px', fontSize: '0.8rem', width: '180px' }}
                />
                <button
                  type="button"
                  onClick={addColumn}
                  className="btn btn-secondary btn-sm"
                >
                  <Plus size={14} /> Add Column
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={addManualRow}
                  className="btn btn-secondary btn-sm"
                >
                  <Plus size={14} /> Add Row
                </button>
                <span className="badge badge-neutral">
                  {manualRows.length} rows × {manualColumns.length} columns
                </span>
              </div>
            </div>

            {/* Editable Table */}
            <div className="table-wrapper" style={{ maxHeight: '380px', overflowY: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>#</th>
                    {manualColumns.map((col) => (
                      <th key={col}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                          <span>{col}</span>
                          {manualColumns.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeColumn(col)}
                              title="Delete column"
                              style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', opacity: 0.7 }}
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </th>
                    ))}
                    <th style={{ width: '50px' }}>Del</th>
                  </tr>
                </thead>
                <tbody>
                  {manualRows.map((row, rIdx) => (
                    <tr key={rIdx}>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{rIdx + 1}</td>
                      {manualColumns.map((col) => (
                        <td key={col} style={{ padding: '0.35rem 0.5rem' }}>
                          <input
                            type="text"
                            value={row[col] ?? ''}
                            onChange={(e) => updateManualCell(rIdx, col, e.target.value)}
                            placeholder="empty (null)"
                            style={{
                              width: '100%',
                              padding: '0.35rem',
                              fontSize: '0.8rem',
                              border: '1px solid var(--border-light)',
                              borderRadius: 'var(--radius-sm)',
                              outline: 'none',
                              backgroundColor: row[col] === '' ? 'var(--danger-bg)' : '#fff'
                            }}
                          />
                        </td>
                      ))}
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => removeManualRow(rIdx)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                          title="Remove row"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button
                type="submit"
                disabled={loading || manualRows.length === 0}
                className="btn btn-primary"
              >
                {loading ? 'Validating Table...' : 'Save & Inspect Quality'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
